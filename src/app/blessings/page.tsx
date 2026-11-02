"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { VideoPlayer } from "@/components/VideoPlayer";
import { DiyaFlame } from "@/components/DiyaFlame";
import { 
  Music, BookOpen, Trophy, ArrowRight, RotateCcw, 
  Sparkles, CheckCircle2, Heart, Play
} from "lucide-react";

export default function BlessingsVideoPage() {
  const [videoEnded, setVideoEnded] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  const handleVideoEnded = () => {
    setVideoEnded(true);
  };

  const handleReplay = () => {
    setVideoEnded(false);
    setReplayKey((prev) => prev + 1);
  };

  // 3 Action Thumbnail Cards: Song, Audio Story, Participate in Quiz
  const thumbnails = [
    {
      id: "song",
      title: "মায়ের চরণে গান",
      subtitle: "Song / ভক্তিগীতি",
      description: "মা ভবতারিণীর রাতুল চরণে নিবেদিত সুরের অঞ্জলি ও ভক্তিমূলক মিউজিক ভিডিও।",
      image: "/media/images/song_cover.jpg",
      href: "/music",
      icon: Music,
      badgeText: "১. ভক্তিমূলক গান",
      badgeColor: "bg-red-950/80 text-red-300 border-red-500/40",
      btnText: "গান শুনুন ও দেখুন",
      btnGradient: "from-red-600 via-rose-600 to-red-700",
    },
    {
      id: "audiobook",
      title: "মায়ের মহিমা অডিও স্টোরি",
      subtitle: "Audio Story / অডিওবুক",
      description: "মা কালীর অলৌকিক আবির্ভাব ও ভক্তবাৎসল্য লীলার ৫টি অমৃতময় অধ্যায় শ্রবণ করুন।",
      image: "/media/images/audiobook_cover.jpg",
      href: "/audiobook",
      icon: BookOpen,
      badgeText: "২. পবিত্র অডিও স্টোরি",
      badgeColor: "bg-amber-950/80 text-amber-300 border-amber-500/40",
      btnText: "অডিও স্টোরি শুনুন",
      btnGradient: "from-amber-600 via-orange-600 to-amber-700",
    },
    {
      id: "quiz",
      title: "কুইজে অংশগ্রহণ করুন",
      subtitle: "Participate in Quiz",
      description: "কালীপূজা ও ভাইফোঁটার ৫০+৫০ মোট ১০০টি প্রশ্নে অংশ নিয়ে ডিজিটাল সম্মাননা জিতুন।",
      image: "/media/images/kali_video_poster.jpg",
      href: "/quiz",
      icon: Trophy,
      badgeText: "৩. জ্ঞান কুইজ প্রতিযোগিতা",
      badgeColor: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40",
      btnText: "কুইজ শুরু করুন",
      btnGradient: "from-emerald-600 via-teal-600 to-emerald-700",
    },
  ];

  // In-Video End Screen component rendered right on the video when it finishes
  const InVideoEndScreen = (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 sm:p-6 space-y-4">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold font-bengali">
        <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
        <span>মা কালীর আশীর্বাদ গ্রহণ সম্পন্ন! পছন্দের পর্বে প্রবেশ করুন:</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
        {thumbnails.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="group/item flex flex-col items-center p-3 rounded-2xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 hover:bg-slate-800/95 transition-all transform hover:scale-105 shadow-xl text-center"
          >
            <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-2 border border-slate-700">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover group-hover/item:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[10px] text-amber-300 font-bold font-bengali">
                <item.icon className="w-3 h-3 text-amber-400" />
                <span>{item.subtitle}</span>
              </div>
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-white font-bengali group-hover/item:text-amber-300 transition-colors">
              {item.title}
            </h4>

            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 font-bengali">
              <span>{item.btnText}</span>
              <ArrowRight className="w-3 h-3 group-hover/item:translate-x-1 transition-transform" />
            </span>
          </a>
        ))}
      </div>

      <button
        onClick={handleReplay}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white text-xs font-bengali border border-slate-700 transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
        <span>ভিডিও পুনরায় দর্শন করুন</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col items-center">
      {/* Devotional Heading */}
      <div className="text-center mb-6 max-w-2xl">
        <div className="flex items-center justify-center gap-4 mb-2">
          <DiyaFlame size="sm" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest bg-amber-950/40 px-3 py-1 rounded-full border border-amber-500/30">
            মায়ের মুখনিঃসৃত স্নেহাশিস
          </span>
          <DiyaFlame size="sm" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-gold-gradient font-bengali py-1">
          মা কালীর পুণ্য আশীর্বাদ
        </h1>
        <p className="text-sm sm:text-base text-slate-300 font-bengali mt-2">
          নকুন্ডা কালীপূজায় উপস্থিত সকল ভক্ত ও পরিবারের জন্য মা ভবতারিণীর পুণ্য দর্শন ও স্নেহবাণী।
        </p>
      </div>

      {/* Video Player Box with Autoplay and No Subtitles */}
      <div className="w-full mb-8">
        <VideoPlayer
          key={replayKey}
          src="/media/video/video%201.mp4"
          poster="/media/images/kali_video_poster.jpg"
          title="মা কালীর আশীর্বাদ"
          autoPlay={true}
          onEnded={handleVideoEnded}
          endScreenSlot={InVideoEndScreen}
        />
      </div>

      {/* 3 Prominent Action Thumbnails Section */}
      <div className="w-full space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
          <div className="flex items-center gap-2 text-amber-300">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-bold font-bengali">
              {videoEnded ? "মা কালীর আশীর্বাদ গ্রহণ সম্পন্ন! পরবর্তী পর্বে প্রবেশ করুন:" : "ভিডিওর পরবর্তী ৩টি বিশেষ পর্ব:"}
            </h2>
          </div>

          {videoEnded && (
            <button
              onClick={handleReplay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-bengali transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>ভিডিও পুনরায় চালান</span>
            </button>
          )}
        </div>

        {/* The 3 Thumbnails Grid (Song, Audio Story, Participate in Quiz) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {thumbnails.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`card-devotional rounded-2xl overflow-hidden border-2 flex flex-col justify-between transition-all duration-300 ${
                  videoEnded
                    ? "border-amber-400/80 shadow-2xl shadow-amber-950/40 ring-1 ring-amber-400/50 hover:scale-[1.03]"
                    : "border-slate-800 hover:border-amber-500/50 hover:scale-[1.02]"
                }`}
              >
                <div>
                  {/* Thumbnail Image Container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950 group">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c20] via-black/30 to-transparent" />
                    
                    {/* Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold font-bengali backdrop-blur-sm ${item.badgeColor}`}>
                        <Icon className="w-3 h-3" />
                        <span>{item.badgeText}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-2">
                    <h3 className="text-lg font-bold text-amber-200 font-bengali">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-300 font-bengali leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Direct Action Button */}
                <div className="p-5 pt-0">
                  <a
                    href={item.href}
                    className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r ${item.btnGradient} hover:brightness-110 text-white font-bengali font-bold text-sm shadow-lg transition-all hover:shadow-xl`}
                  >
                    <span>{item.btnText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
