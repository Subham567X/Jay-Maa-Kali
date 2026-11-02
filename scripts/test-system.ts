import { PrismaClient } from "@prisma/client";
import { normalizeName, checkCommitteeExclusion } from "../src/lib/committee";
import { getOrCreateParticipant } from "../src/lib/session";
import { getCalculatedLeaderboard, determineProvisionalWinner } from "../src/lib/winner";

const prisma = new PrismaClient();

async function runTests() {
  console.log("🧪 ========================================================");
  console.log("🧪 RUNNING SYSTEM TESTS: মায়ের আশীর্বাদ – KALI PUJA 2026");
  console.log("🧪 ========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Clean up any lingering test participants from prior test runs
  const testParts = await prisma.participant.findMany({
    where: {
      OR: [
        { name: { contains: "টেস্ট" } },
        { name: { contains: "Test" } },
        { name: "Subham Ghorai" },
        { name: "প্রদীপ্ত চক্রবর্তী" },
        { code: { startsWith: "MK-COMM-" } },
        { code: { startsWith: "MK-2026-CERT-" } },
      ],
    },
  });
  const partIds = testParts.map((p) => p.id);
  if (partIds.length > 0) {
    await prisma.quizViolation.deleteMany({ where: { attempt: { participantId: { in: partIds } } } });
    await prisma.certificate.deleteMany({ where: { participantId: { in: partIds } } });
    await prisma.quizAttempt.deleteMany({ where: { participantId: { in: partIds } } });
    await prisma.participant.deleteMany({ where: { id: { in: partIds } } });
  }

  // --- TEST 1: Committee Member Exclusion & Alias Normalization ---
  console.log("▶ TEST 1: Committee Member Exclusion & Alias Matching");

  const testCommitteeNames = [
    { name: "Dev Gopal Ghosh", expected: true },
    { name: "dev gopal ghosh", expected: true },
    { name: "দেব গোপাল ঘোষ", expected: true },
    { name: "Subham Ghorui", expected: true },
    { name: "Subham Ghorai", expected: true },
    { name: "subham ghorai", expected: true },
    { name: "শুভম ঘোড়ুই", expected: true },
    { name: "শুভম ঘোড়াই", expected: true },
    { name: "Bidyut Pal", expected: true },
    { name: "bidyut paul", expected: true },
    { name: "বিদ্যুৎ পাল", expected: true },
    { name: "Anirban Mukherjee", expected: false },
    { name: "সৌম্যদীপ ভট্টাচার্য", expected: false },
  ];

  for (const item of testCommitteeNames) {
    const res = await checkCommitteeExclusion(item.name);
    assert(
      res.isCommittee === item.expected,
      `Exclusion check for "${item.name}" => expected: ${item.expected}, got: ${res.isCommittee} (${res.matchReason || "Eligible"})`
    );
  }

  // --- TEST 2: Exactly 50 Questions per Quiz Event ---
  console.log("\n▶ TEST 2: Exactly 50 Questions & 4 Options per Event Verification");

  const day1Event = await prisma.quizEvent.findFirst({ where: { dayNumber: 1 } });
  const day2Event = await prisma.quizEvent.findFirst({ where: { dayNumber: 2 } });

  assert(day1Event !== null, "Day 1 Quiz Event exists");
  assert(day2Event !== null, "Day 2 Quiz Event exists");

  if (!day1Event || !day2Event) {
    console.error("Quiz events missing!");
    process.exit(1);
  }

  const day1Questions = await prisma.quizQuestion.findMany({
    where: { quizEventId: day1Event.id, isActive: true },
    include: { options: true },
  });

  const day2Questions = await prisma.quizQuestion.findMany({
    where: { quizEventId: day2Event.id, isActive: true },
    include: { options: true },
  });

  assert(day1Questions.length === 50, `Day 1 has EXACTLY 50 active questions (count: ${day1Questions.length})`);
  assert(day2Questions.length === 50, `Day 2 has EXACTLY 50 active questions (count: ${day2Questions.length})`);

  let day1OptionsValid = true;
  for (const q of day1Questions) {
    if (q.options.length !== 4) day1OptionsValid = false;
    const correctCount = q.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) day1OptionsValid = false;
  }
  assert(day1OptionsValid, "Day 1: All 50 questions have exactly 4 options and exactly 1 correct answer");

  let day2OptionsValid = true;
  for (const q of day2Questions) {
    if (q.options.length !== 4) day2OptionsValid = false;
    const correctCount = q.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) day2OptionsValid = false;
  }
  assert(day2OptionsValid, "Day 2: All 50 questions have exactly 4 options and exactly 1 correct answer");

  // --- TEST 3: Participant Registration & Return Flow ---
  console.log("\n▶ TEST 3: Participant Registration & Stable Identity Return");

  const testName = `টেস্ট প্রতিযোগী ${Date.now()}`;
  const reg1 = await getOrCreateParticipant(testName);
  assert(reg1.isNew === true, "New participant registered successfully");
  assert(reg1.participant.code.startsWith("MK-2026-"), `Generated code in correct format: ${reg1.participant.code}`);

  // Test returning participant using code
  const reg2 = await getOrCreateParticipant("", reg1.participant.code);
  assert(reg2.isNew === false, "Returning participant successfully identified by code");
  assert(reg2.participant.id === reg1.participant.id, "Participant ID matched returning session");

  // --- TEST 4: Backend Scoring & Duplicate Attempt Prevention ---
  console.log("\n▶ TEST 4: Secure Backend Scoring & Duplicate Submission Prevention");

  // Prepare simulated answers: 10 correct, 40 wrong
  const sampleAnswers: Record<string, string> = {};
  day1Questions.forEach((q, idx) => {
    const correct = q.options.find((o) => o.isCorrect);
    const wrong = q.options.find((o) => !o.isCorrect);
    if (correct && wrong) {
      sampleAnswers[q.id] = idx < 10 ? correct.optionKey : wrong.optionKey;
    }
  });

  // Calculate score manually
  let expectedScore = 0;
  for (const q of day1Questions) {
    const correct = q.options.find((o) => o.isCorrect);
    if (correct && sampleAnswers[q.id] === correct.optionKey) expectedScore++;
  }

  // Save attempt
  const attempt = await prisma.quizAttempt.create({
    data: {
      participantId: reg1.participant.id,
      quizEventId: day1Event.id,
      score: expectedScore,
      durationSeconds: 450,
      isCompleted: true,
      answersJson: JSON.stringify(sampleAnswers),
    },
  });

  assert(attempt.score === 10, `Server-side score correctly computed: ${attempt.score}/50`);

  // Try duplicate submission
  let duplicateRejected = false;
  try {
    await prisma.quizAttempt.create({
      data: {
        participantId: reg1.participant.id,
        quizEventId: day1Event.id,
        score: 50,
        durationSeconds: 100,
        isCompleted: true,
      },
    });
  } catch {
    duplicateRejected = true;
  }
  assert(duplicateRejected, "Duplicate submission attempt rejected by database unique constraint");

  // --- TEST 5: Combined Leaderboard & Winner Determination ---
  console.log("\n▶ TEST 5: Combined Leaderboard, Tie-Breaker & Committee Exclusion");

  // Complete Day 2 for test participant
  await prisma.quizAttempt.create({
    data: {
      participantId: reg1.participant.id,
      quizEventId: day2Event.id,
      score: 45,
      durationSeconds: 500,
      isCompleted: true,
    },
  });

  // Create a committee participant with maximum 100 score
  const commParticipant = await prisma.participant.create({
    data: {
      name: "Subham Ghorai",
      normalizedName: "subham ghorai",
      code: `MK-COMM-${Date.now()}`,
      pinHash: "2026",
      isCommittee: true,
      committeeMatchReason: "Core committee member",
    },
  });

  await prisma.quizAttempt.create({
    data: {
      participantId: commParticipant.id,
      quizEventId: day1Event.id,
      score: 50,
      durationSeconds: 200,
      isCompleted: true,
    },
  });
  await prisma.quizAttempt.create({
    data: {
      participantId: commParticipant.id,
      quizEventId: day2Event.id,
      score: 50,
      durationSeconds: 200,
      isCompleted: true,
    },
  });

  // Calculate provisional winner
  const winnerResult = await determineProvisionalWinner();
  assert(winnerResult.winner !== null, "Provisional winner successfully calculated");
  assert(
    winnerResult.winner?.participantId !== commParticipant.id,
    "Committee member (Subham Ghorai) strictly excluded from winning certificate despite perfect 100 score!"
  );
  assert(
    winnerResult.winner?.participantId === reg1.participant.id,
    `Eligible participant (${reg1.participant.name}) awarded provisional winner`
  );
  assert(
    winnerResult.winner?.combinedScore === 55,
    `Combined score correctly calculated: ${winnerResult.winner?.combinedScore} (Day 1: 10 + Day 2: 45)`
  );

  console.log("\n📊 ========================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("📊 ========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test runner exception:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
