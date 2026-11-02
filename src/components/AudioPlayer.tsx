"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw, FileText } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  coverImage: string;
  title: string;
  artist?: string;
  description?: string;
  lyrics?: string;
}

export function AudioPlayer({
  src,
  coverImage,
  title,
  artist = "নকুন্ডা ভক্তি অঞ্জলি",
  description,
  lyrics,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTime = () => setCurrentTime(audio.currentTime);
    const handleLoaded = () => setDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.volume = volume;
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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const vol = Number(e.target.value);
    audio.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
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
    <div className="card-devotional p-6 sm:p-8 rounded-3xl w-full max-w-xl mx-auto shadow-2xl relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-0 right-0 w-60 h-60 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex flex-col items-center text-center">
        {/* Cover Art Artwork with Vinyl/Plate Ring */}
        <div className="relative w-48 sm:w-60 aspect-square rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-2xl mb-6 group">
          <Image
            src={coverImage}
            alt={title}
            fill
            className={`object-cover object-center transition-transform duration-700 ${
              isPlaying ? "scale-105" : "scale-100"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

          {/* Playing Equalizer Overlay */}
          {isPlaying && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-1 h-6">
              <span className="w-1 bg-amber-400 animate-pulse h-4" />
              <span className="w-1 bg-amber-300 animate-pulse h-6" />
              <span className="w-1 bg-red-500 animate-pulse h-3" />
              <span className="w-1 bg-amber-400 animate-pulse h-5" />
            </div>
          )}
        </div>

        {/* Titles */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gold-gradient font-bengali">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-amber-300/80 font-medium mt-1">{artist}</p>
        {description && (
          <p className="text-xs text-slate-400 font-bengali mt-2 max-w-sm line-clamp-2">
            {description}
          </p>
        )}

        {/* Progress Bar & Seek */}
        <div className="w-full mt-6 space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            aria-label="গান সময় নিয়ন্ত্রক"
          />
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Audio Player Controls */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6 w-full">
          <button
            onClick={() => skipSeconds(-5)}
            className="p-2 text-slate-400 hover:text-amber-300 transition-colors"
            title="৫ সেকেন্ড পেছনে যান"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white flex items-center justify-center shadow-xl shadow-red-950/60 border border-amber-300 hover:scale-105 active:scale-95 transition-transform"
            aria-label={isPlaying ? "বিরতি দিন" : "গান চালান"}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 text-black fill-current" />
            ) : (
              <Play className="w-7 h-7 text-black fill-current ml-1" />
            )}
          </button>

          <button
            onClick={() => skipSeconds(5)}
            className="p-2 text-slate-400 hover:text-amber-300 transition-colors"
            title="৫ সেকেন্ড সামনে যান"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Utility Controls: Volume & Lyrics */}
        <div className="flex items-center justify-between w-full mt-6 pt-4 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-slate-400 hover:text-amber-300">
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-24 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
              aria-label="শব্দ মাত্রা"
            />
          </div>

          {lyrics && (
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all font-bengali"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showLyrics ? "কথা লুকান" : "গানের কথা"}</span>
            </button>
          )}
        </div>

        {/* Lyrics Drawer / Dropdown */}
        {showLyrics && lyrics && (
          <div className="mt-4 p-4 rounded-xl bg-black/60 border border-amber-500/30 text-xs sm:text-sm text-slate-300 font-bengali leading-relaxed text-center whitespace-pre-line max-h-48 overflow-y-auto animate-fadeIn">
            {lyrics}
          </div>
        )}
      </div>
    </div>
  );
}
