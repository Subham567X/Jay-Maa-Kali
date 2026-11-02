import React from "react";
import fs from "fs";
import path from "path";
import { AudiobookPlayer, AudiobookChapter } from "@/components/AudiobookPlayer";
import { VideoPlayer } from "@/components/VideoPlayer";
import { DiyaFlame } from "@/components/DiyaFlame";
import { HelpCircle, ArrowRight, BookOpen, Video } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AudiobookPage() {
  // Check if user uploaded an audiobook/chapter visual video (video 3.mp4, video3.mp4, audiobook_video.mp4)
  const candidateVideos = [
    "video 3.mp4",
    "Video 3.mp4",
    "video3.mp4",
    "audiobook_video.mp4",
    "day2_bhai_phonta_quiz.mp4",
  ];
  let videoSrc = "/media/video/video%203.mp4";
  try {
    for (const name of candidateVideos) {
      const fullPath = path.join(process.cwd(), "public", "media", "video", name);
      if (fs.existsSync(fullPath)) {
        videoSrc = `/media/video/${encodeURIComponent(name)}`;
        break;
      }
    }
  } catch {
    videoSrc = "/media/video/video%203.mp4";
  }
  const chapters: AudiobookChapter[] = [
    {
      id: "full",
      number: 0,
      title: "মা কালীর সম্পূর্ণ মহিমা (একটানা শ্রবণ)",
      subtitle: "ভিডিও ৩-এর সম্পূর্ণ আসল অডিওবুক পাঠ (একটানা ৩ মিনিট ৪৪ সেকেন্ড)",
      audioSrc: "/media/audio/audiobook_video_audio.mp3",
      durationSeconds: 224,
      summary: "মা ভবতারিণীর পুণ্য আবির্ভাব, অপার্থিব মহিমা, দিব্য দর্শন ও ভক্তের প্রতি বাৎসল্য প্রেমের সম্পূর্ণ পাঠ একসঙ্গে শুনুন।",
    },
    {
      id: "ch1",
      number: 1,
      title: "মা কালীর আবির্ভাব",
      subtitle: "দেবী কৌশিকীর ললাট থেকে অন্ধকার বিনাশিনী মহাশক্তির প্রকাশ",
      audioSrc: "/media/audio/audiobook_ch1.mp3",
      durationSeconds: 45,
      summary:
        "শ্রীশ্রী চণ্ডী অনুসারে কীভাবে অসুর রক্তবীজ ও চণ্ড-মুণ্ডের অত্যাচারে পৃথিবী ত্রস্ত হলে দেবী দুর্গার ভ্রূকুটি থেকে ভীষণা মা কালীর প্রাদুর্ভাব হয়।",
    },
    {
      id: "ch2",
      number: 2,
      title: "মা কালীর মহিমা ও মহাশক্তির রূপ",
      subtitle: "দশমহাবিদ্যার আদ্যাশক্তি ও রূপক অর্থের আধ্যাত্মিক ব্যাখ্যা",
      audioSrc: "/media/audio/audiobook_ch2.mp3",
      durationSeconds: 45,
      summary:
        "মা কালীর শ্যামল কৃষ্ণবর্ণ, এলোকেশী রূপ, নরমুণ্ড মালা ও খড়্গের গভীর দার্শনিক তাৎপর্য—কীভাবে তা মানুষের অহংকার চূর্ণ করে।",
    },
    {
      id: "ch3",
      number: 3,
      title: "মা কালীর ভক্তের প্রতি অপার্থিব ভালোবাসা",
      subtitle: "সাধক রামপ্রসাদ, কমলাকান্ত ও ভক্তের ডাকে মায়ের সাড়া",
      audioSrc: "/media/audio/audiobook_ch3.mp3",
      durationSeconds: 45,
      summary:
        "সাধক রামপ্রসাদের বেড়া বাঁধার সময় স্বয়ং মা কন্যারূপে এসে সাহায্য করার চিরমধুর ভক্তিবৃত্তান্ত এবং মায়ের অপার বাৎসল্য প্রেম।",
    },
    {
      id: "ch4",
      number: 4,
      title: "মা কালীর আশীর্বাদ ও শরণাগতি",
      subtitle: "দক্ষিণেশ্বরে ঠাকুর শ্রীরামকৃষ্ণের প্রত্যক্ষ মাতৃদর্শন",
      audioSrc: "/media/audio/audiobook_ch4.mp3",
      durationSeconds: 45,
      summary:
        "দক্ষিণেশ্বর ভবতারিণীর মন্দিরে ঠাকুর শ্রীরামকৃষ্ণের ব্যাকুল প্রার্থনা, জগন্মাতার চৈতন্যময়ী জ্যোতির্দর্শন এবং শরণাগতির অমৃতময়ী শিক্ষা।",
    },
    {
      id: "ch5",
      number: 5,
      title: "ভক্তি, সাহস ও মানবতার শিক্ষা",
      subtitle: "মাতৃপূজার আধুনিক জীবনবোধ ও সৌভ্রাতৃত্বের আহ্বান",
      audioSrc: "/media/audio/audiobook_ch5.mp3",
      durationSeconds: 44,
      summary:
        "কালীপূজা কেবল আচার নয়—সমাজে নারীশক্তিকে শ্রদ্ধা, অন্যায়ের বিরুদ্ধে সাহস ও সর্বজীবে ঈশ্বরদর্শনই মায়ের শ্রেষ্ঠ আশীর্বাদ।",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col items-center">
      {/* Devotional Heading */}
      <div className="text-center mb-8 max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-2">
          <DiyaFlame size="sm" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest bg-amber-950/40 px-3 py-1 rounded-full border border-amber-500/30">
            মায়ের মুখে অডিওবুক
          </span>
          <DiyaFlame size="sm" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-gold-gradient font-bengali py-1">
          মায়ের মহিমা – বিশেষ অডিওবুক
        </h1>
        <p className="text-sm sm:text-base text-slate-300 font-bengali mt-2">
          মা ভবতারিণীর পুণ্য আবির্ভাব, অপার্থিব মহিমা ও অলৌকিক লীলাকথা। আপনি চাইলে ভিডিও ৩-এর মাধ্যমে দর্শন করতে পারেন অথবা নিচের অডিওবুক প্লেয়ারে সম্পূর্ণ বা অধ্যায়ভিত্তিক অডিও শ্রবণ করতে পারেন।
        </p>
      </div>

      {/* If Video 3 exists, show Audiobook visual video */}
      {videoSrc && (
        <div className="w-full mb-8 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 text-sm font-bengali font-bold">
            <Video className="w-4 h-4 text-amber-400" />
            <span>মায়ের মহিমা অডিওবুক ভিডিও দর্শন (ভিডিও ৩)</span>
          </div>
          <VideoPlayer
            src={videoSrc}
            poster="/media/images/audiobook_cover.jpg"
            title="মায়ের মহিমা অডিওবুক (ভিডিও ৩)"
          />
        </div>
      )}

      {/* Multi-Chapter Audiobook Player */}
      <AudiobookPlayer chapters={chapters} />

      {/* Navigation to Screen 5: Two-Day Quiz */}
      <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 text-center">
        <a
          href="/quiz"
          className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-bengali font-bold text-base sm:text-lg shadow-xl shadow-red-950/50 border border-amber-400/40 transition-all hover:scale-105"
        >
          <HelpCircle className="w-5 h-5 text-amber-300" />
          <span>পরবর্তী পর্ব: দুই দিনের বিশেষ জ্ঞান কুইজ</span>
          <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}
