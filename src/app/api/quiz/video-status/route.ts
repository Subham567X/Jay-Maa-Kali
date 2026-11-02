import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyParticipantRequest } from "@/lib/session";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyParticipantRequest(req);
    let completed = false;

    if (session) {
      const participant = await prisma.participant.findUnique({
        where: { id: session.participantId },
        select: { blessingVideoCompleted: true, blessingVideoWatchedAt: true },
      });
      completed = !!participant?.blessingVideoCompleted;
    } else {
      // Check secure cookie
      const cookieVal = req.cookies.get("nakunda_blessing_watched")?.value;
      if (cookieVal === "true") {
        completed = true;
      }
    }

    const dayParam = req.nextUrl?.searchParams?.get("day") || "1";

    // Candidate blessing video filenames in order of preference
    const candidateVideoNames = dayParam === "2"
      ? [
          "video 3.mp4",
          "video3.mp4",
          "day2_bhai_phonta_quiz.mp4",
          "day2_quiz_video.mp4",
          "video 1.mp4",
          "video1.mp4",
          "maa_kali_blessing.mp4",
        ]
      : [
          "video 1.mp4",
          "video1.mp4",
          "maa_kali_blessing.mp4",
          "subhechha_video.mp4",
          "day1_kali_puja_quiz.mp4",
        ];

    let videoUrl = `/media/video/${encodeURIComponent(candidateVideoNames[0])}`;
    let posterUrl = "/media/images/kali_video_poster.jpg";
    let subtitlesUrl: string | null = null;

    // Check media asset from database if configured
    const media = await prisma.mediaAsset.findUnique({
      where: { assetKey: dayParam === "2" ? "quiz_video_day2" : "blessing_video" },
    });

    if (media && media.url) {
      videoUrl = media.url.includes("maa_kali_blessing")
        ? "/media/video/video%201.mp4"
        : media.url;
      if (media.posterUrl) posterUrl = media.posterUrl;
      subtitlesUrl = media.subtitlesUrl || null;
    } else {
      // Find the first physically existing candidate file
      for (const name of candidateVideoNames) {
        const fullPath = path.join(process.cwd(), "public", "media", "video", name);
        if (fs.existsSync(fullPath)) {
          videoUrl = `/media/video/${encodeURIComponent(name)}`;
          break;
        }
      }
    }

    // Check if the physical video file exists on disk (always true on Vercel/production)
    let fileExists = Boolean(process.env.VERCEL || process.env.NODE_ENV === "production");
    try {
      const decodedPath = decodeURIComponent(videoUrl.replace(/^\//, ""));
      const physicalPath = path.join(process.cwd(), "public", decodedPath);
      if (fs.existsSync(physicalPath)) {
        fileExists = true;
      }
    } catch {
      // Keep default
    }

    return NextResponse.json({
      success: true,
      completed,
      video: {
        url: videoUrl,
        posterUrl,
        title: "মা কালীর দিব্য স্নেহাশিস ও আশীর্বাদ",
        fileExists,
        uploadLocationNotice: "public/media/video/video 1.mp4 অথবা অ্যাডমিন প্যানেল (/admin/media)",
      },
    });
  } catch (err: any) {
    console.error("Video status check error:", err);
    return NextResponse.json({ error: "ভিডিও স্থিতি পরীক্ষা ব্যর্থ" }, { status: 500 });
  }
}
