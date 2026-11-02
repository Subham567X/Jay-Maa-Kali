"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Clock, Gauge, BookOpen, CheckCircle, RotateCcw, RotateCw 
} from "lucide-react";

export interface AudiobookChapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  audioSrc: string;
  durationSeconds: number;
  summary: string;
}

interface AudiobookPlayerProps {
  chapters: AudiobookChapter[];
}

export function AudiobookPlayer({ chapters }: AudiobookPlayerProps) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentChapter = chapters[currentChapterIndex] || chapters[0];

  // Resume playback position from localStorage
  useEffect(() => {
    try {
      const savedChapter = localStorage.getItem("audiobook_chapter_index");
      const savedTime = localStorage.getItem("audiobook_time");
      if (savedChapter !== null && Number(savedChapter) < chapters.length) {
        setCurrentChapterIndex(Number(savedChapter));
      }
      if (savedTime !== null && audioRef.current) {
        audioRef.current.currentTime = Number(savedTime);
        setCurrentTime(Number(savedTime));
      }
    } catch {}
  }, [chapters.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTime = () => {
      setCurrentTime(audio.currentTime);
      try {
        localStorage.setItem("audiobook_time", audio.currentTime.toString());
        localStorage.setItem("audiobook_chapter_index", currentChapterIndex.toString());
      } catch {}
    };

    const handleLoaded = () => setDuration(audio.duration || currentChapter.durationSeconds || 0);
    const handleEnded = () => {
      if (currentChapterIndex < chapters.length - 1) {
        // Auto play next chapter
        setCurrentChapterIndex((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentChapterIndex, chapters.length, currentChapter.durationSeconds]);

  // Handle changing chapter
  const selectChapter = (index: number) => {
    setCurrentChapterIndex(index);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.playbackRate = playbackSpeed;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const skipSeconds = (sec: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + sec, duration));
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <audio
        ref={audioRef}
        src={currentChapter.audioSrc}
        preload="metadata"
      />

      {/* Main Chapter Player Card */}
      <div className="card-devotional p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Chapter Cover */}
          <div className="md:col-span-5 relative aspect-square rounded-2xl overflow-hidden border border-amber-400/40 shadow-xl bg-slate-950">
            <Image
              src="/media/images/audiobook_cover.jpg"
              alt={currentChapter.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-center">
              <span className="text-xs font-mono font-bold text-amber-300 bg-black/60 px-2.5 py-1 rounded-full border border-amber-500/30">
                অধ্যায় {currentChapter.number} / {chapters.length}
              </span>
            </div>
          </div>

          {/* Chapter Details & Controls */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest bg-amber-950/50 px-2.5 py-0.5 rounded border border-amber-500/30">
                মায়ের মহিমা – বিশেষ অডিওবুক
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gold-gradient font-bengali mt-2">
                {currentChapter.title}
              </h2>
              <p className="text-xs sm:text-sm text-amber-200/80 font-bengali mt-1">
                {currentChapter.subtitle}
              </p>
              <p className="text-xs text-slate-300 font-bengali mt-3 leading-relaxed bg-black/40 p-3 rounded-xl border border-amber-500/10">
                {currentChapter.summary}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mt-6 space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                aria-label="অডিওবুক সময় নিয়ন্ত্রক"
              />
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={cycleSpeed}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-mono text-amber-300 hover:bg-slate-700 transition-colors"
                title="গতি পরিবর্তন করুন"
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>{playbackSpeed}x</span>
              </button>

              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => selectChapter(Math.max(0, currentChapterIndex - 1))}
                  disabled={currentChapterIndex === 0}
                  className="p-2 text-slate-400 hover:text-amber-300 disabled:opacity-30 transition-colors"
                  title="পূর্ববর্তী অধ্যায়"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={() => skipSeconds(-10)}
                  className="p-1.5 text-slate-400 hover:text-amber-300 transition-colors"
                  title="১০ সেকেন্ড পেছনে যান"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-black flex items-center justify-center shadow-lg shadow-red-950/60 border border-amber-300 hover:scale-105 transition-transform"
                  aria-label={isPlaying ? "বিরতি দিন" : "শুনুন"}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => skipSeconds(10)}
                  className="p-1.5 text-slate-400 hover:text-amber-300 transition-colors"
                  title="১০ সেকেন্ড সামনে যান"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => selectChapter(Math.min(chapters.length - 1, currentChapterIndex + 1))}
                  disabled={currentChapterIndex === chapters.length - 1}
                  className="p-2 text-slate-400 hover:text-amber-300 disabled:opacity-30 transition-colors"
                  title="পরবর্তী অধ্যায়"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-mono text-slate-400">
                  {Math.round((currentChapter.durationSeconds || 0) / 60)} মি.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Playlist List */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-amber-200 font-bengali flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <span>অডিওবুক অধ্যায়সমূহ (৫টি পর্ব)</span>
        </h3>

        <div className="grid grid-cols-1 gap-2.5">
          {chapters.map((ch, idx) => {
            const isSelected = idx === currentChapterIndex;
            return (
              <div
                key={ch.id}
                onClick={() => selectChapter(idx)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-950/30"
                    : "bg-[#0b0c1e]/70 border-slate-800 hover:border-amber-500/30 hover:bg-[#12142d]"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-sm ${
                      isSelected
                        ? "bg-amber-400 text-black shadow-md"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {ch.number}
                  </div>
                  <div>
                    <h4
                      className={`text-sm sm:text-base font-bold font-bengali ${
                        isSelected ? "text-amber-300" : "text-slate-200"
                      }`}
                    >
                      {ch.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-bengali">{ch.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                    {Math.round(ch.durationSeconds / 60)} মিনিট
                  </span>
                  {isSelected && isPlaying ? (
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                  ) : (
                    <Play className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
