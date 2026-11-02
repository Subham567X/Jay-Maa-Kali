import { prisma } from "./prisma";

export interface RankedParticipant {
  participantId: string;
  name: string;
  code: string;
  day1Score: number;
  day2Score: number;
  combinedScore: number;
  day1Duration: number;
  day2Duration: number;
  combinedDuration: number;
  isCommittee: boolean;
  committeeReason?: string | null;
  isEligibleForCertificate: boolean;
  rank: number;
  bothDaysCompleted: boolean;
}

/**
 * Calculates the complete leaderboard ranking across Day 1 and Day 2.
 * Enforces committee exclusion rules on certificate eligibility.
 */
export async function getCalculatedLeaderboard(includeCommitteeInRanking = true): Promise<RankedParticipant[]> {
  // Fetch Day 1 and Day 2 events
  const day1Event = await prisma.quizEvent.findFirst({ where: { dayNumber: 1 } });
  const day2Event = await prisma.quizEvent.findFirst({ where: { dayNumber: 2 } });

  // Fetch all participants with completed, valid attempts (strictly excluding invalidated/disqualified)
  const participants = await prisma.participant.findMany({
    include: {
      attempts: {
        where: { isCompleted: true, isInvalidated: false },
      },
    },
  });

  const ranked: RankedParticipant[] = [];

  for (const p of participants) {
    const day1Attempt = p.attempts.find((a) => a.quizEventId === day1Event?.id);
    const day2Attempt = p.attempts.find((a) => a.quizEventId === day2Event?.id);

    const day1Score = day1Attempt?.score || 0;
    const day2Score = day2Attempt?.score || 0;
    const combinedScore = day1Score + day2Score;

    const day1Duration = day1Attempt?.durationSeconds || 0;
    const day2Duration = day2Attempt?.durationSeconds || 0;
    const combinedDuration = day1Duration + day2Duration;

    const bothDaysCompleted = !!(day1Attempt && day2Attempt);
    const isEligibleForCertificate = !p.isCommittee && bothDaysCompleted;

    ranked.push({
      participantId: p.id,
      name: p.name,
      code: p.code,
      day1Score,
      day2Score,
      combinedScore,
      day1Duration,
      day2Duration,
      combinedDuration,
      isCommittee: p.isCommittee,
      committeeReason: p.committeeMatchReason,
      isEligibleForCertificate,
      rank: 0,
      bothDaysCompleted,
    });
  }

  // Sorting criteria:
  // 1. Highest combined score
  // 2. Tie-breaker: Shortest combined duration in seconds
  // 3. Early completion date
  ranked.sort((a, b) => {
    if (b.combinedScore !== a.combinedScore) {
      return b.combinedScore - a.combinedScore;
    }
    return a.combinedDuration - b.combinedDuration;
  });

  // Assign ranks
  ranked.forEach((item, index) => {
    item.rank = index + 1;
  });

  if (!includeCommitteeInRanking) {
    return ranked.filter((r) => !r.isCommittee);
  }

  return ranked;
}

/**
 * Identifies the provisional single overall winner.
 * Strictly excludes committee members and requires both days completed.
 */
export async function determineProvisionalWinner(): Promise<{
  winner: RankedParticipant | null;
  tieCandidates: RankedParticipant[];
  hasTie: boolean;
}> {
  const leaderboard = await getCalculatedLeaderboard(true);
  const eligible = leaderboard.filter((p) => p.isEligibleForCertificate);

  if (eligible.length === 0) {
    return { winner: null, tieCandidates: [], hasTie: false };
  }

  const topScore = eligible[0].combinedScore;
  const topDuration = eligible[0].combinedDuration;

  // Check if multiple participants share exact same top score and exact same top duration
  const exactTies = eligible.filter(
    (p) => p.combinedScore === topScore && p.combinedDuration === topDuration
  );

  return {
    winner: eligible[0],
    tieCandidates: exactTies,
    hasTie: exactTies.length > 1,
  };
}
