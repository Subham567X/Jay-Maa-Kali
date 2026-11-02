import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.adminUser.findMany();
  console.log("Admins in DB:", admins.map(a => ({ id: a.id, username: a.username, name: a.name, role: a.role })));

  const committee = await prisma.committeeMember.findMany();
  console.log("Committee in DB:", committee.map(c => ({ id: c.id, name: c.name, aliases: c.aliases })));

  const participants = await prisma.participant.findMany({
    include: { attempts: true }
  });
  console.log("Participants in DB:", participants.map(p => ({ id: p.id, code: p.code, name: p.name, attempts: p.attempts.length })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
