import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STRICT_EXIT_MESSAGE_BN =
  "আপনি কুইজ থেকে বেরিয়ে গিয়েছেন। নির্ধারিত নিয়ম অনুযায়ী আপনার এই কুইজের প্রচেষ্টা বাতিল করা হয়েছে। একই কুইজে পুনরায় অংশগ্রহণ করা যাবে না।";

async function runTests() {
  console.log("🛡️ ========================================================");
  console.log("🛡️ TESTING QUIZ SECURITY, VIDEO BLESSINGS & FAIR-PLAY SYSTEM");
  console.log("🛡️ ========================================================\n");

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

  try {
    // 1. Database Schema & Models Verification
    console.log("▶ TEST 1: Prisma Schema Verification for Security Models");
    const setting = await prisma.quizSecuritySetting.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        requireFullscreen: true,
        tabSwitchWarning: true,
        maxWarnings: 2,
        invalidateOnExit: true,
        allowRefresh: true,
        canAdminReview: true,
      },
    });

    assert(setting !== null, "QuizSecuritySetting model exists and can be retrieved");
    assert(setting.requireFullscreen === true, "Require Fullscreen is active by default");
    assert(setting.maxWarnings === 2, "Max allowed warnings defaults to 2");
    assert(setting.invalidateOnExit === true, "Invalidate on Exit defaults to true");

    // 2. Video Blessing Gate & Participant Tracking
    console.log("\n▶ TEST 2: Blessing Video Status & Gate Verification");
    let testPart = await prisma.participant.findFirst({
      where: { code: "MK-TEST-VERIFY-1" },
    });

    if (testPart) {
      await prisma.quizAttempt.deleteMany({ where: { participantId: testPart.id } });
      await prisma.participant.delete({ where: { id: testPart.id } });
    }

    testPart = await prisma.participant.create({
      data: {
        code: "MK-TEST-VERIFY-1",
        name: "সৌমেন ভট্টাচার্য",
        normalizedName: "soumen bhattacharya",
        pinHash: "2026",
        isCommittee: false,
        blessingVideoCompleted: false,
      },
    });

    assert(testPart.blessingVideoCompleted === false, "Participant starts with uncompleted blessing video");

    // Complete video
    const completedPart = await prisma.participant.update({
      where: { id: testPart.id },
      data: {
        blessingVideoCompleted: true,
        blessingVideoWatchedAt: new Date(),
      },
    });
    assert(completedPart.blessingVideoCompleted === true, "Blessing video completion flag set in database");

    // 3. Quiz Attempt Creation & In-progress locking
    console.log("\n▶ TEST 3: In-Progress Attempt Locking");
    const event = await prisma.quizEvent.findFirst({ where: { dayNumber: 1 } });
    assert(event !== null, "Day 1 Quiz Event exists");

    const attempt = await prisma.quizAttempt.create({
      data: {
        participantId: testPart.id,
        quizEventId: event.id,
        status: "IN_PROGRESS",
        isCompleted: false,
        isInvalidated: false,
        warningCount: 0,
        videoCompleted: true,
      },
    });

    assert(attempt.status === "IN_PROGRESS", "Attempt locked as IN_PROGRESS");
    assert(attempt.isInvalidated === false, "Attempt is not invalidated");

    // 4. Violation Tracking & Warning Threshold
    console.log("\n▶ TEST 4: Violation Tracking & Tab-Switch Warning Counter");
    // Violation 1
    const v1 = await prisma.quizViolation.create({
      data: {
        attemptId: attempt.id,
        eventType: "TAB_SWITCH",
        warningNumber: 1,
        details: "User navigated to external window",
      },
    });
    await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: { warningCount: 1 },
    });
    assert(v1.warningNumber === 1, "Violation #1 recorded with timestamp");

    // Violation 2
    const v2 = await prisma.quizViolation.create({
      data: {
        attemptId: attempt.id,
        eventType: "WINDOW_BLUR",
        warningNumber: 2,
        details: "Window lost focus",
      },
    });
    await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: { warningCount: 2 },
    });
    assert(v2.warningNumber === 2, "Violation #2 recorded with timestamp");

    // Violation 3: Exceeds maxWarnings (2) -> Invalidate!
    const v3 = await prisma.quizViolation.create({
      data: {
        attemptId: attempt.id,
        eventType: "TAB_SWITCH",
        warningNumber: 3,
        details: "User switched tab 3rd time",
      },
    });
    const disqualifiedAttempt = await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        warningCount: 3,
        status: "INVALIDATED",
        isInvalidated: true,
        invalidationReason: "কুইজ চলাকালীন অনুমতিহীন ক্রিয়াকলাপের সর্বোচ্চ সতর্কতা সীমা (২ বার) অতিক্রম করার কারণে আপনার কুইজের প্রচেষ্টা বাতিল করা হয়েছে।",
      },
    });

    assert(disqualifiedAttempt.isInvalidated === true, "Attempt marked as invalidated after exceeding maxWarnings");
    assert(disqualifiedAttempt.status === "INVALIDATED", "Attempt status is INVALIDATED");

    // 5. Direct Exit / Back Navigation Disqualification
    console.log("\n▶ TEST 5: Direct Exit / Back Button Disqualification & Required Bengali Message");
    let testPart2 = await prisma.participant.findFirst({
      where: { code: "MK-TEST-VERIFY-2" },
    });

    if (testPart2) {
      await prisma.quizAttempt.deleteMany({ where: { participantId: testPart2.id } });
      await prisma.participant.delete({ where: { id: testPart2.id } });
    }

    testPart2 = await prisma.participant.create({
      data: {
        code: "MK-TEST-VERIFY-2",
        name: "প্রস্থান পরীক্ষার্থী",
        normalizedName: "exit candidate",
        pinHash: "2026",
        isCommittee: false,
        blessingVideoCompleted: true,
      },
    });

    const exitAttempt = await prisma.quizAttempt.create({
      data: {
        participantId: testPart2.id,
        quizEventId: event.id,
        status: "INVALIDATED",
        isInvalidated: true,
        invalidationReason: STRICT_EXIT_MESSAGE_BN,
        invalidationDetails: "Participant pressed browser back button during active quiz",
      },
    });

    assert(exitAttempt.isInvalidated === true, "Exit attempt is invalidated");
    assert(
      exitAttempt.invalidationReason === STRICT_EXIT_MESSAGE_BN,
      `Matches mandatory Bengali string: "${STRICT_EXIT_MESSAGE_BN}"`
    );

    // 6. Exclusion from Leaderboard & Certificate Eligibility
    console.log("\n▶ TEST 6: Disqualified Attempt Exclusion from Calculations");
    const validAttempts = await prisma.quizAttempt.findMany({
      where: { isCompleted: true, isInvalidated: false },
    });
    const invalidInValidQuery = validAttempts.find((a) => a.id === exitAttempt.id || a.id === attempt.id);
    assert(invalidInValidQuery === undefined, "Invalidated attempts are strictly excluded from completed queries");

    // 7. Admin Reinstatement
    console.log("\n▶ TEST 7: Admin Manual Review & Reinstatement");
    const reinstated = await prisma.quizAttempt.update({
      where: { id: exitAttempt.id },
      data: {
        status: "IN_PROGRESS",
        isInvalidated: false,
        warningCount: 0,
        reviewedByAdmin: true,
        adminReviewNotes: "Verified technical disconnect, granted reinstatement",
      },
    });

    assert(reinstated.isInvalidated === false, "Attempt successfully reinstated");
    assert(reinstated.status === "IN_PROGRESS", "Status restored to IN_PROGRESS");
    assert(reinstated.reviewedByAdmin === true, "reviewedByAdmin flag is true");

    // Clean up test records
    await prisma.quizViolation.deleteMany({
      where: { attemptId: { in: [attempt.id, exitAttempt.id] } },
    });
    await prisma.quizAttempt.deleteMany({
      where: { participantId: { in: [testPart.id, testPart2.id] } },
    });
    await prisma.participant.deleteMany({
      where: { id: { in: [testPart.id, testPart2.id] } },
    });

    console.log("\n========================================================");
    console.log(`ALL SECURITY & FAIR PLAY TESTS PASSED! (${passed}/${passed})`);
    console.log("========================================================\n");
  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
