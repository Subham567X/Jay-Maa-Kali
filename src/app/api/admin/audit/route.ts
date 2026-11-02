import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    console.error("Audit GET error:", err);
    return NextResponse.json({ error: "অডিট লগ লোড করতে ত্রুটি" }, { status: 500 });
  }
}
