import { PrismaClient } from "@prisma/client";
import {
  getGradeAndTitle,
  checkIndividualEligibility,
  generateCertificatePDF,
  autoGenerateIndividualCertificate,
  autoGenerateFamilyCertificate,
} from "../src/lib/certificates.ts";
import { getEventConfiguration, isQuizScheduleOpen } from "../src/lib/event-config.ts";
import {
  registerFamilyPack,
  joinExistingFamilyPack,
  recalculateFamilyScore,
} from "../src/lib/family.ts";
import { getOrCreateShuffledAttemptSequence, evaluateShuffledAnswers } from "../src/lib/quiz-randomizer.ts";
import fs from "fs";

const prisma = new PrismaClient();
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function cleanupTestData() {
  const testMobiles = ["9876543210", "9831122334", "9123456781", "9123456782", "9876500001", "9433112255"];
  const testParts = await prisma.participant.findMany({
    where: {
      OR: [
        { mobileNumber: { in: testMobiles } },
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
  const testFamilies = await prisma.familyPack.findMany({ where: { mobileNumber: { in: testMobiles } } });
  const famIds = testFamilies.map((f) => f.id);
  if (famIds.length > 0) {
    await prisma.certificate.deleteMany({ where: { familyPackId: { in: famIds } } });
    await prisma.participant.deleteMany({ where: { familyPackId: { in: famIds } } });
    await prisma.familyPack.deleteMany({ where: { id: { in: famIds } } });
  }
}

async function main() {
  console.log("🌸 ========================================================================");
  console.log("🌸 MASTER SYSTEM AUTOMATED TEST SUITE: মায়ের আশীর্বাদ – KALI PUJA 2026");
  console.log("🌸 Testing All Prompt Requirements: Individual, Family, Randomizer, Timer,");
  console.log("🌸 Anti-Cheat, 2-Min Processing, Certificates, Leaderboard & Regression");
  console.log("🌸 ========================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Clean up any test participants from prior test runs for full idempotency
  await cleanupTestData();

  // =========================================================================
  // SECTION 1: EVENT CONFIGURATION & 60-MINUTE TIMER VERIFICATION
  // =========================================================================
  console.log("▶ [TEST 1] Event Configuration, Central Schedule & 60-Minute Duration");
  const eventConfig = await getEventConfiguration();
  assert(eventConfig.kaliPujaDate === "2026-11-08", `Kali Puja Date configured: ${eventConfig.kaliPujaDate}`);
  assert(eventConfig.bhaiPhontaDate === "2026-11-10", `Bhai Phonta Date centrally configured: ${eventConfig.bhaiPhontaDate}`);
  assert(eventConfig.quizDurationMinutes === 60, `Quiz duration set to 60 minutes: ${eventConfig.quizDurationMinutes}`);
  assert(eventConfig.timeLimitSeconds === 3600, `Quiz time limit in seconds = 3600s: ${eventConfig.timeLimitSeconds}`);
  assert(eventConfig.timezone === "Asia/Kolkata", `Timezone set to Asia/Kolkata: ${eventConfig.timezone}`);

  const day1Event = await prisma.quizEvent.findFirst({ where: { slug: "kali-puja" } });
  const day2Event = await prisma.quizEvent.findFirst({ where: { slug: "bhai-phonta" } });
  assert(day1Event?.timeLimitSeconds === 3600, `Day 1 Quiz duration is exactly 3600s (60 min)`);
  assert(day2Event?.timeLimitSeconds === 3600, `Day 2 Quiz duration is exactly 3600s (60 min)`);

  // =========================================================================
  // SECTION 2: INDIVIDUAL REGISTRATION & MOBILE VALIDATION
  // =========================================================================
  console.log("\n▶ [TEST 2] Individual Registration, Mobile Validation & Account Change Warning");

  // Invalid mobile test
  const invalidMobileRes = await fetch(`${BASE_URL}/api/participant/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "অমিয় সেন", mobileNumber: "12345" }),
  });
  const invalidMobileData = await invalidMobileRes.json();
  assert(invalidMobileRes.status === 400, "Rejected invalid mobile number < 10 digits");
  assert(invalidMobileData.error.includes("১০ সংখ্যার"), `Bengali error returned: "${invalidMobileData.error}"`);

  // Valid Individual registration
  const reg1Res = await fetch(`${BASE_URL}/api/participant/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "অমিয় সেনগুপ্ত", mobileNumber: "9876543210" }),
  });
  const reg1Data = await reg1Res.json();
  assert(reg1Res.status === 200, "Successfully registered individual participant");
  assert(reg1Data.participant.code.startsWith("MK-2026-"), `Generated unique Participant ID: ${reg1Data.participant.code}`);
  assert(reg1Data.participant.mobileNumber === "9876543210", "Stored 10-digit Indian mobile number");
  const tokenA = reg1Data.token;

  // Attempting to change name on same mobile requires confirmation
  const nameChangeRes = await fetch(`${BASE_URL}/api/participant/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "অমিয় কুমার সেনগুপ্ত", mobileNumber: "9876543210", confirmChange: false }),
  });
  const nameChangeData = await nameChangeRes.json();
  assert(nameChangeRes.status === 409, "Account change without confirmation blocked with 409 Conflict");
  assert(nameChangeData.requiresConfirmation === true, "requiresConfirmation flag returned to trigger modal");
  assert(
    nameChangeData.warningMessage.includes("সতর্কবার্তা!"),
    `Exact Bengali warning returned: "${nameChangeData.warningMessage}"`
  );

  // Confirmed name change succeeds
  const confirmedChangeRes = await fetch(`${BASE_URL}/api/participant/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "অমিয় কুমার সেনগুপ্ত", mobileNumber: "9876543210", confirmChange: true }),
  });
  const confirmedChangeData = await confirmedChangeRes.json();
  assert(confirmedChangeRes.status === 200, "Confirmed name change applied successfully");
  assert(confirmedChangeData.participant.name === "অমিয় কুমার সেনগুপ্ত", "Participant name updated after confirmation");

  // =========================================================================
  // SECTION 3: FAMILY PACK REGISTRATION (5-10 MEMBERS, LOCKED LIST, HEAD PERMISSIONS)
  // =========================================================================
  console.log("\n▶ [TEST 3] Family Pack Registration, Member Limits (5-10), Locked List & Head Access");

  // Test rejecting < 5 members (head + 3 = 4 members)
  const underMinRes = await fetch(`${BASE_URL}/api/family/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      familyHeadName: "রমেশ বন্দ্যোপাধ্যায়",
      mobileNumber: "9831122334",
      memberNames: ["সুচিত্রা বন্দ্যোপাধ্যায়", "অয়ন বন্দ্যোপাধ্যায়", "তনুশ্রী বন্দ্যোপাধ্যায়"], // Total 4
    }),
  });
  const underMinData = await underMinRes.json();
  assert(underMinRes.status === 400, "Rejected Family Pack with 4 members (< 5)");
  assert(underMinData.error.includes("সর্বনিম্ন ৫"), `Bengali error returned: "${underMinData.error}"`);

  // Test rejecting > 10 members (head + 10 = 11 members)
  const overMaxRes = await fetch(`${BASE_URL}/api/family/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      familyHeadName: "রমেশ বন্দ্যোপাধ্যায়",
      mobileNumber: "9831122334",
      memberNames: [
        "সুচিত্রা", "অয়ন", "তনুশ্রী", "প্রভাত",
        "মঞ্জু", "সন্দীপ", "রুমা", "দেবমাল্য", "স্মৃতি", "অনির্বাণ" // Total 11
      ],
    }),
  });
  const overMaxData = await overMaxRes.json();
  assert(overMaxRes.status === 400, "Rejected Family Pack with 11 members (> 10)");
  assert(overMaxData.error.includes("সর্বোচ্চ ১০"), `Bengali error returned: "${overMaxData.error}"`);

  // Test registering valid 6-member Family Pack (head + 5 = 6 members)
  const familyMobile = "9831122334";
  const famRegRes = await fetch(`${BASE_URL}/api/family/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      familyHeadName: "রমেশ বন্দ্যোপাধ্যায়",
      mobileNumber: familyMobile,
      memberNames: [
        "সুচিত্রা বন্দ্যোপাধ্যায়",
        "অয়ন বন্দ্যোপাধ্যায়",
        "তনুশ্রী বন্দ্যোপাধ্যায়",
        "দেবমাল্য বন্দ্যোপাধ্যায়",
        "স্মৃতি বন্দ্যোপাধ্যায়",
      ],
    }),
  });
  const famRegData = await famRegRes.json();
  assert(famRegRes.status === 200, "Registered 6-member Family Pack successfully");
  assert(famRegData.familyPack.familyId.startsWith("FAM-2026-"), `Generated unique Family ID: ${famRegData.familyPack.familyId}`);
  assert(famRegData.familyPack.isLocked === true, "Family member list is permanently locked after registration");
  assert(famRegData.familyPack.memberCount === 6, `Family member count correctly stored: ${famRegData.familyPack.memberCount}`);

  const familyId = famRegData.familyPack.familyId;
  const headToken = famRegData.token;

  // Separate device joining: Member joins with exact name + head mobile + family ID
  const joinMemberRes = await fetch(`${BASE_URL}/api/family/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      memberName: "অয়ন বন্দ্যোপাধ্যায়",
      mobileNumber: familyMobile,
      familyId: familyId,
    }),
  });
  const joinMemberData = await joinMemberRes.json();
  assert(joinMemberRes.status === 200, "Family member (অয়ন বন্দ্যোপাধ্যায়) joined from separate device");
  assert(joinMemberData.member.isFamilyHead === false, "Member correctly identified as non-head");
  assert(joinMemberData.familyPack.id === famRegData.familyPack.id, "Member tied to locked family pack");
  const memberToken = joinMemberData.token;

  // Unauthorized join attempt (unregistered name)
  const unauthJoinRes = await fetch(`${BASE_URL}/api/family/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      memberName: "অনাহূত আগন্তুক",
      mobileNumber: familyMobile,
      familyId: familyId,
    }),
  });
  assert(unauthJoinRes.status === 400, "Rejected unauthorized member not on the locked list");

  // =========================================================================
  // SECTION 4: RANDOMIZED QUESTIONS AND OPTIONS (ANTI-COPYING ENGINE)
  // =========================================================================
  console.log("\n▶ [TEST 4] Server-Side Question & Option Randomization Engine");

  // Create two distinct participants
  const partARes = await fetch(`${BASE_URL}/api/participant/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "পরীক্ষার্থী ক", mobileNumber: "9123456781" }),
  });
  const partAData = await partARes.json();
  const tokenExamA = partAData.token;

  const partBRes = await fetch(`${BASE_URL}/api/participant/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "পরীক্ষার্থী খ", mobileNumber: "9123456782" }),
  });
  const partBData = await partBRes.json();
  const tokenExamB = partBData.token;

  // Fetch questions for Participant A on Day 1
  const questionsARes = await fetch(`${BASE_URL}/api/quiz/questions?slug=kali-puja`, {
    headers: { "x-participant-token": tokenExamA },
  });
  const questionsAData = await questionsARes.json();
  assert(questionsARes.status === 200, "Fetched randomized questions for Participant A");
  assert(questionsAData.questions.length === 50, "Received exactly 50 questions");

  // Fetch questions for Participant B on Day 1
  const questionsBRes = await fetch(`${BASE_URL}/api/quiz/questions?slug=kali-puja`, {
    headers: { "x-participant-token": tokenExamB },
  });
  const questionsBData = await questionsBRes.json();
  assert(questionsBRes.status === 200, "Fetched randomized questions for Participant B");

  // Check that question order differs between Participant A and B
  const orderA = questionsAData.questions.map((q) => q.id);
  const orderB = questionsBData.questions.map((q) => q.id);
  const isDifferent = orderA.some((id, idx) => id !== orderB[idx]);
  assert(isDifferent, "Anti-copying: Question sequence differs between Participant A and B!");

  // Verify options are shuffled and isCorrect is NEVER exposed in the public payload
  const hasExposedIsCorrect = questionsAData.questions.some((q) =>
    q.options.some((opt) => opt.isCorrect !== undefined)
  );
  assert(!hasExposedIsCorrect, "Security: isCorrect answer flag is strictly stripped from frontend payload");

  // Refresh test: Fetch questions again for Participant A -> sequence must NOT reshuffle!
  const questionsARefreshRes = await fetch(`${BASE_URL}/api/quiz/questions?slug=kali-puja`, {
    headers: { "x-participant-token": tokenExamA },
  });
  const questionsARefreshData = await questionsARefreshRes.json();
  const orderARefresh = questionsARefreshData.questions.map((q) => q.id);
  const refreshMaintained = orderA.every((id, idx) => id === orderARefresh[idx]);
  assert(refreshMaintained, "Refresh consistency: Re-fetching returns the exact same shuffled sequence on refresh");

  // =========================================================================
  // SECTION 5: ANTI-CHEATING 3-EXIT CANCELLATION SYSTEM
  // =========================================================================
  console.log("\n▶ [TEST 5] Anti-Cheating Event Monitoring & 3rd Exit Cancellation");

  // Find attempt for Participant A
  const attemptA = await prisma.quizAttempt.findFirst({
    where: { participantId: partAData.participant.id, quizEventId: day1Event.id },
  });
  assert(attemptA !== null, "Attempt A exists in database");

  // Exit 1: Warning
  const exit1Res = await fetch(`${BASE_URL}/api/security/tab-exit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attemptId: attemptA.id, eventType: "TAB_SWITCH" }),
  });
  const exit1Data = await exit1Res.json();
  assert(exit1Data.warningCount === 1, "Exit 1: Recorded 1st warning");
  assert(exit1Data.isDisqualified === false, "Exit 1: Not yet disqualified");

  // Exit 2: Warning
  const exit2Res = await fetch(`${BASE_URL}/api/security/tab-exit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attemptId: attemptA.id, eventType: "WINDOW_BLUR" }),
  });
  const exit2Data = await exit2Res.json();
  assert(exit2Data.warningCount === 2, "Exit 2: Recorded 2nd warning");
  assert(exit2Data.isDisqualified === false, "Exit 2: Not yet disqualified");

  // Exit 3: Cancellation of that day's quiz!
  const exit3Res = await fetch(`${BASE_URL}/api/security/tab-exit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attemptId: attemptA.id, eventType: "PAGE_LEAVE" }),
  });
  const exit3Data = await exit3Res.json();
  assert(exit3Data.isDisqualified === true, "Exit 3: Quiz cancelled on 3rd violation");
  assert(
    exit3Data.message.includes("দুঃখিত! আপনি একাধিকবার কুইজের পেজ থেকে বেরিয়ে যাওয়ায়"),
    `Exact Bengali cancellation message returned: "${exit3Data.message}"`
  );

  // Attempt is marked invalidated in DB
  const attemptACheck = await prisma.quizAttempt.findUnique({ where: { id: attemptA.id } });
  assert(attemptACheck.isInvalidated === true, "Database reflects invalidated status for that day");

  // Verify attempting to submit this disqualified attempt is rejected with 403
  const rejectedSubmitRes = await fetch(`${BASE_URL}/api/quiz/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-participant-token": tokenExamA },
    body: JSON.stringify({ eventSlug: "kali-puja", answers: {}, durationSeconds: 600 }),
  });
  assert(rejectedSubmitRes.status === 403, "Rejected submission of invalidated quiz attempt with 403 Forbidden");

  // =========================================================================
  // SECTION 6: RESULT PROCESSING (2-MINUTE DELAY & 1-TIME DETAILED REVIEW)
  // =========================================================================
  console.log("\n▶ [TEST 6] 2-Minute Result Processing Delay & 1-Time Detailed Answer Review");

  // Participant B answers some questions on Day 1
  const attemptB = await prisma.quizAttempt.findFirst({
    where: { participantId: partBData.participant.id, quizEventId: day1Event.id },
  });

  const answersB = {};
  // Answer first 25 questions with option 'A'
  questionsBData.questions.slice(0, 25).forEach((q) => {
    answersB[q.id] = q.options[0]?.displayKey || "A";
  });

  const submitBRes = await fetch(`${BASE_URL}/api/quiz/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-participant-token": tokenExamB },
    body: JSON.stringify({
      eventSlug: "kali-puja",
      answers: answersB,
      durationSeconds: 1200,
    }),
  });
  const submitBData = await submitBRes.json();
  assert(submitBRes.status === 200, "Successfully submitted Day 1 quiz for Participant B");
  assert(submitBData.processing === true, "Submission initiates 2-minute processing period");
  assert(
    submitBData.message.includes("মায়ের আশীর্বাদে তোমার উত্তরপত্র যাচাই করা হচ্ছে"),
    `Exact Bengali waiting message: "${submitBData.message}"`
  );

  // Query result immediately -> must return ready: false
  const earlyResultRes = await fetch(`${BASE_URL}/api/quiz/result?slug=kali-puja`, {
    headers: { "x-participant-token": tokenExamB },
  });
  const earlyResultData = await earlyResultRes.json();
  assert(earlyResultData.ready === false, "Early result query: ready is false within 2 minutes");
  assert(
    earlyResultData.message.includes("মায়ের আশীর্বাদে"),
    `Processing message displayed: "${earlyResultData.message}"`
  );

  // Simulate passage of 2 minutes by updating resultAvailableAt to past
  await prisma.quizAttempt.update({
    where: { id: attemptB.id },
    data: { resultAvailableAt: new Date(Date.now() - 1000) },
  });

  // Query result after 2 minutes -> now finalized with score & detailed questions
  const finalResultRes = await fetch(`${BASE_URL}/api/quiz/result?slug=kali-puja`, {
    headers: { "x-participant-token": tokenExamB },
  });
  const finalResultData = await finalResultRes.json();
  assert(finalResultData.ready === true, "Final result returned after 2 minutes (ready: true)");
  assert(typeof finalResultData.score === "number", `Score calculated out of 50: ${finalResultData.score}`);
  assert(typeof finalResultData.correctCount === "number", `Correct count: ${finalResultData.correctCount}`);
  assert(typeof finalResultData.incorrectCount === "number", `Incorrect count: ${finalResultData.incorrectCount}`);
  assert(typeof finalResultData.unansweredCount === "number", `Unanswered count: ${finalResultData.unansweredCount}`);
  assert(finalResultData.isFirstTimeReview === true, "First review access flagged as isFirstTimeReview: true");
  assert(Array.isArray(finalResultData.detailedResults), "Detailed question explanations returned on first review");

  // One-time review restriction test: Subsequent queries reflect reviewAccessed
  const secondResultRes = await fetch(`${BASE_URL}/api/quiz/result?slug=kali-puja`, {
    headers: { "x-participant-token": tokenExamB },
  });
  const secondResultData = await secondResultRes.json();
  assert(secondResultData.isFirstTimeReview === false, "1-Time review rule: subsequent access has isFirstTimeReview: false");
  assert(secondResultData.canReviewAnswers === false, "Detailed answers locked after initial review");

  // =========================================================================
  // SECTION 7: INDIVIDUAL CERTIFICATE ELIGIBILITY & GRADE MAPPING
  // =========================================================================
  console.log("\n▶ [TEST 7] Individual Certificate Eligibility (20+20+40 Rules) & Grade Mapping");

  // Case 1: Kali Puja 35/50, Bhai Phonta 5/50, Total 40/100 -> NOT eligible because Bhai Phonta < 20
  const eligCase1 = checkIndividualEligibility(35, 5);
  assert(
    eligCase1.isEligible === false,
    `Counter-example: 35/50 + 5/50 = 40/100 rejected (Bhai Phonta < 20) => ${eligCase1.message}`
  );

  // Case 2: Kali Puja 19/50, Bhai Phonta 25/50, Total 44/100 -> NOT eligible because Kali Puja < 20
  const eligCase2 = checkIndividualEligibility(19, 25);
  assert(eligCase2.isEligible === false, "19/50 + 25/50 rejected (Kali Puja < 20)");

  // Case 3: Kali Puja 20/50, Bhai Phonta 20/50, Total 40/100 -> Eligible (Bare minimum pass)
  const eligCase3 = checkIndividualEligibility(20, 20);
  assert(eligCase3.isEligible === true, "20/50 + 20/50 = 40/100 eligible (All minimum conditions met)");

  // Case 4: Kali Puja 48/50, Bhai Phonta 47/50, Total 95/100 -> Eligible (Grade A+)
  const eligCase4 = checkIndividualEligibility(48, 47);
  const grade4 = getGradeAndTitle(48 + 47);
  assert(eligCase4.isEligible === true && grade4.grade === "A+", "48 + 47 = 95/100 maps to Grade A+");
  assert(
    grade4.titleBn === "বিশেষ কৃতিত্ব" && grade4.titleEn === "Excellent Achievement",
    `Grade A+ title: "${grade4.titleBn} / ${grade4.titleEn}"`
  );

  // Test Grade Mapping across all tiers
  assert(getGradeAndTitle(100).grade === "O", "100 => Grade O (অসাধারণ কৃতিত্ব / Outstanding Achievement)");
  assert(getGradeAndTitle(95).grade === "A+", "90-99 => Grade A+");
  assert(getGradeAndTitle(85).grade === "A", "80-89 => Grade A (প্রশংসনীয় কৃতিত্ব / Very Good Achievement)");
  assert(getGradeAndTitle(75).grade === "B+", "70-79 => Grade B+ (উল্লেখযোগ্য কৃতিত্ব / Notable Achievement)");
  assert(getGradeAndTitle(65).grade === "B", "60-69 => Grade B (ভালো কৃতিত্ব / Good Achievement)");
  assert(getGradeAndTitle(55).grade === "C", "50-59 => Grade C (অংশগ্রহণে কৃতিত্ব / Meritorious Participation)");
  assert(getGradeAndTitle(45).grade === "D", "0-49 => Grade D (অংশগ্রহণের স্বীকৃতি / Participation Recognition)");

  // =========================================================================
  // SECTION 8: AUTOMATIC INDIVIDUAL CERTIFICATE & PDF DOWNLOAD
  // =========================================================================
  console.log("\n▶ [TEST 8] Automatic Individual Certificate Generation & PDF Download");

  // Create an eligible participant who completed both days
  const partCert = await prisma.participant.create({
    data: {
      name: "প্রদীপ্ত চক্রবর্তী",
      normalizedName: "pradipta chakraborty",
      code: "MK-2026-CERT-01",
      mobileNumber: "9876500001",
      pinHash: "2026",
    },
  });

  await prisma.quizAttempt.create({
    data: {
      participantId: partCert.id,
      quizEventId: day1Event.id,
      score: 42,
      durationSeconds: 1500,
      isCompleted: true,
      resultAvailableAt: new Date(Date.now() - 5000),
    },
  });

  await prisma.quizAttempt.create({
    data: {
      participantId: partCert.id,
      quizEventId: day2Event.id,
      score: 44,
      durationSeconds: 1600,
      isCompleted: true,
      resultAvailableAt: new Date(Date.now() - 5000),
    },
  });

  // Auto-generate certificate via library
  const certGenResult = await autoGenerateIndividualCertificate(partCert.id);
  assert(certGenResult !== null, "Individual certificate automatically generated in backend");
  assert(certGenResult.certificateCode.startsWith("NKP-2026-"), `Certificate ID format: ${certGenResult.certificateCode}`);
  assert(certGenResult.combinedScore === 86, `Combined score correctly calculated: ${certGenResult.combinedScore}`);
  assert(certGenResult.grade === "A", `Grade correctly evaluated: ${certGenResult.grade}`);

  // Test Idempotency: re-triggering does NOT issue a new Certificate ID
  const certGenResult2 = await autoGenerateIndividualCertificate(partCert.id);
  assert(
    certGenResult.certificateCode === certGenResult2.certificateCode,
    "Idempotency verified: Same Certificate ID returned on subsequent auto-gen calls"
  );

  // Test PDF file existence on disk
  const pdfPath = certGenResult.pdfPath;
  assert(pdfPath !== null, `PDF path generated: ${pdfPath}`);
  const absolutePdfPath = `${process.cwd()}/public${pdfPath}`;
  assert(fs.existsSync(absolutePdfPath), "PDF file successfully created on disk in public/certificates/");

  // Verify PDF header
  const pdfBuffer = fs.readFileSync(absolutePdfPath);
  const pdfHeader = pdfBuffer.slice(0, 5).toString("utf-8");
  assert(pdfHeader.startsWith("%PDF"), `PDF has valid binary signature: ${pdfHeader}`);

  // =========================================================================
  // SECTION 9: FAMILY SCORING, PERCENTAGE & FAMILY ACHIEVEMENT CERTIFICATE
  // =========================================================================
  console.log("\n▶ [TEST 9] Family Pack Scoring, 40% Eligibility & Head-Only Access");

  // Register a 5-member family
  const fam5Res = await fetch(`${BASE_URL}/api/family/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      familyHeadName: "শ্যামল রায়চৌধুরী",
      mobileNumber: "9433112255",
      memberNames: [
        "অপর্ণা রায়চৌধুরী",
        "সৌরভ রায়চৌধুরী",
        "কোয়েল রায়চৌধুরী",
        "মৌসুমী রায়চৌধুরী",
      ],
    }),
  });
  const fam5Data = await fam5Res.json();
  const fam5Id = fam5Data.familyPack.id;
  const fam5HeadToken = fam5Data.token;
  assert(fam5Res.status === 200, "Created 5-member family for certificate test");

  // Fetch all members of this family
  const fam5Members = await prisma.participant.findMany({
    where: { familyPackId: fam5Id },
    orderBy: { createdAt: "asc" },
  });
  assert(fam5Members.length === 5, "Verified 5 members in family");

  const headMember = fam5Members.find((m) => m.isFamilyHead);
  const nonHeadMember = fam5Members.find((m) => !m.isFamilyHead);

  // Simulate quiz attempts for all 5 members:
  // Each member scores 25 in Kali Puja and 25 in Bhai Phonta => 50/100 each.
  // Family Total Score = 5 * 50 = 250 / 500 (50% >= 40% required!)
  for (const m of fam5Members) {
    await prisma.quizAttempt.create({
      data: {
        participantId: m.id,
        quizEventId: day1Event.id,
        score: 25,
        durationSeconds: 1000,
        isCompleted: true,
        resultAvailableAt: new Date(Date.now() - 5000),
      },
    });
    await prisma.quizAttempt.create({
      data: {
        participantId: m.id,
        quizEventId: day2Event.id,
        score: 25,
        durationSeconds: 1000,
        isCompleted: true,
        resultAvailableAt: new Date(Date.now() - 5000),
      },
    });
  }

  // Recalculate family score
  const famRecalc = await recalculateFamilyScore(fam5Id);
  assert(famRecalc.allMembersCompletedBoth === true, "All 5 family members completed both quizzes");
  assert(famRecalc.familyPack.familyScore === 250, `Total Family Score = 250: ${famRecalc.familyPack.familyScore}`);
  assert(famRecalc.familyPack.maxPossibleScore === 500, `Max possible score for 5 members = 500: ${famRecalc.familyPack.maxPossibleScore}`);
  assert(famRecalc.familyPack.achievementPercentage === 50, `Achievement percentage = 50%: ${famRecalc.familyPack.achievementPercentage}%`);
  assert(famRecalc.familyPack.isEligibleForCertificate === true, "Family eligible for Family Achievement Certificate (50% >= 40%)");

  // Auto-generate Family Certificate
  const famCert = await autoGenerateFamilyCertificate(fam5Id);
  assert(famCert !== null, "Family Achievement Certificate automatically generated");
  assert(famCert.certificateCode.startsWith("FAM-2026-"), `Family Certificate Code format: ${famCert.certificateCode}`);
  assert(famCert.grade === "C", `Family Grade evaluated from 50%: ${famCert.grade}`);

  // Test Head vs Non-Head Certificate API Access
  const headCertRes = await fetch(`${BASE_URL}/api/certificate/my`, {
    headers: { "x-participant-token": fam5HeadToken },
  });
  const headCertData = await headCertRes.json();
  assert(headCertData.hasFamilyCertificate === true, "Family Head can view Family Achievement Certificate");
  assert(
    headCertData.familyCertificate.certificateCode === famCert.certificateCode,
    "Family Head retrieves matching Family Certificate"
  );

  // Authenticate non-head member
  const nonHeadJoinRes = await fetch(`${BASE_URL}/api/family/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      memberName: nonHeadMember.name,
      mobileNumber: "9433112255",
      familyId: fam5Data.familyPack.familyId,
    }),
  });
  const nonHeadToken = (await nonHeadJoinRes.json()).token;

  const nonHeadCertRes = await fetch(`${BASE_URL}/api/certificate/my`, {
    headers: { "x-participant-token": nonHeadToken },
  });
  const nonHeadCertData = await nonHeadCertRes.json();
  assert(
    nonHeadCertData.hasFamilyCertificate === false,
    "Security: Non-head member cannot access or download Family Certificate"
  );

  // Family Dashboard API call
  const famDashRes = await fetch(`${BASE_URL}/api/family/dashboard`, {
    headers: { "x-participant-token": fam5HeadToken },
  });
  const famDashData = await famDashRes.json();
  assert(famDashRes.status === 200, "Family Dashboard returned 200 OK");
  assert(famDashData.totalFamilyScore === 250, "Dashboard displays correct Family Score: 250");
  assert(famDashData.members.length === 5, "Dashboard displays all 5 registered members");

  // =========================================================================
  // SECTION 10: PUBLIC LEADERBOARD (INDIVIDUAL & FAMILY PACK TABS)
  // =========================================================================
  console.log("\n▶ [TEST 10] Public Leaderboard (Individual & Family Packs) & Tie-Handling");

  const lbRes = await fetch(`${BASE_URL}/api/leaderboard`);
  const lbData = await lbRes.json();
  assert(lbRes.status === 200, "Leaderboard API returned 200 OK");
  assert(Array.isArray(lbData.individualLeaderboard), "Individual leaderboard array returned");
  assert(Array.isArray(lbData.familyLeaderboard), "Family leaderboard array returned");

  // Privacy verification: Ensure mobile numbers are NEVER returned in public leaderboard
  const exposesIndividualMobile = lbData.individualLeaderboard.some((entry) => entry.mobileNumber);
  const exposesFamilyMobile = lbData.familyLeaderboard.some((entry) => entry.mobileNumber);
  assert(!exposesIndividualMobile, "Privacy: Individual leaderboard does NOT expose mobile numbers");
  assert(!exposesFamilyMobile, "Privacy: Family leaderboard does NOT expose mobile numbers");

  // Verify Family Leaderboard entry contents
  const famEntry = lbData.familyLeaderboard.find((f) => f.familyId === fam5Data.familyPack.familyId);
  assert(famEntry !== undefined, "Family Pack appears on public leaderboard");
  assert(famEntry.memberCount === 5, "Family size is displayed");
  assert(famEntry.familyScore === 250, "Family combined score displayed: 250");
  assert(famEntry.achievementPercentage === 50, "Family percentage displayed: 50%");

  // =========================================================================
  // SECTION 11: EXISTING WEBSITE REGRESSION TESTS
  // =========================================================================
  console.log("\n▶ [TEST 11] Existing Website Regression Tests (Blessings, Audio, Music, Admin)");

  const homeRes = await fetch(`${BASE_URL}/`);
  assert(homeRes.status === 200, "Home page (/) loads successfully");

  const blessingsRes = await fetch(`${BASE_URL}/blessings`);
  assert(blessingsRes.status === 200, "Maa Kali Blessing experience (/blessings) loads successfully");

  const musicRes = await fetch(`${BASE_URL}/music`);
  assert(musicRes.status === 200, "Devotional Songs page (/music) loads successfully");

  const audiobookRes = await fetch(`${BASE_URL}/audiobook`);
  assert(audiobookRes.status === 200, "Audiobook & Mahima page (/audiobook) loads successfully");

  const pranamRes = await fetch(`${BASE_URL}/pranam`);
  assert(pranamRes.status === 200, "Interactive Pranam page (/pranam) loads successfully");

  const adminSheetsRes = await fetch(`${BASE_URL}/admin/sheets`);
  assert(adminSheetsRes.status === 200, "Admin Google Sheets live sync page (/admin/sheets) loads successfully");

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log("\n========================================================================");
  console.log(`📊 MASTER TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("❌ Exception during test execution:", e);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await cleanupTestData();
    } catch {}
    await prisma.$disconnect();
  });
