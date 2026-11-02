import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, logAdminAction } from "@/lib/auth";
import { testGoogleSheetWebhook } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });
    }

    const result = await testGoogleSheetWebhook();

    await logAdminAction(admin.username, "TEST_GOOGLE_SHEET_WEBHOOK", "GoogleSheet", "default", {
      success: result.success,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "গুগল শিট কানেকশন সম্পূর্ণ সফল! গুগল শিটে টেস্ট বার্তা পাঠানো হয়েছে।",
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || result.reason || "গুগল শিটে সংযোগ করা সম্ভব হয়নি",
      }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Sheets test error:", err);
    return NextResponse.json({ error: err.message || "কানেকশন টেস্ট ব্যর্থ" }, { status: 500 });
  }
}
