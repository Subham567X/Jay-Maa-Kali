"use client";

import React from "react";
import { Sparkles, Printer, Download, QrCode, Heart, Flame } from "lucide-react";

export default function QrLeafletPage() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#070817] text-slate-100 py-8 px-4 flex flex-col items-center justify-center font-bengali">
      {/* Action Bar (hidden on print) */}
      <div className="print:hidden max-w-md w-full mb-6 flex flex-wrap gap-3 items-center justify-between">
        <a
          href="/"
          className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-sans"
        >
          ← মূল ওয়েবসাইটে ফিরে যান
        </a>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" /> প্রিন্ট / সেভ PDF
          </button>
          <a
            href="/media/images/kali_puja_qr_red.png"
            download="Nakunda_Kali_Puja_Red_QR.png"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> লাল QR (PNG)
          </a>
        </div>
      </div>

      {/* Printable Festive Leaflet Card */}
      <div className="w-full max-w-md bg-gradient-to-b from-[#450a0a] via-[#1a0505] to-[#0d0202] rounded-3xl p-6 sm:p-8 border-4 border-amber-500 shadow-2xl relative overflow-hidden text-center print:border-4 print:border-red-700 print:shadow-none print:m-0 print:max-w-none print:w-[380px]">
        {/* Ornate Gold Corner Alpona Accents */}
        <div className="absolute top-2 left-2 text-amber-400/40 text-2xl select-none">⚜</div>
        <div className="absolute top-2 right-2 text-amber-400/40 text-2xl select-none">⚜</div>
        <div className="absolute bottom-2 left-2 text-amber-400/40 text-2xl select-none">⚜</div>
        <div className="absolute bottom-2 right-2 text-amber-400/40 text-2xl select-none">⚜</div>

        {/* Header Mantra */}
        <div className="mb-2">
          <span className="inline-block px-3 py-1 bg-red-950/80 border border-amber-500/40 rounded-full text-[11px] font-bold text-amber-300 tracking-wider">
            ॐ ক্রীং কাল্যৈ নমঃ
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 mb-1 drop-shadow-md">
          নকুন্ডা সর্বজনীন কালীপূজা ২০২৬
        </h1>
        <p className="text-red-300 text-sm font-semibold tracking-wide mb-5">
          মায়ের আশীর্বাদ • বিশেষ ডিজিটাল উপহার
        </p>

        {/* QR Code Container with Kali Puja Red Frame */}
        <div className="relative mx-auto my-3 w-64 h-64 sm:w-72 sm:h-72 p-4 bg-amber-50 rounded-2xl border-4 border-amber-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] flex flex-col items-center justify-center">
          {/* Real Scannable Red QR code */}
          <img
            src="/media/images/kali_puja_qr_red.png"
            alt="নকুন্ডা কালীপূজা লাল QR কোড"
            className="w-full h-full object-contain mix-blend-multiply"
          />

          {/* Central Logo Stamp */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 bg-red-700 border-2 border-amber-400 rounded-full flex flex-col items-center justify-center shadow-lg">
              <span className="text-[10px] font-bold text-amber-200 leading-none">মা কালী</span>
              <span className="text-[8px] text-amber-300 font-sans leading-none mt-0.5">2026</span>
            </div>
          </div>
        </div>

        {/* Scan Call to Action */}
        <div className="mt-4 mb-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500/20 via-red-500/20 to-amber-500/20 border border-amber-400/40 rounded-full text-amber-200 font-bold text-xs sm:text-sm">
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>মোবাইল ক্যামেরা দিয়ে স্ক্যান করুন</span>
          </div>
          <p className="text-slate-400 text-xs mt-1 font-sans">
            https://jay-maa-kali.vercel.app
          </p>
        </div>

        {/* Devotional Highlights */}
        <div className="mt-4 pt-4 border-t border-amber-500/30 text-left space-y-1.5 text-xs text-amber-100/90">
          <div className="flex items-center gap-2">
            <span className="text-red-400">🌺</span>
            <span>মা ভবতারিণীর পুণ্য দর্শন ও ভিডিও আশীর্বাদ</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400">🎶</span>
            <span>শ্যামাসঙ্গীত ও ৫টি অধ্যায়ের অডিওবুক</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">🏆</span>
            <span>২ দিনের বিশেষ কুইজ (কালীপূজা ও ভাইফোঁটা)</span>
          </div>
        </div>

        {/* Footer Committee Stamp */}
        <div className="mt-5 pt-3 border-t border-red-900/60 text-[11px] text-slate-400 text-center">
          নকুন্ডা কালীপূজা কমিটির সকল সদস্য ও সদস্যাবৃন্দ
        </div>
      </div>

      {/* Additional Resource Downloads (hidden on print) */}
      <div className="print:hidden max-w-md w-full mt-6 p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-400 text-center space-y-2">
        <p className="text-slate-300 font-semibold">প্রিন্ট ও ডিজাইনারদের জন্য ফাইলসমূহ:</p>
        <div className="flex flex-wrap justify-center gap-2">
          <a
            href="/media/images/kali_puja_qr_red.png"
            download
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-amber-500/20"
          >
            📥 হাই-রেজোলিউশন লাল QR (PNG 1000px)
          </a>
          <a
            href="/media/images/kali_puja_qr_red.svg"
            download
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-amber-500/20"
          >
            📥 ভেক্টর লাল QR (SVG)
          </a>
          <a
            href="/media/images/kali_puja_poster_mockup.jpg"
            download
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-amber-500/20"
          >
            📥 উৎসব পোস্টার মকআপ (JPG)
          </a>
        </div>
      </div>
    </div>
  );
}
