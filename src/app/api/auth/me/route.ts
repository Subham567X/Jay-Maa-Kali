import { NextResponse } from "next/server";
import { clearAdminSessionCookie, getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  clearAdminSessionCookie();
  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.adminId },
    select: { id: true, username: true, name: true, role: true },
  });

  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, admin });
}
