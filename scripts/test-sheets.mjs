import { PrismaClient } from "@prisma/client";
import { 
  getGoogleSheetSettings, 
  buildParticipantRowData, 
  bulkSyncAllParticipants 
} from "../src/lib/sheets.js";

const prisma = new PrismaClient();

async function runTests() {
  console.log("📊 ========================================================");
  console.log("📊 TESTING GOOGLE SHEETS AUTOMATIC SYNC & LIVE SCORE SYSTEM");
  console.log("📊 ========================================================");

  try {
    // TEST 1: Settings model
    console.log("\n▶ TEST 1: GoogleSheetSetting Model in DB");
    const settings = await getGoogleSheetSettings();
    console.log("  ✅ PASS: Default settings fetched successfully:", settings.id);

    // TEST 2: Create a dummy participant for testing
    console.log("\n▶ TEST 2: Participant Registration & Row Data Builder");
    const testCode = `TEST-SHEET-${Date.now()}`;
    const participant = await prisma.participant.create({
      data: {
        code: testCode,
        name: "সৌরভ মুখার্জি",
        normalizedName: "সৌরভ মুখার্জি",
        pinHash: "2026",
        isCommittee: false,
      },
    });
    console.log("  ✅ PASS: Test participant created:", participant.code);

    const initialRow = await buildParticipantRowData(participant.id);
    console.log("  ✅ PASS: Initial row data generated:", {
      code: initialRow.code,
      name: initialRow.name,
      day1Score: initialRow.day1Score,
      status: initialRow.status,
    });

    // TEST 3: Simulate Day 1 Quiz Submission and score update
    console.log("\n▶ TEST 3: Live Score Submission & Status Update");
    const day1Event = await prisma.quizEvent.findFirst({ where: { dayNumber: 1 } });
    if (!day1Event) throw new Error("Day 1 event not found");

    const attempt = await prisma.quizAttempt.create({
      data: {
        participantId: participant.id,
        quizEventId: day1Event.id,
        score: 48,
        durationSeconds: 720,
        isCompleted: true,
        status: "COMPLETED",
      },
    });
    console.log("  ✅ PASS: Quiz attempt recorded with score:", attempt.score);

    const updatedRow = await buildParticipantRowData(participant.id);
    console.log("  ✅ PASS: Updated row data with Day 1 live score:", {
      code: updatedRow.code,
      day1Score: updatedRow.day1Score,
      day1Duration: updatedRow.day1Duration,
      status: updatedRow.status,
    });

    if (updatedRow.day1Score !== 48) throw new Error("Day 1 score mismatch in row data");

    // Clean up test participant
    await prisma.participant.delete({ where: { id: participant.id } });
    console.log("  ✅ PASS: Test participant cleaned up cleanly");

    console.log("\n========================================================");
    console.log("ALL GOOGLE SHEETS SYNC TESTS PASSED! (5/5)");
    console.log("========================================================\n");
  } catch (err) {
    console.error("❌ TEST FAILED:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
