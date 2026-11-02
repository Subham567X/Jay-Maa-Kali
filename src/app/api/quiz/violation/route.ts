import { NextRequest, NextResponse } from "next/server";
import { processQuizViolation } from "@/lib/security";
import { verifyParticipantRequest } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyParticipantRequest(req);
    if (!session) {
      return NextResponse.json({ error: "অননুমোদিত অনুরোধ" }, { status: 401 });
    }

    const { attemptId, eventType, details } = await req.json();

    if (!attemptId || !eventType) {
      return NextResponse.json(
        { error: "প্রচেষ্টা আইডি ও ইভেন্টের ধরন আবশ্যক" },
        { status: 400 }
      );
    }

    const result = await processQuizViolation(attemptId, eventType, details);

    return NextResponse.json({
      success: true,
      warningCount: result.warningCount,
      maxWarnings: result.maxWarnings,
      isInvalidated: result.isInvalidated,
      message: result.message,
    });
  } catch (err: any) {
    console.error("Quiz violation logging error:", err);
    return NextResponse.json(
      { error: err.message || "লঙ্ঘন রেকর্ড করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}
