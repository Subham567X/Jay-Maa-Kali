import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const PARTICIPANT_COOKIE = "nakunda_participant_session";

export async function POST() {
  try {
    const cookieStore = cookies();
    cookieStore.delete(PARTICIPANT_COOKIE);

    return NextResponse.json({
      success: true,
      message: "অংশগ্রহণকারী সেশন সফলভাবে সমাপ্ত করা হয়েছে",
    });
  } catch (err: any) {
    console.error("Participant logout error:", err);
    return NextResponse.json({ error: "লগআউট ব্যর্থ হয়েছে" }, { status: 500 });
  }
}
