import React from "react";
import Image from "next/image";
import { DiyaFlame } from "@/components/DiyaFlame";
import { Heart, Sparkles, Home, Share2 } from "lucide-react";

export default function PranamClosingPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 max-w-4xl mx-auto flex flex-col items-center justify-center text-center alpona-pattern">
      {/* Decorative Diya header */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <DiyaFlame size="md" />
        <DiyaFlame size="lg" />
        <DiyaFlame size="md" />
      </div>

      {/* Maa Kali Sacred Artwork Card */}
      <div className="relative max-w-md w-full aspect-[16/9] rounded-3xl overflow-hidden border-2 border-amber-400 shadow-2xl mb-8 group bg-slate-950">
        <Image
          src="/media/images/maa_kali_divine.jpg"
          alt="মা ভবতারিণীর পুণ্য শ্রীমূর্তি"
          fill
          priority
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05060f] via-transparent to-transparent opacity-70" />
        <div className="absolute bottom-3 inset-x-0 text-center">
          <span className="text-xs text-amber-200 font-semibold tracking-wider bg-black/60 px-4 py-1.5 rounded-full border border-amber-500/40">
            নকুন্ডা কালীপূজা ২০২৬ • শ্রীশ্রী মা ভবতারিণী
          </span>
        </div>
      </div>

      {/* Blessing & Gratitude Content */}
      <div className="space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-amber-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>পবিত্র সমাপন ও কৃতজ্ঞতা প্রকাশ</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-gold-gradient font-bengali">
          মায়ের রাতুল চরণে অনন্ত প্রণাম
        </h1>

        <div className="card-devotional p-6 sm:p-8 rounded-3xl text-slate-200 font-bengali text-base sm:text-lg leading-relaxed border border-amber-500/30 shadow-xl space-y-4">
          <p>
            হে মা আনন্দময়ী ভবতারিণী, তোমার শ্রীচরণে আমাদের কায়মনোবাক্যে অনন্ত কোটি প্রণাম। 
            তোমার অপার স্নেহে ও করুণায় প্রতিটি ভক্তের অন্তর হোক শান্তিময়, নিরোগ ও সকল অজ্ঞানতা মুক্ত।
          </p>

          <p className="text-sm sm:text-base text-amber-200/90 font-medium italic">
            "নকুন্ডা কালীপূজার এই পুণ্য ডিজিটাল অভিজ্ঞতায় অংশগ্রহণ করার জন্য আপনাকে এবং আপনার সমগ্র পরিবারকে জানাই আমাদের আন্তরিক কৃতজ্ঞতা ও শারদ শুভেচ্ছা।"
          </p>

          {/* Mandatory Committee Credit */}
          <div className="pt-6 border-t border-amber-500/30">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">
              কৃতজ্ঞতা নিবেদনে
            </p>
            <p className="text-lg sm:text-2xl font-black text-amber-300 font-bengali tracking-wide">
              নকুন্ডা কালীপূজা কমিটির সকল সদস্য ও সদস্যাবৃন্দ।
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <a
          href="/"
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-bengali font-bold text-sm shadow-lg shadow-red-950/50 border border-amber-400/40 transition-all hover:scale-105"
        >
          <Home className="w-4 h-4" />
          <span>হোমে ফিরে যান</span>
        </a>

        <a
          href="/quiz"
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 font-bengali font-bold text-sm hover:bg-slate-800 transition-all"
        >
          <span>কুইজ প্রতিযোগিতা</span>
        </a>
      </div>
    </div>
  );
}
