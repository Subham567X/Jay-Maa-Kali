import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyParticipantRequest } from "@/lib/session";
import { evaluateShuffledAnswers } from "@/lib/quiz-randomizer";
import { checkIndividualEligibility } from "@/lib/certificates";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyParticipantRequest(req);
    if (!session) {
      return NextResponse.json({ error: "অননুমোদিত সেশন" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "কুইজের নাম দিন" }, { status: 400 });
    }

    const event = await prisma.quizEvent.findUnique({
      where: { slug },
      include: {
        questions: {
          where: { isActive: true },
          include: { options: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "কুইজ ইভেন্ট পাওয়া যায়নি" }, { status: 404 });
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: {
        participantId_quizEventId: {
          participantId: session.participantId,
          quizEventId: event.id,
        },
      },
    });

    if (!attempt || !attempt.isCompleted) {
      return NextResponse.json({ error: "কোনো সম্পন্ন কুইজ প্রচেষ্টা পাওয়া যায়নি" }, { status: 404 });
    }

    const now = new Date();

    // 1. Check 2-minute result processing period
    if (attempt.resultAvailableAt && now.getTime() < attempt.resultAvailableAt.getTime()) {
      const remainingSeconds = Math.max(
        1,
        Math.ceil((attempt.resultAvailableAt.getTime() - now.getTime()) / 1000)
      );

      return NextResponse.json({
        ready: false,
        remainingSeconds,
        message: "মায়ের আশীর্বাদে তোমার উত্তরপত্র যাচাই করা হচ্ছে। একটু অপেক্ষা করো সন্তান… ❤️",
      });
    }

    // 2. Result is ready
    let submittedAnswers: Record<string, string> = {};
    try {
      submittedAnswers = JSON.parse(attempt.answersJson || "{}");
    } catch {}

    let mapping: any[] = [];
    if (attempt.shuffledQuestionsJson) {
      try {
        mapping = JSON.parse(attempt.shuffledQuestionsJson);
      } catch {}
    }

    let detailedResults: any[] = [];
    if (Array.isArray(mapping) && mapping.length > 0) {
      const evalRes = evaluateShuffledAnswers(mapping, submittedAnswers, event.questions);
      detailedResults = evalRes.detailedResults;
    }

    const correctCount = attempt.score;
    const answeredCount = Object.keys(submittedAnswers).length;
    const unansweredCount = Math.max(0, event.questions.length - answeredCount);
    const incorrectCount = Math.max(0, answeredCount - correctCount);

    // 3. One-time detailed answer review enforcement
    const isFirstTimeReview = !attempt.reviewAccessedAt;
    if (isFirstTimeReview) {
      // Mark as accessed right now
      await prisma.quizAttempt.update({
        where: { id: attempt.id },
        data: { reviewAccessedAt: now },
      });
    }

    // 4. Overall participant status & certificate eligibility
    const allAttempts = await prisma.quizAttempt.findMany({
      where: {
        participantId: session.participantId,
        isCompleted: true,
        isInvalidated: false,
      },
      include: { quizEvent: true },
    });

    const day1 = allAttempts.find((a) => a.quizEvent.dayNumber === 1);
    const day2 = allAttempts.find((a) => a.quizEvent.dayNumber === 2);
    const eligibility = checkIndividualEligibility(day1?.score, day2?.score);

    const certificate = await prisma.certificate.findFirst({
      where: { participantId: session.participantId, type: "INDIVIDUAL" },
    });

    return NextResponse.json({
      ready: true,
      score: attempt.score,
      totalQuestions: event.questions.length,
      durationSeconds: attempt.durationSeconds,
      correctCount,
      incorrectCount,
      unansweredCount,
      eventTitle: event.title,
      isFirstTimeReview,
      canReviewAnswers: isFirstTimeReview,
      canReviewDetails: isFirstTimeReview,
      detailedResults: isFirstTimeReview ? detailedResults : [],
      reviewNotice: isFirstTimeReview
        ? "মনোযোগ দিন: কুইজের নিয়ম অনুযায়ী উত্তরপত্রের বিস্তারিত পর্যালোচনা শুধুমাত্র এই একবারই প্রদর্শন করা হবে। পেজটি রিফ্রেশ বা ত্যাগ করলে পুনরায় দেখতে পাবেন না।"
        : "নিয়ম অনুযায়ী উত্তরপত্রের বিস্তারিত পর্যালোচনা শুধুমাত্র একবার দেখা সম্ভব। আপনার অর্জিত মোট স্কোর সংরক্ষিত রয়েছে।",
      overall: {
        day1Score: day1?.score ?? null,
        day2Score: day2?.score ?? null,
        bothCompleted: !!(day1 && day2),
        isEligible: eligibility.isEligible,
        eligibilityMessage: eligibility.message,
        certificate: certificate
          ? {
              code: certificate.certificateCode,
              grade: certificate.grade,
              title: certificate.achievementTitle,
              pdfPath: certificate.pdfPath,
            }
          : null,
      },
    });
  } catch (err: any) {
    console.error("Quiz result fetch error:", err);
    return NextResponse.json({ error: "ফলাফল প্রদর্শন করতে ত্রুটি হয়েছে" }, { status: 500 });
  }
}
