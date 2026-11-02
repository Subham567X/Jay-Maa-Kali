"use client";

import React, { useState, useRef } from "react";
import { Volume2, VolumeX, Sparkles } from "lucide-react";

export function AmbienceAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAmbience = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.volume = 0.35;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Audio playback prevented:", err);
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <audio ref={audioRef} src="/media/audio/temple_bell.mp3" loop preload="none" />
      <button
        onClick={toggleAmbience}
        className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium backdrop-blur-md transition-all shadow-lg border ${
          isPlaying
            ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/20"
            : "bg-slate-900/80 text-slate-300 border-amber-500/30 hover:border-amber-400"
        }`}
        title="ভক্তিমূলক আবহধ্বনি"
        aria-label="ভক্তিমূলক আবহধ্বনি চালু বা বন্ধ করুন"
      >
        {isPlaying ? (
          <>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">ভক্তি আবহধ্বনি চালু</span>
          </>
        ) : (
          <>
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">আবহধ্বনি শুনুন</span>
          </>
        )}
      </button>
    </div>
  );
}
