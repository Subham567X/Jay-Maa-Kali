import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const events = await prisma.quizEvent.findMany({
    include: {
      _count: {
        select: { questions: true, attempts: true }
      }
    }
  });
  console.log("Events:", events);

  const sampleQ = await prisma.quizQuestion.findFirst({
    include: { options: true }
  });
  console.log("Sample Question:", JSON.stringify(sampleQ, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
