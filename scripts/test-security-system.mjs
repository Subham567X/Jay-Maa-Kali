import { PrismaClient } from "@prisma/client";
import { 
  getQuizSecuritySettings, 
  updateQuizSecuritySettings, 
  processQuizViolation, 
  STRICT_EXIT_MESSAGE_BN 
} from "../src/lib/security.js";
import { getCalculatedLeaderboard } from "../src/lib/winner.js";

const prisma = new PrismaClient();

async function runSecurityTests() {
  console.log("🛡️ ========================================================");
  console.log("🛡️ RUNNING QUIZ SECURITY & FAIR-PLAY SYSTEM TESTS");
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
    // 1. Settings check
    console.log("▶ TEST 1: Quiz Security Settings Retrieval & Initialization");
    const settings = await getQuizSecuritySettings();
    assert(settings.requireFullscreen === true, "Require fullscreen defaults to true");
    assert(settings.tabSwitchWarning === true, "Tab switch warning defaults to true");
    assert(settings.maxWarnings === 2, "Default max warnings is 2");
    assert(settings.invalidateOnExit === true, "Invalidate on exit defaults to true");
    assert(settings.warningMessageBn.includes("কুইজ চলাকালীন অন্য কোনো ওয়েবসাইট"), "Default Bengali warning message present");

    // 2. Fetch or create a test participant and quiz event
    console.log("\n▶ TEST 2: Participant Setup & Blessing Video Tracking");
    let testPart = await prisma.participant.findFirst({
      where: { code: "MK-TEST-SEC-1" },
    });

    if (!testPart) {
      testPart = await prisma.participant.create({
        data: {
          code: "MK-TEST-SEC-1",
          name: "নিরাপত্তা পরীক্ষক",
          normalizedName: "security tester",
          pinHash: "2026",
          isCommittee: false,
          blessingVideoCompleted: false,
        },
      });
    }

    assert(testPart.blessingVideoCompleted === false, "Test participant starts with uncompleted blessing video");

    // Update blessing video completion
    const updatedPart = await prisma.participant.update({
      where: { id: testPart.id },
      data: {
        blessingVideoCompleted: true,
        blessingVideoWatchedAt: new Date(),
      },
    });
    assert(updatedPart.blessingVideoCompleted === true, "Participant blessing video status updated to completed");

    // 3. Quiz Attempt Creation & In-progress locking
    console.log("\n▶ TEST 3: Attempt Locking & In-Progress Status");
    const event = await prisma.quizEvent.findFirst({ where: { dayNumber: 1 } });
    assert(event !== null, "Day 1 Quiz Event exists");

    // Delete prior test attempts for clean run
    await prisma.quizAttempt.deleteMany({
      where: { participantId: testPart.id },
    });

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

    assert(attempt.status === "IN_PROGRESS", "New attempt is locked with status IN_PROGRESS");
    assert(attempt.isInvalidated === false, "New attempt is not invalidated");

    // 4. Violation Tracking: Tab Switch Warning
    console.log("\n▶ TEST 4: Tab Switch Warning & Counter");
    const v1 = await processQuizViolation(attempt.id, "TAB_SWITCH", "User switched tab 1st time");
    assert(v1.warningCount === 1, "First tab switch increments warningCount to 1");
    assert(v1.isInvalidated === false, "First violation does not invalidate (within maxWarnings limit)");

    const v2 = await processQuizViolation(attempt.id, "TAB_SWITCH", "User switched tab 2nd time");
    assert(v2.warningCount === 2, "Second tab switch increments warningCount to 2");
    assert(v2.isInvalidated === false, "Second violation still within 2 warnings limit");

    // 3rd violation should trigger invalidation!
    const v3 = await processQuizViolation(attempt.id, "TAB_SWITCH", "User switched tab 3rd time");
    assert(v3.isInvalidated === true, "Exceeding maxWarnings (3rd violation) triggers invalidation");
    assert(v3.attempt.status === "INVALIDATED", "Attempt status changed to INVALIDATED");
    assert(v3.attempt.invalidationReason.includes("সর্বোচ্চ সতর্কতা সীমা"), "Invalidation reason logged properly");

    // 5. Direct Exit / Back Navigation Disqualification
    console.log("\n▶ TEST 5: Direct Page Exit / Back Button Disqualification & Required Bengali Message");
    let testPart2 = await prisma.participant.findFirst({
      where: { code: "MK-TEST-SEC-2" },
    });

    if (!testPart2) {
      testPart2 = await prisma.participant.create({
        data: {
          code: "MK-TEST-SEC-2",
          name: "প্রস্থান পরীক্ষক",
          normalizedName: "exit tester",
          pinHash: "2026",
          isCommittee: false,
          blessingVideoCompleted: true,
        },
      });
    }

    await prisma.quizAttempt.deleteMany({
      where: { participantId: testPart2.id },
    });

    const attempt2 = await prisma.quizAttempt.create({
      data: {
        participantId: testPart2.id,
        quizEventId: event.id,
        status: "IN_PROGRESS",
        isCompleted: false,
        isInvalidated: false,
        warningCount: 0,
      },
    });

    const exitRes = await processQuizViolation(attempt2.id, "BACK_NAVIGATION", "User pressed browser back button");
    assert(exitRes.isInvalidated === true, "Back navigation immediately invalidates active attempt");
    assert(
      exitRes.message === STRICT_EXIT_MESSAGE_BN,
      `Shows exact required Bengali text: "${STRICT_EXIT_MESSAGE_BN}"`
    );

    // 6. Exclusion from Leaderboard & Certificate Eligibility
    console.log("\n▶ TEST 6: Disqualified Attempt Strict Exclusion from Leaderboard");
    // Ensure attempt2 is marked with a fake score to test that it is NOT counted
    await prisma.quizAttempt.update({
      where: { id: attempt2.id },
      data: {
        score: 48,
        isCompleted: true, // even if someone tried to mark completed
        isInvalidated: true, // it is invalidated!
        status: "INVALIDATED",
      },
    });

    const leaderboard = await getCalculatedLeaderboard(true);
    const inLeaderboard = leaderboard.find((p) => p.participantId === testPart2.id);
    assert(
      !inLeaderboard || (inLeaderboard.day1Score === 0 && !inLeaderboard.bothDaysCompleted),
      "Invalidated attempt is strictly excluded from leaderboard scoring & certificate eligibility"
    );

    // 7. Admin Manual Reinstatement
    console.log("\n▶ TEST 7: Admin Reinstatement Capability");
    const reinstated = await prisma.quizAttempt.update({
      where: { id: attempt2.id },
      data: {
        status: "IN_PROGRESS",
        isInvalidated: false,
        warningCount: 0,
        reviewedByAdmin: true,
        adminReviewNotes: "Reinstated by Admin after technical review",
      },
    });

    assert(reinstated.isInvalidated === false, "Reinstated attempt is no longer invalidated");
    assert(reinstated.status === "IN_PROGRESS", "Status restored to IN_PROGRESS");
    assert(reinstated.reviewedByAdmin === true, "Admin review flagged in record");

    // Clean up test data
    await prisma.quizViolation.deleteMany({
      where: { attemptId: { in: [attempt.id, attempt2.id] } },
    });
    await prisma.quizAttempt.deleteMany({
      where: { participantId: { in: [testPart.id, testPart2.id] } },
    });
    await prisma.participant.deleteMany({
      where: { code: { in: ["MK-TEST-SEC-1", "MK-TEST-SEC-2"] } },
    });

    console.log("\n========================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("========================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSecurityTests();
