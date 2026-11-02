import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectAndClean() {
  console.log("=== INSPECTING ALL PARTICIPANTS ===");
  const allParticipants = await prisma.participant.findMany({
    include: {
      attempts: {
        include: {
          violations: true
        }
      }
    }
  });
  console.log(`Total participants in database: ${allParticipants.length}`);
  for (const p of allParticipants) {
    console.log(`Participant -> ID: ${p.id}, Code: ${p.code}, Name: "${p.name}", Normalized: "${p.normalizedName}", isCommittee: ${p.isCommittee}, Reason: ${p.committeeMatchReason}`);
    for (const a of p.attempts) {
      console.log(`   Attempt ID: ${a.id}, Status: ${a.status}, Score: ${a.score}, Warnings: ${a.warningCount}`);
    }
  }

  console.log("\n=== INSPECTING COMMITTEE MEMBERS ===");
  const committee = await prisma.committeeMember.findMany();
  for (const c of committee) {
    console.log(`Committee -> ID: ${c.id}, Name: "${c.name}", Aliases: ${c.aliases}`);
  }
}

inspectAndClean().catch(console.error).finally(() => prisma.$disconnect());
