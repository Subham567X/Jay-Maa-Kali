import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, logAdminAction } from "@/lib/auth";
import { normalizeName } from "@/lib/committee";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });

    const members = await prisma.committeeMember.findMany({
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, members });
  } catch (err: any) {
    console.error("Admin committee GET error:", err);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });

    const { name, aliases, notes } = await req.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "সদস্যের নাম আবশ্যক" }, { status: 400 });
    }

    const norm = normalizeName(name);

    let aliasArray: string[] = [];
    if (Array.isArray(aliases)) {
      aliasArray = aliases.map((a: string) => a.trim()).filter(Boolean);
    } else if (typeof aliases === "string") {
      aliasArray = aliases.split(",").map((a: string) => a.trim()).filter(Boolean);
    }
    if (!aliasArray.includes(name.trim())) {
      aliasArray.unshift(name.trim());
    }

    const member = await prisma.committeeMember.create({
      data: {
        name: name.trim(),
        normalizedName: norm,
        aliases: JSON.stringify(aliasArray),
        notes: notes?.trim() || null,
        isActive: true,
      },
    });

    await logAdminAction(admin.username, "CREATE_COMMITTEE_MEMBER", "CommitteeMember", member.id, {
      name: member.name,
      aliases: aliasArray,
    });

    return NextResponse.json({ success: true, member });
  } catch (err: any) {
    console.error("Admin committee POST error:", err);
    return NextResponse.json({ error: "সদস্য যোগ করতে ব্যর্থ" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });

    const { id, name, aliases, isActive, notes } = await req.json();

    if (!id) return NextResponse.json({ error: "আইডি আবশ্যক" }, { status: 400 });

    let aliasString: string | undefined = undefined;
    if (aliases !== undefined) {
      if (Array.isArray(aliases)) {
        aliasString = JSON.stringify(aliases);
      } else if (typeof aliases === "string") {
        aliasString = JSON.stringify(aliases.split(",").map((s) => s.trim()).filter(Boolean));
      }
    }

    const updated = await prisma.committeeMember.update({
      where: { id },
      data: {
        name: name?.trim(),
        normalizedName: name ? normalizeName(name) : undefined,
        aliases: aliasString,
        isActive: isActive !== undefined ? isActive : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    await logAdminAction(admin.username, "UPDATE_COMMITTEE_MEMBER", "CommitteeMember", updated.id, {
      name: updated.name,
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (err: any) {
    console.error("Admin committee PUT error:", err);
    return NextResponse.json({ error: "আপডেট করতে ব্যর্থ" }, { status: 500 });
  }
}
