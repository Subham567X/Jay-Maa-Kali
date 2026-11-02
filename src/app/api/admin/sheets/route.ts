import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, logAdminAction } from "@/lib/auth";
import { getGoogleSheetSettings } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });
    }

    const settings = await getGoogleSheetSettings();
    const totalParticipants = await prisma.participant.count();
    const totalAttempts = await prisma.quizAttempt.count({ where: { isCompleted: true } });

    return NextResponse.json({
      success: true,
      settings,
      stats: {
        totalParticipants,
        totalAttempts,
      },
    });
  } catch (err: any) {
    console.error("Sheets setting GET error:", err);
    return NextResponse.json({ error: "গুগল শিট সেটিংস লোড করতে সমস্যা" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });
    }

    const body = await req.json();
    const { webhookUrl, sheetUrl, isEnabled, syncOnRegister, syncOnSubmit } = body;

    const updated = await prisma.googleSheetSetting.upsert({
      where: { id: "default" },
      update: {
        webhookUrl: webhookUrl !== undefined ? webhookUrl?.trim() : undefined,
        sheetUrl: sheetUrl !== undefined ? sheetUrl?.trim() : undefined,
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : undefined,
        syncOnRegister: syncOnRegister !== undefined ? Boolean(syncOnRegister) : undefined,
        syncOnSubmit: syncOnSubmit !== undefined ? Boolean(syncOnSubmit) : undefined,
      },
      create: {
        id: "default",
        webhookUrl: webhookUrl?.trim() || null,
        sheetUrl: sheetUrl?.trim() || null,
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
        syncOnRegister: syncOnRegister !== undefined ? Boolean(syncOnRegister) : true,
        syncOnSubmit: syncOnSubmit !== undefined ? Boolean(syncOnSubmit) : true,
      },
    });

    await logAdminAction(admin.username, "UPDATE_GOOGLE_SHEET_SETTINGS", "GoogleSheetSetting", "default", {
      isEnabled: updated.isEnabled,
      hasWebhook: !!updated.webhookUrl,
      hasSheetUrl: !!updated.sheetUrl,
    });

    return NextResponse.json({
      success: true,
      message: "গুগল শিট সেটিংস সফলভাবে সংরক্ষিত হয়েছে!",
      settings: updated,
    });
  } catch (err: any) {
    console.error("Sheets setting POST error:", err);
    return NextResponse.json({ error: "সেটিংস সংরক্ষণ ব্যর্থ হয়েছে" }, { status: 500 });
  }
}
