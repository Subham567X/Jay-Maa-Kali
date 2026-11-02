import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, logAdminAction } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাডমিন অ্যাক্সেস" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const assetKey = (formData.get("assetKey") as string) || "";
    const category = (formData.get("category") as string) || "video"; // "video" | "audio" | "images" | "subtitles"

    if (!file) {
      return NextResponse.json({ error: "কোনো ফাইল পাওয়া যায়নি" }, { status: 400 });
    }

    // Determine target directory
    const validCategories = ["video", "audio", "images", "subtitles"];
    const targetFolder = validCategories.includes(category) ? category : "video";
    const mediaDir = path.join(process.cwd(), "public", "media", targetFolder);

    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }

    // Determine standardized filename based on assetKey or original name
    let filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    
    // Default mapping for known keys
    if ((assetKey === "blessing_video" || assetKey === "video1") && file.type.startsWith("video")) {
      filename = "maa_kali_blessing.mp4";
    } else if ((assetKey === "song_video" || assetKey === "video2") && file.type.startsWith("video")) {
      filename = "mayer_charane_gaan.mp4";
    } else if ((assetKey === "quiz_video" || assetKey === "quiz_video_day2" || assetKey === "video3") && file.type.startsWith("video")) {
      filename = "day2_bhai_phonta_quiz.mp4";
    } else if (assetKey === "devotional_song" && file.type.startsWith("audio")) {
      filename = "mayer_charane_gaan.mp3";
    } else if (assetKey.startsWith("audiobook_ch") && file.type.startsWith("audio")) {
      filename = `${assetKey}.mp3`;
    }

    const filePath = path.join(mediaDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/media/${targetFolder}/${filename}`;

    // If assetKey is provided, update or create MediaAsset in DB
    if (assetKey) {
      await prisma.mediaAsset.upsert({
        where: { assetKey },
        update: {
          url: publicUrl,
          updatedAt: new Date(),
        },
        create: {
          assetKey,
          title: assetKey.replace(/_/g, " "),
          type: targetFolder === "video" ? "VIDEO" : "AUDIO",
          url: publicUrl,
        },
      });

      await logAdminAction(admin.username, "UPLOAD_MEDIA_FILE", "MediaAsset", assetKey, {
        filename,
        publicUrl,
        sizeBytes: buffer.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: `ফাইল "${filename}" সফলভাবে আপলোড হয়েছে!`,
      url: publicUrl,
      filename,
      sizeBytes: buffer.length,
    });
  } catch (err: any) {
    console.error("File upload error:", err);
    return NextResponse.json({ error: err.message || "ফাইল আপলোড ব্যর্থ হয়েছে" }, { status: 500 });
  }
}
