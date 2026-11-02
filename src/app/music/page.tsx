import fs from "fs";
import path from "path";
import { AudioPlayer } from "@/components/AudioPlayer";
import { VideoPlayer } from "@/components/VideoPlayer";
import { DiyaFlame } from "@/components/DiyaFlame";
import { BookOpen, ArrowRight, Music, Heart, Video } from "lucide-react";

export const dynamic = "force-dynamic";

export default function MusicPage() {
  const songLyrics = `মায়ের চরণে নিবেদিত মোর ভক্তি অঞ্জলি,
সকল আঁধার ঘুচে যাক মা, আলোয় আলো জ্বলি।

শ্যামা মাগো ভবতারিণী, নিখিল ভুবন তারিণী,
দুঃখ-বিপদ দূর করে দাও, ওগো স্নেহকারিণী।

জবা ফুলের রক্তরাগে তোমায় দিলাম অঞ্জলি,
তোমার কৃপায় বিশ্বমাঝে ফুটুক শান্তি মঞ্জরী।`;

  // Check if user uploaded a song video (Video 2.mp4, video2.mp4, mayer_charane_gaan.mp4)
  const candidateVideos = [
    "Video 2.mp4",
    "video 2.mp4",
    "video2.mp4",
    "mayer_charane_gaan.mp4",
    "song_video.mp4",
  ];
  let videoSrc = "/media/video/Video%202.mp4";
  try {
    for (const name of candidateVideos) {
      const fullPath = path.join(process.cwd(), "public", "media", "video", name);
      if (fs.existsSync(fullPath)) {
        videoSrc = `/media/video/${encodeURIComponent(name)}`;
        break;
      }
    }
  } catch {
    videoSrc = "/media/video/Video%202.mp4";
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 max-w-4xl mx-auto flex flex-col items-center">
      {/* Devotional Heading */}
      <div className="text-center mb-8 max-w-xl">
        <div className="flex items-center justify-center gap-3 mb-2">
          <DiyaFlame size="sm" />
          <span className="text-xs font-semibold text-red-400 uppercase tracking-widest bg-red-950/40 px-3 py-1 rounded-full border border-red-500/30">
            নকুন্ডা ভক্তিমূলক নিবেদন
          </span>
          <DiyaFlame size="sm" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-gold-gradient font-bengali py-1">
          মায়ের চরণে আমার গান
        </h1>
        <p className="text-sm sm:text-base text-slate-300 font-bengali mt-2">
          মা কালীর রাতুল চরণে নিবেদিত এই পবিত্র ভক্তিগীতি। আপনি চাইলে ভিডিও দর্শন করতে পারেন অথবা নিচে সরাসরি অডিও শুনতে পারেন—দুটি মাধ্যমেই একই পবিত্র গান পরিবেশিত।
        </p>
      </div>

      {/* If Video 2 exists, show Devotional Video Player */}
      {videoSrc && (
        <div className="w-full mb-8 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 text-sm font-bengali font-bold">
            <Video className="w-4 h-4 text-red-400" />
            <span>মায়ের গানের ভিডিও দর্শন (Video 2)</span>
          </div>
          <VideoPlayer
            src={videoSrc}
            poster="/media/images/song_cover.jpg"
            title="মায়ের চরণে আমার গান (ভিডিও)"
          />
        </div>
      )}

      {/* Dedicated Custom Audio Player */}
      <AudioPlayer
        src="/media/audio/mayer_charane_gaan.mp3"
        coverImage="/media/images/song_cover.jpg"
        title="মায়ের চরণে আমার গান"
        artist="নকুন্ডা কালীপূজা ভক্তিবৃন্দের নিবেদন ২০২৬"
        description="কালীপূজার পূতপবিত্র ক্ষণে রচিত মা ভবতারিণীর রাতুল চরণের স্তুতি ও শরণাগতি গীতি।"
        lyrics={songLyrics}
      />

      {/* Devotional Verse Card */}
      <div className="card-devotional p-6 rounded-2xl w-full max-w-xl mt-8 text-center">
        <Heart className="w-5 h-5 text-red-500 mx-auto mb-2 animate-pulse" />
        <p className="text-xs text-amber-200/90 font-bengali leading-relaxed italic">
          "যেখানে মায়ের নাম স্মরণ হয়, সেখানেই সমস্ত ভয় দূরীভূত হয় এবং অপার কৃপার প্রবাহ জাগ্রত হয়।"
        </p>
      </div>

      {/* Navigation to Screen 4 (Audiobook) */}
      <div className="mt-8 flex items-center justify-center">
        <a
          href="/audiobook"
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-700 via-amber-600 to-red-700 hover:from-red-600 hover:to-amber-500 text-white font-bengali font-semibold shadow-lg shadow-red-950/50 border border-amber-400/40 transition-all hover:scale-105"
        >
          <BookOpen className="w-4 h-4 text-amber-300" />
          <span>পরবর্তী পর্ব: মায়ের মহিমা অডিওবুক</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
