import React from "react";
import Image from "next/image";
import Link from "next/navigation";
import { DiyaFlame } from "@/components/DiyaFlame";
import { Sparkles, Video, Music, BookOpen, HelpCircle, Trophy, ArrowRight } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 sm:px-6 py-10 overflow-hidden alpona-pattern">
      {/* Decorative Aura Background Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-gradient-to-b from-red-600/20 via-amber-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto text-center relative z-10 flex flex-col items-center">
        {/* Diyas Row Header */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 mb-4 animate-float">
          <DiyaFlame size="md" />
          <div className="h-0.5 w-12 sm:w-20 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          <DiyaFlame size="lg" />
          <div className="h-0.5 w-12 sm:w-20 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          <DiyaFlame size="md" />
        </div>

        {/* Devotional Maa Kali Central Artwork */}
        <div className="relative group my-4 max-w-lg w-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-red-600 to-amber-500 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse" />
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-2xl bg-slate-950">
            <Image
              src="/media/images/maa_kali_divine.jpg"
              alt="মা কালীর পুণ্য শ্রীমূর্তি - নকুন্ডা কালীপূজা ২০২৬"
              fill
              priority
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05060f] via-transparent to-black/20" />
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <span className="text-[11px] sm:text-xs text-amber-200/90 font-medium tracking-widest bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm border border-amber-500/30">
                নকুন্ডা সর্বজনীন কালীপূজা ২০২৬ • শ্রীশ্রী ভবতারিণী পূজা
              </span>
            </div>
          </div>
        </div>

        {/* Project Titles */}
        <div className="mt-4 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-amber-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Kali Puja Special Gift 2026</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold font-bengali tracking-tight text-gold-gradient py-1">
            মায়ের আশীর্বাদ
          </h1>

          <p className="max-w-xl mx-auto text-base sm:text-lg text-slate-300 font-bengali font-normal leading-relaxed px-2">
            নকুন্ডা কালীপূজার পুণ্য লগ্নে মা ভবতারিণীর স্নেহের আলোয় ভরে উঠুক সকলের জীবন। 
            গ্রহণ করো মায়ের অলৌকিক বাণী, ভক্তিসঙ্গীত, বিশেষ অডিওবুক এবং দুই দিনের জ্ঞান কুইজে অংশগ্রহণ করে জিতে নাও 
            <span className="text-amber-300 font-semibold"> "শ্রেষ্ঠ জ্ঞানী সম্মান ২০২৬" </span> 
            এর একমাত্র ডিজিটাল সম্মাননা শংসাপত্র।
          </p>
        </div>

        {/* Primary CTA Button: "মায়ের আশীর্বাদ গ্রহণ করো" */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          <a
            href="/blessings"
            id="btn-accept-blessings"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-bengali font-bold text-lg sm:text-xl shadow-xl shadow-red-900/50 hover:shadow-amber-600/40 border border-amber-300/40 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
          >
            <span>মায়ের আশীর্বাদ গ্রহণ করো</span>
            <ArrowRight className="w-5 h-5 animate-pulse" />
          </a>
        </div>

        {/* Interactive Feature Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-12 w-full text-left">
          <a
            href="/blessings"
            className="card-devotional p-4 rounded-xl flex flex-col justify-between group transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Video className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-200 font-bengali">মায়ের ভিডিও</h2>
              <p className="text-xs text-slate-400 mt-0.5">মায়ের স্নেহাশিস ও দর্শন</p>
            </div>
          </a>

          <a
            href="/music"
            className="card-devotional p-4 rounded-xl flex flex-col justify-between group transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Music className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-200 font-bengali">মায়ের চরণে গান</h2>
              <p className="text-xs text-slate-400 mt-0.5">হৃদয়স্পর্শী শ্যামাসঙ্গীত</p>
            </div>
          </a>

          <a
            href="/audiobook"
            className="card-devotional p-4 rounded-xl flex flex-col justify-between group transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-200 font-bengali">মায়ের মহিমা</h2>
              <p className="text-xs text-slate-400 mt-0.5">৫টি অধ্যায়ের অডিওবুক</p>
            </div>
          </a>

          <a
            href="/quiz"
            className="card-devotional p-4 rounded-xl flex flex-col justify-between group transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-200 font-bengali">২ দিনের কুইজ</h2>
              <p className="text-xs text-slate-400 mt-0.5">কালীপূজা ও ভাইফোঁটা</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
