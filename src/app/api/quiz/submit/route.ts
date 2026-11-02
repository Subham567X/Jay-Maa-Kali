import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyParticipantRequest } from "@/lib/session";
import { syncParticipantScore } from "@/lib/sheets";
import { evaluateShuffledAnswers } from "@/lib/quiz-randomizer";
import { recalculateFamilyScore } from "@/lib/family";
import {
  autoGenerateIndividualCertificate,
  autoGenerateFamilyCertificate,
} from "@/lib/certificates";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyParticipantRequest(req);
    if (!session) {
      return NextResponse.json(
        { error: "কুইজ জমা দিতে প্রথমে নাম নিবন্ধন করো" },
        { status: 401 }
      );
    }

    const { eventSlug, answers, durationSeconds } = await req.json();

    if (!eventSlug) {
      return NextResponse.json({ error: "কুইজ ইভেন্ট নির্দিষ্ট করুন" }, { status: 400 });
    }

    // 1. Fetch event with correct options
    const event = await prisma.quizEvent.findUnique({
      where: { slug: eventSlug },
      include: {
        questions: {
          where: { isActive: true },
          include: {
            options: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "কুইজ ইভেন্ট পাওয়া যায়নি" }, { status: 404 });
    }

    // 2. Prevent duplicate submission
    const existingAttempt = await prisma.quizAttempt.findUnique({
      where: {
        participantId_quizEventId: {
          participantId: session.participantId,
          quizEventId: event.id,
        },
      },
    });

    if (existingAttempt && existingAttempt.isCompleted) {
      return NextResponse.json(
        {
          error: "তুমি ইতিমধ্যে এই কুইজটি সফলভাবে জমা দিয়েছ। পুনরায় জমা দেওয়া সম্ভব নয়।",
          score: existingAttempt.score,
          alreadyCompleted: true,
        },
        { status: 400 }
      );
    }

    if (existingAttempt && existingAttempt.isInvalidated) {
      return NextResponse.json(
        {
          error:
            existingAttempt.invalidationReason ||
            "আপনি কুইজ থেকে বেরিয়ে গিয়েছেন। নির্ধারিত নিয়ম অনুযায়ী আপনার এই কুইজের প্রচেষ্টা বাতিল করা হয়েছে। একই কুইজে পুনরায় অংশগ্রহণ করা যাবে না।",
          isInvalidated: true,
        },
        { status: 403 }
      );
    }

    // 3. Server-side Score Calculation against Shuffled Sequence
    const submittedAnswers = answers || {};
    let calculatedScore = 0;

    let mapping: any[] = [];
    if (existingAttempt?.shuffledQuestionsJson) {
      try {
        mapping = JSON.parse(existingAttempt.shuffledQuestionsJson);
      } catch {}
    }

    if (Array.isArray(mapping) && mapping.length > 0) {
      const evalRes = evaluateShuffledAnswers(mapping, submittedAnswers, event.questions);
      calculatedScore = evalRes.score;
    } else {
      // Fallback simple optionKey matching
      for (const question of event.questions) {
        const correctOption = question.options.find((opt) => opt.isCorrect);
        const selectedKey = submittedAnswers[question.id];
        if (correctOption && selectedKey && selectedKey === correctOption.optionKey) {
          calculatedScore += 1;
        }
      }
    }

    const safeDuration = Math.max(1, Math.min(Number(durationSeconds) || 0, 3660)); // 60 mins max
    const clientIp = req.headers.get("x-forwarded-for") || req.ip || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // 2-minute processing delay timer: now + 120 seconds
    const now = new Date();
    const resultAvailableAt = new Date(now.getTime() + 120 * 1000);

    // 4. Save Attempt
    const attempt = await prisma.quizAttempt.upsert({
      where: {
        participantId_quizEventId: {
          participantId: session.participantId,
          quizEventId: event.id,
        },
      },
      update: {
        score: calculatedScore,
        durationSeconds: safeDuration,
        isCompleted: true,
        status: "COMPLETED",
        isInvalidated: false,
        submittedAt: now,
        resultAvailableAt,
        answersJson: JSON.stringify(submittedAnswers),
        clientIp,
        userAgent,
      },
      create: {
        participantId: session.participantId,
        quizEventId: event.id,
        score: calculatedScore,
        durationSeconds: safeDuration,
        isCompleted: true,
        status: "COMPLETED",
        isInvalidated: false,
        submittedAt: now,
        resultAvailableAt,
        answersJson: JSON.stringify(submittedAnswers),
        clientIp,
        userAgent,
      },
    });

    // 5. If member of a family pack, recalculate family score and check family certificate
    const participant = await prisma.participant.findUnique({
      where: { id: session.participantId },
    });

    if (participant?.familyPackId) {
      recalculateFamilyScore(participant.familyPackId)
        .then(() => autoGenerateFamilyCertificate(participant.familyPackId!))
        .catch((e) => console.warn("Family recalculation error:", e));
    }

    // 6. Check individual certificate eligibility & auto generate
    autoGenerateIndividualCertificate(session.participantId).catch((e) =>
      console.warn("Individual certificate auto-gen error:", e)
    );

    // 7. Auto-sync to Google Sheet asynchronously
    syncParticipantScore(session.participantId).catch((e) =>
      console.warn("Google Sheet sync error on submit:", e)
    );

    return NextResponse.json({
      success: true,
      processing: true,
      resultAvailableAt: resultAvailableAt.toISOString(),
      eventTitle: event.title,
      isCommittee: session.isCommittee,
      message: "মায়ের আশীর্বাদে তোমার উত্তরপত্র যাচাই করা হচ্ছে। একটু অপেক্ষা করো সন্তান… ❤️",
    });
  } catch (err: any) {
    console.error("Quiz submission error:", err);
    return NextResponse.json({ error: "কুইজ জমা দিতে ত্রুটি হয়েছে" }, { status: 500 });
  }
}
