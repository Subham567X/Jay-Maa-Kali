import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyParticipantRequest } from "@/lib/session";
import { getQuizSecuritySettings, STRICT_EXIT_MESSAGE_BN } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyParticipantRequest(req);
    if (!session) {
      return NextResponse.json({ error: "অননুমোদিত অনুরোধ" }, { status: 401 });
    }

    const { attemptId, reason, details } = await req.json();

    if (!attemptId) {
      return NextResponse.json({ error: "প্রচেষ্টা আইডি প্রয়োজন" }, { status: 400 });
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { participant: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: "প্রচেষ্টা পাওয়া যায়নি" }, { status: 404 });
    }

    // Only participant who owns this attempt can trigger it (or admin)
    if (attempt.participantId !== session.participantId) {
      return NextResponse.json({ error: "অননুমোদিত চেষ্টা" }, { status: 403 });
    }

    if (attempt.isCompleted) {
      return NextResponse.json({ message: "কুইজ ইতিপূর্বে সম্পন্ন হয়েছে" });
    }

    const finalReason = reason || STRICT_EXIT_MESSAGE_BN;

    const updated = await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "INVALIDATED",
        isInvalidated: true,
        invalidationReason: finalReason,
        invalidationDetails: details || "Participant left quiz page or navigated away",
      },
    });

    // Also log the violation
    await prisma.quizViolation.create({
      data: {
        attemptId: attempt.id,
        eventType: "PAGE_LEAVE",
        warningNumber: attempt.warningCount + 1,
        details: details || "Quiz page exit / back navigation trigger",
        clientTimestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      isInvalidated: true,
      message: finalReason,
    });
  } catch (err: any) {
    console.error("Quiz invalidate error:", err);
    return NextResponse.json({ error: "কুইজ বাতিলকরণে ত্রুটি" }, { status: 500 });
  }
}
