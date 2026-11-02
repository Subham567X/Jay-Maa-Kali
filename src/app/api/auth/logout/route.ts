import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/auth";

export async function POST() {
  clearAdminSessionCookie();
  return NextResponse.json({ success: true, message: "Logged out" });
}
