import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, logAdminAction } from "@/lib/auth";

export async function GET() {
  try {
    const assets = await prisma.mediaAsset.findMany({
      orderBy: { assetKey: "asc" },
    });
    return NextResponse.json({ success: true, assets });
  } catch (err: any) {
    console.error("Media GET error:", err);
    return NextResponse.json({ error: "মিডিয়া তথ্য লোড করতে সমস্যা" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });

    const body = await req.json();
    const { assetKey, title, url, posterUrl, subtitlesUrl, subtitlesText } = body;

    if (!assetKey) return NextResponse.json({ error: "assetKey প্রয়োজন" }, { status: 400 });

    const updated = await prisma.mediaAsset.upsert({
      where: { assetKey },
      update: {
        title: title || undefined,
        url: url || undefined,
        posterUrl: posterUrl !== undefined ? posterUrl : undefined,
        subtitlesUrl: subtitlesUrl !== undefined ? subtitlesUrl : undefined,
        subtitlesText: subtitlesText !== undefined ? subtitlesText : undefined,
      },
      create: {
        assetKey,
        title: title || "Media Asset",
        type: "AUDIO",
        url: url || "",
        posterUrl,
        subtitlesUrl,
        subtitlesText,
      },
    });

    await logAdminAction(admin.username, "UPDATE_MEDIA_ASSET", "MediaAsset", assetKey, {
      title: updated.title,
      url: updated.url,
    });

    return NextResponse.json({ success: true, asset: updated });
  } catch (err: any) {
    console.error("Media PUT error:", err);
    return NextResponse.json({ error: "মিডিয়া আপডেট করতে ব্যর্থ" }, { status: 500 });
  }
}
