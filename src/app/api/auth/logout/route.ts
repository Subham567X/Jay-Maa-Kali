import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  clearAdminSessionCookie();
  return NextResponse.json({ success: true, message: "Logged out" });
}
