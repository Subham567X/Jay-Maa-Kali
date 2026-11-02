import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteSubhamData() {
  console.log("🌸 Starting removal of 'subham' participant data...");

  // 1. Find all participants matching 'subham'
  const matchingParticipants = await prisma.participant.findMany({
    where: {
      OR: [
        { name: { equals: "subham" } },
        { normalizedName: { equals: "subham" } },
        { name: { contains: "subham" } },
        { normalizedName: { contains: "subham" } }
      ]
    },
    include: {
      attempts: {
        include: {
          violations: true
        }
      },
      winnerApproval: true
    }
  });

  console.log(`Found ${matchingParticipants.length} participant(s) to remove:`);
  for (const p of matchingParticipants) {
    console.log(`- ID: ${p.id}, Code: ${p.code}, Name: "${p.name}", Attempts: ${p.attempts.length}`);

    // Delete attempts and violations
    for (const a of p.attempts) {
      const delViolations = await prisma.quizViolation.deleteMany({
        where: { attemptId: a.id }
      });
      console.log(`  Deleted ${delViolations.count} violations for attempt ${a.id}`);
    }

    const delAttempts = await prisma.quizAttempt.deleteMany({
      where: { participantId: p.id }
    });
    console.log(`  Deleted ${delAttempts.count} attempt(s) for participant ${p.name}`);

    if (p.winnerApproval) {
      await prisma.winnerApproval.delete({
        where: { participantId: p.id }
      });
      console.log(`  Deleted winner approval record for participant ${p.name}`);
    }

    // Delete participant
    await prisma.participant.delete({
      where: { id: p.id }
    });
    console.log(`  ✅ Successfully deleted Participant record: ${p.name} (${p.code})`);
  }

  // 2. Review CommitteeMember table
  // Subham Ghorui had alias "শুভম". Remove "শুভম" from aliases so single first-name "subham" or "শুভম" does not trigger committee restriction.
  const subhamCommittee = await prisma.committeeMember.findFirst({
    where: {
      OR: [
        { name: { contains: "Subham" } },
        { normalizedName: { contains: "subham" } }
      ]
    }
  });

  if (subhamCommittee) {
    let aliases = [];
    try {
      aliases = JSON.parse(subhamCommittee.aliases || "[]");
    } catch {
      aliases = [subhamCommittee.aliases];
    }

    // Filter out standalone "শুভম" or "subham"
    const cleanedAliases = aliases.filter(
      (a) => a !== "শুভম" && a !== "subham" && a !== "shubham" && a !== "সুভম"
    );

    await prisma.committeeMember.update({
      where: { id: subhamCommittee.id },
      data: {
        aliases: JSON.stringify(cleanedAliases)
      }
    });

    console.log(`✅ Updated CommitteeMember "${subhamCommittee.name}" aliases:`);
    console.log("   Before:", aliases);
    console.log("   After: ", cleanedAliases);
  }

  // 3. Verify database state
  const remainingParticipants = await prisma.participant.count();
  const remainingAttempts = await prisma.quizAttempt.count();
  console.log(`\n🎉 Verification Complete:`);
  console.log(`- Total participants remaining in database: ${remainingParticipants}`);
  console.log(`- Total quiz attempts remaining in database: ${remainingAttempts}`);
}

deleteSubhamData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
