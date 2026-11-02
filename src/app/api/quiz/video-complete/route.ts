import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyParticipantRequest } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyParticipantRequest(req);

    if (session) {
      await prisma.participant.update({
        where: { id: session.participantId },
        data: {
          blessingVideoCompleted: true,
          blessingVideoWatchedAt: new Date(),
        },
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "মা কালীর স্নেহাশিস দর্শন সফলভাবে সম্পন্ন হয়েছে।",
      completed: true,
    });

    // Set secure cookie so even if user is registering next, the watched state is remembered
    response.cookies.set("nakunda_blessing_watched", "true", {
      httpOnly: false, // accessible to client for smooth state
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error("Video complete recording error:", err);
    return NextResponse.json({ error: "ভিডিও সমাপ্তি রেকর্ড করতে ত্রুটি" }, { status: 500 });
  }
}
