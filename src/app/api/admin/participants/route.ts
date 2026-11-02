import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, logAdminAction } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });

    const participants = await prisma.participant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        attempts: {
          include: {
            quizEvent: {
              select: { dayNumber: true, title: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, participants });
  } catch (err: any) {
    console.error("Admin participants GET error:", err);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });

    const { id, isCommittee, committeeMatchReason } = await req.json();

    if (!id) return NextResponse.json({ error: "প্রতিযোগী আইডি প্রয়োজন" }, { status: 400 });

    const updated = await prisma.participant.update({
      where: { id },
      data: {
        isCommittee: isCommittee !== undefined ? isCommittee : undefined,
        committeeMatchReason: committeeMatchReason !== undefined ? committeeMatchReason : undefined,
      },
    });

    await logAdminAction(admin.username, "UPDATE_PARTICIPANT_ELIGIBILITY", "Participant", id, {
      name: updated.name,
      isCommittee: updated.isCommittee,
      reason: updated.committeeMatchReason,
    });

    return NextResponse.json({ success: true, participant: updated });
  } catch (err: any) {
    console.error("Admin participant PUT error:", err);
    return NextResponse.json({ error: "আপডেট করতে ব্যর্থ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "প্রতিযোগী আইডি প্রয়োজন" }, { status: 400 });

    const participant = await prisma.participant.findUnique({
      where: { id },
    });

    if (!participant) {
      return NextResponse.json({ error: "প্রতিযোগী খুঁজে পাওয়া যায়নি" }, { status: 404 });
    }

    // Attempts and violations cascade delete through relations
    await prisma.participant.delete({
      where: { id },
    });

    await logAdminAction(admin.username, "DELETE_PARTICIPANT", "Participant", id, {
      name: participant.name,
      code: participant.code,
    });

    return NextResponse.json({ success: true, message: "প্রতিযোগী সফলভাবে মুছে ফেলা হয়েছে" });
  } catch (err: any) {
    console.error("Admin participant DELETE error:", err);
    return NextResponse.json({ error: "মুছে ফেলতে ব্যর্থ" }, { status: 500 });
  }
}
