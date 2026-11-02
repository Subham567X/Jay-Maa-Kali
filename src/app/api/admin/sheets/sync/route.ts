import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, logAdminAction } from "@/lib/auth";
import { bulkSyncAllParticipants } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });
    }

    const result = await bulkSyncAllParticipants();

    await logAdminAction(admin.username, "BULK_SYNC_GOOGLE_SHEET", "GoogleSheet", "default", {
      success: result.success,
      totalRows: result.totalRows,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `সর্বমোট ${result.totalRows} জন প্রতিযোগীর ডাটা এবং স্কোর সফলভাবে গুগল শিটে সিঙ্ক হয়েছে!`,
        totalRows: result.totalRows,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || result.reason || "গুগল শিটে ডাটা সিঙ্ক করতে সমস্যা হয়েছে",
      }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Sheets bulk sync error:", err);
    return NextResponse.json({ error: err.message || "সিঙ্ক করতে ব্যর্থ হয়েছে" }, { status: 500 });
  }
}
