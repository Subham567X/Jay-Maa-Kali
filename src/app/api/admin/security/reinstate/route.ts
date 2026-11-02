import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাডমিন অ্যাক্সেস" }, { status: 401 });
    }

    const { attemptId, notes } = await req.json();

    if (!attemptId) {
      return NextResponse.json({ error: "প্রচেষ্টা আইডি আবশ্যক" }, { status: 400 });
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { participant: true, quizEvent: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: "প্রচেষ্টা পাওয়া যায়নি" }, { status: 404 });
    }

    // Reinstate: allow participant to resume or retry
    const updated = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: "IN_PROGRESS",
        isInvalidated: false,
        warningCount: 0,
        invalidationReason: null,
        reviewedByAdmin: true,
        adminReviewNotes: notes || `Reinstated by Admin ${admin.username}`,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminUsername: admin.username,
        action: "REINSTATE_INVALIDATED_ATTEMPT",
        targetType: "QuizAttempt",
        targetId: attemptId,
        detailsJson: JSON.stringify({
          participantName: attempt.participant.name,
          participantCode: attempt.participant.code,
          quizEventSlug: attempt.quizEvent.slug,
          previousReason: attempt.invalidationReason,
          notes: notes || "Admin manual reinstatement",
        }),
        ipAddress: req.headers.get("x-forwarded-for") || req.ip || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      message: `${attempt.participant.name}-এর কুইজ প্রচেষ্টা সফলভাবে পুনর্বহাল করা হয়েছে।`,
      attempt: updated,
    });
  } catch (err: any) {
    console.error("Reinstate attempt error:", err);
    return NextResponse.json({ error: "প্রচেষ্টা পুনর্বহাল করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}
