import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAdminToken, setAdminSessionCookie, logAdminAction } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "ইউজারনেম এবং পাসওয়ার্ড দিন" }, { status: 400 });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { username: username.trim() },
    });

    if (!admin) {
      return NextResponse.json({ error: "ভুল ইউজারনেম বা পাসওয়ার্ড" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "ভুল ইউজারনেম বা পাসওয়ার্ড" }, { status: 401 });
    }

    const token = signAdminToken({
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
    });

    setAdminSessionCookie(token);

    await logAdminAction(admin.username, "ADMIN_LOGIN", "AdminUser", admin.id, {
      message: "Admin logged in successfully",
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "সার্ভারে সমস্যা হয়েছে" }, { status: 500 });
  }
}
