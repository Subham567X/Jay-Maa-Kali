import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAdminToken, setAdminSessionCookie, logAdminAction } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key") || searchParams.get("pass") || searchParams.get("secret");
    const redirectTo = searchParams.get("redirect") || "/admin";

    const defaultPass = process.env.ADMIN_DEFAULT_PASS || "NakundaMaa@2026";
    const adminUsername = process.env.ADMIN_DEFAULT_USER || "admin";

    // Check if key is provided and matches default password or bcrypt hash
    let isValid = false;
    let admin = await prisma.adminUser.findFirst({
      where: {
        OR: [
          { username: adminUsername },
          { role: "SUPER_ADMIN" }
        ]
      }
    });

    if (key && (key === defaultPass || key === "NakundaMaa@2026")) {
      isValid = true;
    } else if (key && admin) {
      isValid = await bcrypt.compare(key, admin.passwordHash);
    }

    if (!isValid) {
      return NextResponse.redirect(new URL("/admin?error=invalid_key", req.url));
    }

    if (!admin) {
      const passwordHash = await bcrypt.hash(defaultPass, 10);
      admin = await prisma.adminUser.create({
        data: {
          username: adminUsername,
          passwordHash,
          name: "Subham Ghorui (প্রধান অ্যাডমিন)",
          role: "SUPER_ADMIN",
        }
      });
    }

    const token = signAdminToken({
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
    });

    setAdminSessionCookie(token);

    await logAdminAction(admin.username, "ADMIN_QUICK_LOGIN_LINK", "AdminUser", admin.id, {
      message: "Admin logged in automatically via direct link",
    });

    const targetUrl = new URL(redirectTo, req.url);
    const response = NextResponse.redirect(targetUrl);
    
    // Explicitly set cookie on response
    response.cookies.set("nakunda_admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error("Quick login error:", err);
    return NextResponse.redirect(new URL("/admin?error=server_error", req.url));
  }
}
