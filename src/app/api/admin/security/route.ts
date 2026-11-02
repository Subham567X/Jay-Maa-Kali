import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/auth";
import { getQuizSecuritySettings, updateQuizSecuritySettings } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাডমিন অ্যাক্সেস" }, { status: 401 });
    }

    const settings = await getQuizSecuritySettings();

    // Fetch all invalidated attempts or attempts with warnings
    const flaggedAttempts = await prisma.quizAttempt.findMany({
      where: {
        OR: [{ isInvalidated: true }, { warningCount: { gt: 0 } }],
      },
      include: {
        participant: {
          select: { id: true, name: true, code: true, isCommittee: true },
        },
        quizEvent: {
          select: { id: true, title: true, dayNumber: true, slug: true },
        },
        violations: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Recent 50 violations across all attempts
    const recentViolations = await prisma.quizViolation.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        attempt: {
          include: {
            participant: { select: { name: true, code: true } },
            quizEvent: { select: { title: true, dayNumber: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      settings,
      flaggedAttempts,
      recentViolations,
    });
  } catch (err: any) {
    console.error("Admin security fetch error:", err);
    return NextResponse.json({ error: "নিরাপত্তা তথ্য লোড করতে ব্যর্থ" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাডমিন অ্যাক্সেস" }, { status: 401 });
    }

    const body = await req.json();

    const updatedSettings = await updateQuizSecuritySettings({
      requireFullscreen: typeof body.requireFullscreen === "boolean" ? body.requireFullscreen : undefined,
      tabSwitchWarning: typeof body.tabSwitchWarning === "boolean" ? body.tabSwitchWarning : undefined,
      maxWarnings: typeof body.maxWarnings === "number" ? body.maxWarnings : undefined,
      invalidateOnExit: typeof body.invalidateOnExit === "boolean" ? body.invalidateOnExit : undefined,
      allowRefresh: typeof body.allowRefresh === "boolean" ? body.allowRefresh : undefined,
      canAdminReview: typeof body.canAdminReview === "boolean" ? body.canAdminReview : undefined,
      warningMessageBn: typeof body.warningMessageBn === "string" ? body.warningMessageBn : undefined,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminUsername: admin.username,
        action: "UPDATE_QUIZ_SECURITY_SETTINGS",
        targetType: "QuizSecuritySetting",
        targetId: "default",
        detailsJson: JSON.stringify(updatedSettings),
        ipAddress: req.headers.get("x-forwarded-for") || req.ip || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      message: "কুইজ নিরাপত্তা সেটিংস সফলভাবে আপডেট হয়েছে।",
      settings: updatedSettings,
    });
  } catch (err: any) {
    console.error("Admin security update error:", err);
    return NextResponse.json({ error: "সেটিংস সংরক্ষণ ব্যর্থ" }, { status: 500 });
  }
}
