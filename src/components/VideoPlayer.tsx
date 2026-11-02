"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Maximize, Volume2, VolumeX, Subtitles, RotateCcw } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster: string;
  subtitlesSrc?: string;
  title?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  endScreenSlot?: React.ReactNode;
}

export function VideoPlayer({ 
  src, 
  poster, 
  subtitlesSrc, 
  title, 
  autoPlay = false,
  onEnded,
  endScreenSlot
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [needsUnmute, setNeedsUnmute] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const cur = video.currentTime;
      setCurrentTime(cur);
      // Check if finished within 0.5s of end
      if (video.duration && cur >= video.duration - 0.5 && !isEnded) {
        setIsEnded(true);
        if (onEnded) onEnded();
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setHasError(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setIsEnded(true);
      if (onEnded) onEnded();
    };

    const handleError = () => {
      const err = video.error;
      console.warn("Video notice:", err?.code, err?.message);
      if (err && err.code === 4) {
        setHasError(true);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    // Automatic Autoplay Handling (Mobile-compliant)
    if (autoPlay) {
      const tryAutoPlay = () => {
        // Start muted to comply with mobile autoplay policies
        video.muted = true;
        setIsMuted(true);
        setNeedsUnmute(true);

        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setHasStarted(true);
            })
            .catch((err) => {
              console.warn("Autoplay deferred until user interaction:", err);
            });
        }
      };

      if (video.readyState >= 2) {
        tryAutoPlay();
      } else {
        video.addEventListener("canplay", tryAutoPlay, { once: true });
        video.addEventListener("loadeddata", tryAutoPlay, { once: true });
      }
    }

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
  }, [src, autoPlay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        setHasStarted(true);
      }).catch((e) => {
        console.warn("Video play error:", e);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = Number(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleSubtitles = () => {
    const video = videoRef.current;
    if (!video) return;
    setSubtitlesEnabled(!subtitlesEnabled);
    if (video.textTracks && video.textTracks[0]) {
      video.textTracks[0].mode = !subtitlesEnabled ? "showing" : "hidden";
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-black group"
    >
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        // @ts-ignore
        webkit-playsinline="true"
        x5-playsinline="true"
        preload="auto"
        muted={isMuted}
        className="w-full aspect-video object-cover cursor-pointer"
        onClick={togglePlay}
      >
        <source src={src} type="video/mp4" />
        <source src={encodeURI(src)} type="video/mp4" />
        {subtitlesSrc && (
          <track
            src={subtitlesSrc}
            kind="subtitles"
            srcLang="bn"
            label="বাংলা সাবটাইটেল"
            default={subtitlesEnabled}
          />
        )}
        আপনার ব্রাউজার ভিডিওটি চালাতে সক্ষম নয়।
      </video>

      {/* End Screen Slot if video finished */}
      {isEnded && endScreenSlot && (
        <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-y-auto animate-fade-in">
          {endScreenSlot}
        </div>
      )}

      {/* Start Overlay Button if not yet played */}
      {(!hasStarted || !isPlaying) && !isEnded && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px] cursor-pointer hover:bg-black/30 transition-all z-20 focus:outline-none"
          aria-label="ভিডিও চালু করুন"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 text-white flex items-center justify-center shadow-2xl shadow-red-950/80 border-2 border-amber-300 hover:scale-110 active:scale-95 transition-transform">
            <Play className="w-9 h-9 fill-current ml-1 text-amber-200" />
          </div>
          <p className="mt-4 text-base sm:text-lg font-bold font-bengali text-amber-200 bg-black/80 px-5 py-2 rounded-full border border-amber-500/50 shadow-lg">
            {title ? `${title} দেখতে স্পর্শ করুন` : "মা কালীর স্নেহাশিস ভিডিও দেখুন"}
          </p>
        </button>
      )}

      {/* Unmute floating button if browser forced muted autoplay */}
      {needsUnmute && isPlaying && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const video = videoRef.current;
            if (video) {
              video.muted = false;
              setIsMuted(false);
              setNeedsUnmute(false);
            }
          }}
          className="absolute top-4 right-4 z-30 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bengali font-bold text-xs shadow-lg transition-transform hover:scale-105 active:scale-95 animate-bounce"
        >
          <VolumeX className="w-4 h-4 text-red-900" />
          <span>শব্দ চালু করতে স্পর্শ করুন</span>
        </button>
      )}

      {/* Error Notice with Retry */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-4 text-center z-20">
          <p className="text-amber-300 font-bold mb-2 font-bengali">ভিডিও সংযোগ লোড হচ্ছে...</p>
          <button
            onClick={() => {
              setHasError(false);
              const video = videoRef.current;
              if (video) {
                video.load();
                video.play().catch(() => {});
              }
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bengali font-bold text-xs shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            পুনরায় চালান ↻
          </button>
        </div>
      )}

      {/* Custom Devotional Video Controls Bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 sm:p-4 flex flex-col gap-2 z-20 opacity-90 group-hover:opacity-100 transition-opacity">
        {/* Progress Slider */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
          aria-label="ভিডিও অগ্রগতি বার"
        />

        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/10 text-amber-300 transition-colors"
              aria-label={isPlaying ? "বিরতি দিন" : "চালান"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
              aria-label={isMuted ? "শব্দ চালু" : "শব্দ বন্ধ"}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <span className="font-mono text-xs text-slate-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {subtitlesSrc && (
              <button
                onClick={toggleSubtitles}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs ${
                  subtitlesEnabled
                    ? "bg-amber-500/30 text-amber-300 border border-amber-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
                title="বাংলা সাবটাইটেল চালু/বন্ধ"
              >
                <Subtitles className="w-4 h-4" />
                <span className="hidden sm:inline">সাবটাইটেল</span>
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-amber-300 transition-colors"
              aria-label="পূর্ণ পর্দা"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
