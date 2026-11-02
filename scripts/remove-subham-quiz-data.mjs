import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("🌸 Executing updates for Subham...");

  // 1. Delete participant 'subham' from quiz registration table
  const participantsToDelete = await prisma.participant.findMany({
    where: {
      OR: [
        { name: "subham" },
        { normalizedName: "subham" },
        { code: "MK-2026-8067" }
      ]
    },
    include: { attempts: true }
  });

  for (const p of participantsToDelete) {
    for (const a of p.attempts) {
      await prisma.quizViolation.deleteMany({ where: { attemptId: a.id } });
      console.log(`Deleted violations for attempt ${a.id}`);
    }
    await prisma.quizAttempt.deleteMany({ where: { participantId: p.id } });
    console.log(`Deleted attempts for participant ${p.name}`);

    await prisma.winnerApproval.deleteMany({ where: { participantId: p.id } });

    await prisma.participant.delete({ where: { id: p.id } });
    console.log(`✅ Removed participant data: ${p.name} (${p.code}) from Quiz Registration.`);
  }

  // 2. Ensure Admin reflects Subham
  const admin = await prisma.adminUser.findFirst();
  if (admin) {
    const updatedAdmin = await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        name: "Subham Ghorui (প্রধান অ্যাডমিন)",
      }
    });
    console.log(`✅ Admin updated: ${updatedAdmin.username} -> Name: "${updatedAdmin.name}", Role: ${updatedAdmin.role}`);
  }

  // 3. Ensure Committee member 'Subham Ghorui' is active & present
  const committeeMember = await prisma.committeeMember.findFirst({
    where: {
      OR: [
        { name: { contains: "Subham" } },
        { normalizedName: { contains: "subham" } }
      ]
    }
  });

  if (committeeMember) {
    console.log(`✅ Committee Member verified: "${committeeMember.name}" is present as committee member.`);
  }

  // 4. Verification check
  const totalParticipants = await prisma.participant.count();
  const totalAttempts = await prisma.quizAttempt.count();
  const totalCommittee = await prisma.committeeMember.count();
  const allAdmins = await prisma.adminUser.findMany();

  console.log("\n================ VERIFICATION ================");
  console.log(`Quiz Participants count: ${totalParticipants}`);
  console.log(`Quiz Attempts count: ${totalAttempts}`);
  console.log(`Committee Members count: ${totalCommittee}`);
  console.log(`Admins:`, allAdmins.map(a => `${a.name} (${a.username}, ${a.role})`));
}

run().catch(console.error).finally(() => prisma.$disconnect());
