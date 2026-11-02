import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getQuizSecuritySettings, STRICT_EXIT_MESSAGE_BN } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { attemptId, eventType } = await req.json();

    if (!attemptId) {
      return NextResponse.json({ error: "attemptId আবশ্যক" }, { status: 400 });
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      return NextResponse.json({ error: "কুইজ প্রচেষ্টা পাওয়া যায়নি" }, { status: 404 });
    }

    const newWarningCount = attempt.warningCount + 1;
    const isDisqualified = newWarningCount >= 3;

    // Record violation
    await prisma.quizViolation.create({
      data: {
        attemptId: attempt.id,
        eventType: eventType || "TAB_SWITCH",
        warningNumber: newWarningCount,
        details: `Detected ${eventType} event (exit #${newWarningCount})`,
        clientTimestamp: new Date(),
      },
    });

    // Update attempt
    await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        warningCount: newWarningCount,
        isInvalidated: isDisqualified ? true : attempt.isInvalidated,
        status: isDisqualified ? "INVALIDATED" : attempt.status,
        invalidationReason: isDisqualified ? STRICT_EXIT_MESSAGE_BN : attempt.invalidationReason,
      },
    });

    const message = isDisqualified
      ? STRICT_EXIT_MESSAGE_BN
      : `সতর্কতা #${newWarningCount}: কুইজ চলাকালীন অন্য উইন্ডো বা ট্যাবে যাওয়া নিষিদ্ধ! অবশিষ্ট সতর্কতা: ${Math.max(0, 3 - newWarningCount)} বার।`;

    return NextResponse.json({
      success: true,
      warningCount: newWarningCount,
      isDisqualified,
      isInvalidated: isDisqualified,
      message,
    });
  } catch (err: any) {
    console.error("Tab exit error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
