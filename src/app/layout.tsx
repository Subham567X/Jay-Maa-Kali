import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { DevotionalParticles } from "@/components/DevotionalParticles";
import { AmbienceAudio } from "@/components/AmbienceAudio";

export const metadata: Metadata = {
  title: "মায়ের আশীর্বাদ – Kali Puja Special Gift 2026 | Nakunda",
  description:
    "নকুন্ডা কালীপূজা ২০২৬ উপলক্ষে মা ভবতারিণীর পুণ্য আশীর্বাদ, ভক্তিগীতি, মায়ের মুখের অডিওবুক, ও দুই দিনের বিশেষ কুইজ প্রতিযোগিতা।",
  keywords: [
    "Kali Puja 2026",
    "মায়ের আশীর্বাদ",
    "Nakunda Kali Puja",
    "নকুন্ডা কালীপূজা",
    "কালীপূজা কুইজ",
    "ভাইফোঁটা কুইজ",
    "ভক্তিগীতি",
    "অডিওবুক",
  ],
  authors: [{ name: "Nakunda Kali Puja Committee" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#05060f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-[#05060f] text-slate-100 min-h-screen flex flex-col relative selection:bg-amber-500 selection:text-black">
        {/* Ambient floating devotional particles */}
        <DevotionalParticles />

        {/* Global Navigation */}
        <Navbar />

        {/* Main Application Container */}
        <main className="flex-1 relative z-10">{children}</main>

        {/* Devotional Bell & Ambience Audio Controller */}
        <AmbienceAudio />

        {/* Footer */}
        <footer className="relative z-10 border-t border-amber-500/20 bg-[#070817]/80 backdrop-blur-md py-6 text-center text-xs text-slate-400">
          <div className="max-w-4xl mx-auto px-4 space-y-2">
            <p className="font-bengali text-amber-200/90 text-sm font-semibold tracking-wide">
              নকুন্ডা কালীপূজা কমিটির সকল সদস্য ও সদস্যাবৃন্দ।
            </p>
            <p className="text-slate-500">
              মায়ের আশীর্বাদ – Kali Puja Special Gift ২০২৬ • সর্বস্বত্ব সংরক্ষিত
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
