import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await prisma.quizEvent.findMany({
      orderBy: { dayNumber: "asc" },
      select: {
        id: true,
        dayNumber: true,
        slug: true,
        title: true,
        subtitle: true,
        description: true,
        timeLimitSeconds: true,
        totalQuestions: true,
        isOpen: true,
        isLocked: true,
        _count: {
          select: { questions: { where: { isActive: true } } },
        },
      },
    });

    return NextResponse.json({ success: true, events });
  } catch (err: any) {
    console.error("Quiz events fetch error:", err);
    return NextResponse.json({ error: "কুইজ তথ্য লোড করতে ব্যর্থ" }, { status: 500 });
  }
}
