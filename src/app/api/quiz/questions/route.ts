import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyParticipantRequest } from "@/lib/session";
import { isQuizScheduleOpen } from "@/lib/event-config";
import {
  getOrCreateShuffledAttemptSequence,
  buildClientQuestionsFromMapping,
} from "@/lib/quiz-randomizer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "কুইজের নাম দিন" }, { status: 400 });
    }

    // 1. Check central schedule in Asia/Kolkata
    const schedule = await isQuizScheduleOpen(slug);
    if (!schedule.isOpen) {
      return NextResponse.json({ error: schedule.message }, { status: 403 });
    }

    // 2. Fetch event
    const event = await prisma.quizEvent.findUnique({
      where: { slug },
      include: {
        questions: {
          where: { isActive: true },
          include: {
            options: {
              select: {
                id: true,
                optionKey: true,
                optionText: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "কুইজটি পাওয়া যায়নি" }, { status: 404 });
    }

    if (!event.isOpen) {
      return NextResponse.json({ error: "এই কুইজটি বর্তমানে বন্ধ আছে" }, { status: 403 });
    }

    // 3. Verify participant session
    const session = await verifyParticipantRequest(req);
    let existingAttempt = null;
    let hasWatchedBlessing = false;

    if (session) {
      existingAttempt = await prisma.quizAttempt.findUnique({
        where: {
          participantId_quizEventId: {
            participantId: session.participantId,
            quizEventId: event.id,
          },
        },
      });

      const participant = await prisma.participant.findUnique({
        where: { id: session.participantId },
        select: { blessingVideoCompleted: true },
      });
      hasWatchedBlessing = !!participant?.blessingVideoCompleted;
    }

    // If attempt is already invalidated, return immediately
    const { getQuizSecuritySettings, STRICT_EXIT_MESSAGE_BN } = await import("@/lib/security");
    const securitySettings = await getQuizSecuritySettings();

    // 4. Server-Side Randomization
    let clientQuestions = [];

    if (session) {
      // Create attempt record if not yet created so randomization can be permanently saved
      if (!existingAttempt) {
        existingAttempt = await prisma.quizAttempt.create({
          data: {
            participantId: session.participantId,
            quizEventId: event.id,
            durationSeconds: 0,
            status: "IN_PROGRESS",
          },
        });
      }

      // Retrieve or create persistent shuffled mapping
      const { mapping } = await getOrCreateShuffledAttemptSequence(
        existingAttempt.id,
        event.id,
        existingAttempt.shuffledQuestionsJson
      );

      clientQuestions = buildClientQuestionsFromMapping(mapping, event.questions);
    } else {
      // Non-authenticated preview: basic sanitized questions
      clientQuestions = event.questions.map((q, idx) => ({
        id: q.id,
        questionNumber: idx + 1,
        questionText: q.questionText,
        options: q.options.map((opt) => ({
          id: opt.id,
          optionKey: opt.optionKey,
          optionText: opt.optionText,
        })),
      }));
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        dayNumber: event.dayNumber,
        slug: event.slug,
        title: event.title,
        subtitle: event.subtitle,
        description: event.description,
        timeLimitSeconds: 3600, // 60 minutes
        totalQuestions: event.questions.length,
      },
      hasAlreadySubmitted: existingAttempt?.isCompleted || false,
      existingScore: existingAttempt?.score ?? null,
      attemptId: existingAttempt?.id ?? null,
      attemptStatus: existingAttempt?.status ?? null,
      isInvalidated: existingAttempt?.isInvalidated || false,
      invalidationReason: existingAttempt?.invalidationReason || STRICT_EXIT_MESSAGE_BN,
      warningCount: existingAttempt?.warningCount ?? 0,
      hasWatchedBlessing,
      securitySettings,
      questions: clientQuestions,
    });
  } catch (err: any) {
    console.error("Quiz questions fetch error:", err);
    return NextResponse.json({ error: "প্রশ্ন লোড করতে ব্যর্থ" }, { status: 500 });
  }
}
