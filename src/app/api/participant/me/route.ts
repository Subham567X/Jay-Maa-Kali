import { NextRequest, NextResponse } from "next/server";
import { verifyParticipantRequest } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyParticipantRequest(req);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const participant = await prisma.participant.findUnique({
      where: { id: session.participantId },
      include: {
        attempts: {
          select: {
            id: true,
            quizEventId: true,
            score: true,
            durationSeconds: true,
            isCompleted: true,
            submittedAt: true,
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      participant: {
        id: participant.id,
        name: participant.name,
        code: participant.code,
        mobileNumber: participant.mobileNumber,
        isCommittee: participant.isCommittee,
        isFamilyHead: participant.isFamilyHead,
        familyPackId: participant.familyPackId,
        blessingVideoCompleted: participant.blessingVideoCompleted,
        attempts: participant.attempts,
      },
    });
  } catch (err: any) {
    console.error("Participant me error:", err);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}
