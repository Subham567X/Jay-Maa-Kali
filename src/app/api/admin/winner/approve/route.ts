import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, logAdminAction } from "@/lib/auth";
import { determineProvisionalWinner, getCalculatedLeaderboard } from "@/lib/winner";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });

    const provisional = await determineProvisionalWinner();
    const currentApproval = await prisma.winnerApproval.findFirst({
      include: { participant: true },
    });

    return NextResponse.json({
      success: true,
      provisionalWinner: provisional.winner,
      hasTie: provisional.hasTie,
      tieCandidates: provisional.tieCandidates,
      currentApproval,
    });
  } catch (err: any) {
    console.error("Winner review GET error:", err);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });

    const { participantId, action, notes } = await req.json();

    if (!participantId) {
      return NextResponse.json({ error: "বিজয়ী প্রতিযোগী নির্বাচন করুন" }, { status: 400 });
    }

    // 1. Strict committee member exclusion check!
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { attempts: true },
    });

    if (!participant) {
      return NextResponse.json({ error: "প্রতিযোগী পাওয়া যায়নি" }, { status: 404 });
    }

    if (participant.isCommittee) {
      return NextResponse.json(
        {
          error: "নিয়ম অনুযায়ী পূজা কমিটির সদস্যকে বিজয়ী সম্মাননা সার্টিফিকেট প্রদান করা যাবে না।",
        },
        { status: 403 }
      );
    }

    // Fetch scores
    const day1Event = await prisma.quizEvent.findFirst({ where: { dayNumber: 1 } });
    const day2Event = await prisma.quizEvent.findFirst({ where: { dayNumber: 2 } });

    const day1Attempt = participant.attempts.find(
      (a) => a.quizEventId === day1Event?.id && a.isCompleted && !a.isInvalidated
    );
    const day2Attempt = participant.attempts.find(
      (a) => a.quizEventId === day2Event?.id && a.isCompleted && !a.isInvalidated
    );

    if (!day1Attempt || !day2Attempt) {
      return NextResponse.json(
        {
          error:
            "এই প্রতিযোগী উভয় দিনের বৈধ পরীক্ষা সফলভাবে সম্পন্ন করেননি অথবা কোনো একটি প্রচেষ্টা বাতিল হয়েছে।",
        },
        { status: 400 }
      );
    }

    const day1Score = day1Attempt.score || 0;
    const day2Score = day2Attempt.score || 0;
    const combinedScore = day1Score + day2Score;
    const combinedDurationSeconds =
      (day1Attempt.durationSeconds || 0) + (day2Attempt.durationSeconds || 0);

    const certCode = `CERT-MK2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const status = action === "PUBLISH" ? "PUBLISHED" : "APPROVED";

    // Delete previous approvals to ensure ONLY ONE overall winner exists
    await prisma.winnerApproval.deleteMany({});

    const approval = await prisma.winnerApproval.create({
      data: {
        participantId: participant.id,
        participantName: participant.name,
        day1Score,
        day2Score,
        combinedScore,
        combinedDurationSeconds,
        status,
        certificateCode: certCode,
        approvedBy: admin.username,
        approvedAt: new Date(),
        notes: notes || "Approved by Nakunda Kali Puja Committee Administrator",
      },
    });

    await logAdminAction(admin.username, "APPROVE_WINNER", "WinnerApproval", approval.id, {
      winnerName: participant.name,
      combinedScore,
      status,
      certificateCode: certCode,
    });

    return NextResponse.json({
      success: true,
      approval,
      message:
        status === "PUBLISHED"
          ? "বিজয়ী নিশ্চিত করা হয়েছে এবং সার্টিফিকেট জনসমক্ষে প্রকাশিত হয়েছে!"
          : "বিজয়ী অনুমোদন সম্পন্ন হয়েছে।",
    });
  } catch (err: any) {
    console.error("Winner approval POST error:", err);
    return NextResponse.json({ error: "বিজয়ী অনুমোদন করতে ব্যর্থ" }, { status: 500 });
  }
}
