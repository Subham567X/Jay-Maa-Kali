"use client";

import React from "react";
import { Printer, Download, ArrowLeft, Shield, Lock, ExternalLink } from "lucide-react";

export default function AdminQrLeafletPage() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#070817] text-slate-100 py-8 px-4 flex flex-col items-center justify-center font-bengali">
      {/* Top Action Bar (hidden on print) */}
      <div className="print:hidden max-w-lg w-full mb-6 flex flex-wrap gap-3 items-center justify-between">
        <a
          href="/admin"
          className="text-xs text-amber-400 hover:underline flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> অ্যাডমিন ড্যাশবোর্ডে যান
        </a>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" /> প্রিন্ট / সেভ PDF
          </button>
          <a
            href="/media/images/kali_puja_admin_leaflet.jpg"
            download="Nakunda_Admin_Lifetime_Card.jpg"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> কার্ড ডাউনলোড (JPG)
          </a>
        </div>
      </div>

      {/* Secret Notice (hidden on print) */}
      <div className="print:hidden max-w-lg w-full mb-4 p-3 bg-red-950/60 border border-amber-500/40 rounded-2xl text-center text-xs text-amber-200">
        <span className="font-bold flex items-center justify-center gap-1.5 mb-1 text-amber-300">
          <Shield className="w-4 h-4 text-amber-400" /> গোপন কমিটি অ্যাডমিন কার্ড (শুধুমাত্র অনুমোদিত সদস্যদের জন্য)
        </span>
        <p className="text-slate-300">
          এই কার্ডে কোনো সাল উল্লেখ নেই — এটি আজীবন (Lifetime) ব্যবহারের উপযোগী। ফোন ক্যামেরা দিয়ে স্ক্যান করলেই স্বয়ংক্রিয়ভাবে অ্যাডমিন প্যানেল খুলে যাবে।
        </p>
      </div>

      {/* The Printable Lifetime Admin Leaflet Card */}
      <div className="max-w-md w-full rounded-3xl overflow-hidden border-4 border-amber-500/60 shadow-2xl relative bg-[#1a0505] print:border-none print:shadow-none print:m-0 print:w-[420px]">
        <img
          src="/media/images/kali_puja_admin_leaflet.jpg"
          alt="নকুন্ডা সর্বজনীন কালীপূজা - কমিটি অ্যাডমিন কার্ড"
          className="w-full h-auto block"
        />
      </div>

      {/* Direct Auto-Login Quick Link Button (hidden on print) */}
      <div className="print:hidden max-w-lg w-full mt-6 text-center space-y-3">
        <a
          href="/api/auth/quick-login?key=NakundaMaa@2026"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-sm rounded-2xl shadow-xl transition-all active:scale-95"
        >
          <Lock className="w-4 h-4" /> ১-ক্লিকে সরাসরি অ্যাডমিন প্যানেলে প্রবেশ করুন
          <ExternalLink className="w-4 h-4 ml-1" />
        </a>

        <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-400">
          <a
            href="/media/images/kali_puja_admin_qr.png"
            download
            className="hover:text-amber-300 underline"
          >
            📥 শুধুমাত্র অ্যাডমিন QR কোড (PNG)
          </a>
          <span>•</span>
          <a
            href="/media/images/kali_puja_admin_qr.svg"
            download
            className="hover:text-amber-300 underline"
          >
            📥 ভেক্টর অ্যাডমিন QR (SVG)
          </a>
        </div>
      </div>
    </div>
  );
}
