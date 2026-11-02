"use client";

import React, { useState } from "react";

interface DiyaProps {
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
}

export function DiyaFlame({ size = "md", interactive = true }: DiyaProps) {
  const [lit, setLit] = useState(true);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  }[size];

  const toggleDiya = () => {
    if (!interactive) return;
    try {
      const audio = new Audio("/media/audio/temple_bell.mp3");
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch {}
    setLit(!lit);
  };

  return (
    <div
      onClick={toggleDiya}
      title={interactive ? "প্রদীপে স্পর্শ করে আলো প্রজ্বলন করুন" : undefined}
      className={`relative inline-flex flex-col items-center justify-center ${sizeClasses} ${
        interactive ? "cursor-pointer transition-transform hover:scale-105 active:scale-95" : ""
      }`}
    >
      {/* Radiant Glow Behind Flame */}
      {lit && (
        <div className="absolute -top-3 w-10 h-10 rounded-full bg-gradient-to-t from-amber-500/40 via-orange-500/20 to-transparent blur-md pointer-events-none" />
      )}

      {/* Flame */}
      {lit && (
        <div className="relative -mb-1 z-10 diya-flame-active">
          <svg viewBox="0 0 24 36" className="w-5 h-8 fill-current">
            <defs>
              <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="35%" stopColor="#f97316" />
                <stop offset="70%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            <path
              d="M12 0 C13 7 21 16 21 24 C21 30.6 17 36 12 36 C7 36 3 30.6 3 24 C3 16 11 7 12 0 Z"
              fill="url(#flameGrad)"
            />
          </svg>
        </div>
      )}

      {/* Brass Lamp Base */}
      <div className="relative z-0">
        <svg viewBox="0 0 48 24" className="w-12 h-6">
          <defs>
            <linearGradient id="brassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#785012" />
              <stop offset="30%" stopColor="#d97706" />
              <stop offset="50%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#785012" />
            </linearGradient>
          </defs>
          {/* Diya Bowl */}
          <path
            d="M4 6 C8 18 40 18 44 6 C42 12 36 20 24 20 C12 20 6 12 4 6 Z"
            fill="url(#brassGrad)"
          />
          {/* Diya Pedestal */}
          <path d="M18 19 L30 19 L33 23 L15 23 Z" fill="#92400e" />
        </svg>
      </div>
    </div>
  );
}
