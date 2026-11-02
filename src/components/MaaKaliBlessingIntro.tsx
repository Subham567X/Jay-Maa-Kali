"use client";

import React, { useState, useEffect, useRef } from "react";
import { DiyaFlame } from "@/components/DiyaFlame";
import { 
  Play, Pause, Volume2, VolumeX, Maximize, 
  Sparkles, CheckCircle2, ShieldAlert, RotateCcw, 
  ArrowRight, Heart, Award
} from "lucide-react";

interface MaaKaliBlessingIntroProps {
  onComplete: () => void;
  alreadyWatched?: boolean;
}

export function MaaKaliBlessingIntro({ onComplete, alreadyWatched = false }: MaaKaliBlessingIntroProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [maxTimeReached, setMaxTimeReached] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [needsUnmute, setNeedsUnmute] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(alreadyWatched);
  const [submittingCompletion, setSubmittingCompletion] = useState(false);
  const [videoData, setVideoData] = useState<{
    url: string;
    posterUrl: string;
    title: string;
    fileExists: boolean;
  }>({
    url: "/media/video/video%201.mp4",
    posterUrl: "/media/images/kali_video_poster.jpg",
    title: "মা কালীর দিব্য স্নেহাশিস ও আশীর্বাদ",
    fileExists: true,
  });

  // Fetch video asset info & completion status
  useEffect(() => {
    async function fetchVideoInfo() {
      try {
        const res = await fetch("/api/quiz/video-status");
        if (res.ok) {
          const d = await res.json();
          if (d.video) {
            setVideoData(d.video);
          }
          if (d.completed) {
            setIsFinished(true);
          }
        }
      } catch (e) {
        console.error("Error loading video status:", e);
      }
    }
    fetchVideoInfo();
  }, []);

  // Autoplay blessing video automatically on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
            console.warn("Blessing video autoplay deferred:", err);
          });
      }
    };

    if (video.readyState >= 2) {
      tryAutoPlay();
    } else {
      video.addEventListener("canplay", tryAutoPlay, { once: true });
      video.addEventListener("loadeddata", tryAutoPlay, { once: true });
    }
  }, [videoData.url]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const cur = video.currentTime;
      setCurrentTime(cur);
      setMaxTimeReached((prev) => Math.max(prev, cur));

      // If reached within 1 second of end, consider finished
      if (video.duration && cur >= video.duration - 0.8) {
        handleVideoFinished();
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      handleVideoFinished();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  const handleVideoFinished = async () => {
    if (isFinished) return;
    setIsFinished(true);
    setSubmittingCompletion(true);

    try {
      await fetch("/api/quiz/video-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.warn("Could not record video completion on server:", e);
    } finally {
      setSubmittingCompletion(false);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        setHasStarted(true);
      }).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Prevent skipping ahead past the maximum watched point!
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const targetTime = Number(e.target.value);
    // Only allow seeking backwards or within already watched progress
    if (targetTime <= maxTimeReached + 1 || isFinished) {
      video.currentTime = targetTime;
      setCurrentTime(targetTime);
    } else {
      // Snap back to max watched time
      video.currentTime = maxTimeReached;
      setCurrentTime(maxTimeReached);
    }
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

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Devotional Header Banner */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <DiyaFlame size="sm" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest bg-amber-950/60 px-3.5 py-1 rounded-full border border-amber-500/40">
            নকুন্ডা মহাজ্ঞান কুইজ ২০২৬ • শুভ আরম্ভ
          </span>
          <DiyaFlame size="sm" />
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold text-gold-gradient font-bengali">
          মা কালীর পুণ্য স্নেহাশিস দর্শন
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 font-bengali max-w-2xl mx-auto">
          কুইজে অংশগ্রহণের পূর্বে মা ভবতারিণীর আশিসবাণী ও পুণ্য দর্শন বাধ্যতামূলক। 
          ভিডিওটি সম্পূর্ণ দেখার পরেই কুইজ পর্ব উন্মুক্ত হবে।
        </p>

        {/* Sanskrit Prayer */}
        <div className="py-1 text-[11px] sm:text-xs text-amber-300/90 font-serif italic tracking-wide">
          "ওঁ ক্রীং কাল্যৈ নমঃ | সর্বমঙ্গলমঙ্গল্যে শিবে সর্বার্থসাধিকে শরণ্যে ত্র্যম্বকে গৌরি নারায়ণি নমোহস্তুতে ||"
        </div>
      </div>

      {/* Already Watched Banner if applicable */}
      {alreadyWatched && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 font-bengali flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>আপনি ইতিপূর্বে মা কালীর স্নেহাশিস দর্শন সম্পন্ন করেছেন। আপনি সরাসরি কুইজ শুরু করতে পারেন অথবা পুনরায় দেখতে পারেন।</span>
          </div>
          <button
            onClick={onComplete}
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all"
          >
            সরাসরি কুইজে যাও →
          </button>
        </div>
      )}

      {/* Video Player Box */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-3xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-black group"
      >
        <video
          ref={videoRef}
          poster={videoData.posterUrl}
          playsInline
          // @ts-ignore
          webkit-playsinline="true"
          x5-playsinline="true"
          autoPlay
          muted={isMuted}
          preload="auto"
          className="w-full h-full object-cover cursor-pointer"
          onClick={togglePlay}
        >
          <source src={videoData.url} type="video/mp4" />
          <source src={encodeURI(videoData.url)} type="video/mp4" />
          আপনার ব্রাউজার ভিডিওটি চালাতে সক্ষম নয়।
        </video>

        {/* Floating Unmute button if browser restricted sound on autoplay */}
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
            className="absolute top-4 right-4 z-30 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bengali font-bold text-xs shadow-xl transition-transform hover:scale-105 active:scale-95 animate-bounce"
          >
            <VolumeX className="w-4 h-4 text-red-900" />
            <span>শব্দ চালু করতে স্পর্শ করুন</span>
          </button>
        )}

        {/* Start Overlay only if not playing and not started */}
        {(!hasStarted || !isPlaying) && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black/50 backdrop-blur-[1px] cursor-pointer hover:bg-black/40 transition-all z-20 focus:outline-none"
            aria-label="মা কালীর আশীর্বাদ ভিডিও চালু করুন"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 text-white flex items-center justify-center shadow-2xl shadow-red-950/80 border-2 border-amber-300 hover:scale-110 active:scale-95 transition-transform">
              <Play className="w-9 h-9 fill-current ml-1 text-amber-200" />
            </div>
            <p className="mt-4 text-sm sm:text-base font-bold font-bengali text-amber-200 bg-black/80 px-5 py-2 rounded-full border border-amber-500/50 flex items-center gap-2 shadow-lg">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>মা কালীর আশীর্বাদ ভিডিও দেখতে স্পর্শ করুন</span>
            </p>
          </button>
        )}


        {/* Video Controls Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 sm:p-4 flex flex-col gap-2 z-20 opacity-90 group-hover:opacity-100 transition-opacity">
          {/* Progress Slider (Forward seeking locked to max watched time) */}
          <div className="relative w-full flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              aria-label="ভিডিও অগ্রগতি বার"
            />
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-200 font-bengali">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-1.5 rounded-lg hover:bg-white/10 text-amber-300 transition-colors"
                aria-label={isPlaying ? "বিরতি" : "চালান"}
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
              <span className="hidden sm:inline text-[11px] text-amber-300/80">
                {!isFinished ? "⚠️ স্কিপ করা নিষিদ্ধ (সম্পূর্ণ ভিডিও দেখুন)" : "ভিডিও দর্শন সম্পন্ন ✓"}
              </span>

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

      {/* Completion & Proceed Button */}
      <div className="card-devotional p-6 rounded-2xl border-2 border-amber-500/40 text-center space-y-4">
        {isFinished ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-bengali font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>মা কালীর স্নেহাশিস দর্শন সফলভাবে সম্পন্ন হয়েছে!</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-bengali">
              মায়ের আশীর্বাদ নিয়ে এবার কুইজ নিয়মাবলী ও প্রতিযোগিতায় প্রবেশ করুন।
            </p>

            <button
              onClick={onComplete}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-bengali font-extrabold text-base sm:text-lg shadow-xl shadow-red-950/70 border-2 border-amber-300 transition-all transform hover:scale-105 flex items-center justify-center gap-3 mx-auto"
            >
              <Sparkles className="w-5 h-5 text-amber-200 animate-spin" />
              <span>এবার কুইজ শুরু করো</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs text-amber-300/90 font-bengali">
              <Heart className="w-4 h-4 text-red-500 animate-pulse" />
              <span>সম্পূর্ণ ভিডিওটি দেখার পরই "এবার কুইজ শুরু করো" বোতামটি সক্রিয় হবে।</span>
            </div>

            <button
              disabled
              className="px-8 py-3.5 rounded-2xl bg-slate-800/80 text-slate-500 font-bengali font-bold text-sm border border-slate-700/60 cursor-not-allowed mx-auto"
            >
              ভিডিও দর্শন শেষ হওয়ার অপেক্ষা...
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
