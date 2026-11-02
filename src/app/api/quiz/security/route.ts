import { NextResponse } from "next/server";
import { getQuizSecuritySettings } from "@/lib/security";

export async function GET() {
  try {
    const settings = await getQuizSecuritySettings();
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (err: any) {
    console.error("Fetch security settings error:", err);
    return NextResponse.json({ error: "নিরাপত্তা সেটিংস লোড করতে ব্যর্থ" }, { status: 500 });
  }
}
