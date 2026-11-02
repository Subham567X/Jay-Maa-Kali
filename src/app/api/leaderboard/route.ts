import { NextRequest, NextResponse } from "next/server";
import { getCalculatedLeaderboard } from "@/lib/winner";
import { verifyAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const adminSession = await verifyAdminRequest(req);
    const isAdmin = !!adminSession;

    // 1. Individual Leaderboard
    const rawLeaderboard = await getCalculatedLeaderboard(true);

    const sanitizedLeaderboard = rawLeaderboard.map((item) => ({
      rank: item.rank,
      name: item.name,
      day1Score: item.day1Score,
      day2Score: item.day2Score,
      combinedScore: item.combinedScore,
      durationSeconds: isAdmin ? item.combinedDuration : undefined,
      isCommittee: item.isCommittee,
      isEligible: item.isEligibleForCertificate,
      bothDaysCompleted: item.bothDaysCompleted,
      committeeReason: isAdmin ? item.committeeReason : undefined,
    }));

    // 2. Family Pack Leaderboard
    const rawFamilies = await prisma.familyPack.findMany({
      include: {
        members: {
          include: {
            attempts: {
              where: { isCompleted: true, isInvalidated: false },
              include: { quizEvent: true },
            },
          },
        },
      },
    });

    const evaluatedFamilies = rawFamilies.map((f) => {
      let totalScore = 0;
      let allCompleted = true;

      for (const m of f.members) {
        const d1 = m.attempts.find((a) => a.quizEvent.dayNumber === 1);
        const d2 = m.attempts.find((a) => a.quizEvent.dayNumber === 2);
        if (!d1 || !d2) allCompleted = false;

        totalScore += (d1?.score ?? 0) + (d2?.score ?? 0);
      }

      const maxScore = f.members.length * 100;
      const percentage = maxScore > 0 ? Number(((totalScore / maxScore) * 100).toFixed(1)) : 0;

      return {
        id: f.id,
        familyId: f.familyId,
        familyHeadName: f.familyHeadName,
        memberCount: f.members.length,
        familyScore: totalScore,
        maxPossibleScore: maxScore,
        achievementPercentage: percentage,
        allCompleted,
        isEligible: allCompleted && percentage >= 40,
      };
    });

    // Sort families by percentage desc, then totalScore desc
    evaluatedFamilies.sort((a, b) => {
      if (b.achievementPercentage !== a.achievementPercentage) {
        return b.achievementPercentage - a.achievementPercentage;
      }
      return b.familyScore - a.familyScore;
    });

    // Assign transparent tied ranks
    let currentRank = 1;
    const familyLeaderboard = evaluatedFamilies.map((item, idx) => {
      if (idx > 0) {
        const prev = evaluatedFamilies[idx - 1];
        if (
          prev.achievementPercentage === item.achievementPercentage &&
          prev.familyScore === item.familyScore
        ) {
          // Tie: Keep same rank
        } else {
          currentRank = idx + 1;
        }
      }
      return {
        rank: currentRank,
        ...item,
      };
    });

    // Check if an overall winner is published
    const publishedWinner = await prisma.winnerApproval.findFirst({
      where: { status: "PUBLISHED" },
      include: {
        participant: {
          select: { name: true, code: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      leaderboard: sanitizedLeaderboard,
      individualLeaderboard: sanitizedLeaderboard,
      familyLeaderboard,
      publishedWinner: publishedWinner
        ? {
            winnerName: publishedWinner.participantName,
            combinedScore: publishedWinner.combinedScore,
            certificateCode: publishedWinner.certificateCode,
            approvedAt: publishedWinner.approvedAt,
          }
        : null,
      isAdmin,
    });
  } catch (err: any) {
    console.error("Leaderboard fetch error:", err);
    return NextResponse.json({ error: "লিডারবোর্ড লোড করতে ত্রুটি" }, { status: 500 });
  }
}
