import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, logAdminAction } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const dayNumber = Number(searchParams.get("day")) || 1;

    const event = await prisma.quizEvent.findFirst({
      where: { dayNumber },
      include: {
        questions: {
          orderBy: { questionNumber: "asc" },
          include: {
            options: {
              orderBy: { optionKey: "asc" },
            },
          },
        },
      },
    });

    if (!event) return NextResponse.json({ error: "ইভেন্ট পাওয়া যায়নি" }, { status: 404 });

    const validCount = event.questions.filter((q) => q.isActive).length;

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        dayNumber: event.dayNumber,
        isLocked: event.isLocked,
        isOpen: event.isOpen,
        timeLimitSeconds: event.timeLimitSeconds,
      },
      validCount,
      isExactly50: validCount === 50,
      questions: event.questions,
    });
  } catch (err: any) {
    console.error("Admin questions GET error:", err);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });

    const body = await req.json();
    const { questionId, questionText, explanation, options, forceUnlock } = body;

    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: { quizEvent: true },
    });

    if (!question) return NextResponse.json({ error: "প্রশ্ন পাওয়া যায়নি" }, { status: 404 });

    if (question.quizEvent.isLocked && !forceUnlock) {
      return NextResponse.json(
        { error: "কুইজের প্রশ্নাবলী বর্তমানে লক করা আছে। পরিবর্তন করতে সুস্পষ্ট আনলক অনুমতি প্রয়োজন।" },
        { status: 403 }
      );
    }

    // Update Question
    await prisma.quizQuestion.update({
      where: { id: questionId },
      data: {
        questionText: questionText?.trim() || question.questionText,
        explanation: explanation !== undefined ? explanation : question.explanation,
      },
    });

    // Update Options if provided
    if (options && Array.isArray(options)) {
      for (const opt of options) {
        if (opt.id) {
          await prisma.quizOption.update({
            where: { id: opt.id },
            data: {
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
            },
          });
        }
      }
    }

    await logAdminAction(admin.username, "UPDATE_QUESTION", "QuizQuestion", questionId, {
      questionNumber: question.questionNumber,
      eventId: question.quizEventId,
    });

    return NextResponse.json({ success: true, message: "প্রশ্ন সফলভাবে আপডেট হয়েছে" });
  } catch (err: any) {
    console.error("Admin questions PUT error:", err);
    return NextResponse.json({ error: "প্রশ্ন আপডেট করতে ত্রুটি" }, { status: 500 });
  }
}
