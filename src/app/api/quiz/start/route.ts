import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyParticipantRequest } from "@/lib/session";
import { getQuizSecuritySettings, STRICT_EXIT_MESSAGE_BN } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyParticipantRequest(req);
    if (!session) {
      return NextResponse.json(
        { error: "কুইজ শুরু করতে প্রথমে নাম নিবন্ধন করুন" },
        { status: 401 }
      );
    }

    const { eventSlug } = await req.json();
    if (!eventSlug) {
      return NextResponse.json({ error: "কুইজ নির্দিষ্ট করুন" }, { status: 400 });
    }

    const event = await prisma.quizEvent.findUnique({
      where: { slug: eventSlug },
    });

    if (!event) {
      return NextResponse.json({ error: "কুইজ ইভেন্ট পাওয়া যায়নি" }, { status: 404 });
    }

    if (!event.isOpen) {
      return NextResponse.json({ error: "এই কুইজটি বর্তমানে বন্ধ আছে" }, { status: 403 });
    }

    const settings = await getQuizSecuritySettings();
    const clientIp = req.headers.get("x-forwarded-for") || req.ip || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Check existing attempt
    let attempt = await prisma.quizAttempt.findUnique({
      where: {
        participantId_quizEventId: {
          participantId: session.participantId,
          quizEventId: event.id,
        },
      },
    });

    if (attempt) {
      // 1. If completed
      if (attempt.isCompleted) {
        return NextResponse.json({
          success: false,
          isCompleted: true,
          score: attempt.score,
          durationSeconds: attempt.durationSeconds,
          message: "আপনি ইতিমধ্যে এই কুইজটি সফলভাবে সম্পন্ন করেছেন।",
        });
      }

      // 2. If invalidated/disqualified
      if (attempt.isInvalidated) {
        return NextResponse.json({
          success: false,
          isInvalidated: true,
          invalidationReason: attempt.invalidationReason || STRICT_EXIT_MESSAGE_BN,
          message: attempt.invalidationReason || STRICT_EXIT_MESSAGE_BN,
        });
      }

      // 3. In-progress attempt
      if (!settings.allowRefresh) {
        // Disallow refresh: mark invalidated
        const invalidatedAttempt = await prisma.quizAttempt.update({
          where: { id: attempt.id },
          data: {
            status: "INVALIDATED",
            isInvalidated: true,
            invalidationReason:
              "কুইজ চলাকালীন ব্রাউজার রিফ্রেশ করা নিষিদ্ধ। নির্ধারিত নিয়ম অনুযায়ী আপনার কুইজ প্রচেষ্টা বাতিল করা হয়েছে।",
          },
        });
        return NextResponse.json({
          success: false,
          isInvalidated: true,
          invalidationReason: invalidatedAttempt.invalidationReason,
          message: invalidatedAttempt.invalidationReason,
        });
      }

      // Allow refresh: calculate remaining time from original startedAt
      const elapsed = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
      const remainingSeconds = Math.max(0, event.timeLimitSeconds - elapsed);

      return NextResponse.json({
        success: true,
        attemptId: attempt.id,
        isResumed: true,
        startedAt: attempt.startedAt,
        remainingSeconds,
        warningCount: attempt.warningCount,
        securitySettings: settings,
      });
    }

    // Create new attempt
    const newAttempt = await prisma.quizAttempt.create({
      data: {
        participantId: session.participantId,
        quizEventId: event.id,
        startedAt: new Date(),
        status: "IN_PROGRESS",
        isCompleted: false,
        isInvalidated: false,
        warningCount: 0,
        videoCompleted: true,
        videoCompletedAt: new Date(),
        clientIp,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: newAttempt.id,
      isResumed: false,
      startedAt: newAttempt.startedAt,
      remainingSeconds: event.timeLimitSeconds,
      warningCount: 0,
      securitySettings: settings,
    });
  } catch (err: any) {
    console.error("Quiz start error:", err);
    return NextResponse.json({ error: "কুইজ শুরু করতে ত্রুটি হয়েছে" }, { status: 500 });
  }
}
