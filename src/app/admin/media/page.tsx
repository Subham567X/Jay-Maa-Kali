"use client";

import React, { useState, useEffect, useRef } from "react";
import { AdminNav } from "@/components/AdminNav";
import { 
  Film, Music, BookOpen, Save, CheckCircle2, 
  Upload, Folder, FileVideo, FileAudio, AlertCircle, 
  RefreshCw, Check, ArrowRight, Sparkles 
} from "lucide-react";

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch (err) {
      console.error("Media load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (asset: any) => {
    setSavingKey(asset.assetKey);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetKey: asset.assetKey,
          title: asset.title,
          url: asset.url,
          posterUrl: asset.posterUrl,
          subtitlesText: asset.subtitlesText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "আপডেট ব্যর্থ");

      setMessage(`"${asset.title}" সফলভাবে আপডেট হয়েছে!`);
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setSavingKey(null);
    }
  };

  // Direct File Upload handler (uploads to public/media/... and updates DB)
  const handleFileUpload = async (assetKey: string, category: "video" | "audio" | "images", file: File) => {
    setUploadingKey(assetKey);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetKey", assetKey);
      formData.append("category", category);

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "আপলোড ব্যর্থ হয়েছে");

      setMessage(`ফাইল "${data.filename}" সফলভাবে আপলোড হয়েছে এবং ওয়েবসাইটে যুক্ত হয়েছে!`);
      // Update local asset url
      setAssets((prev) =>
        prev.map((a) => (a.assetKey === assetKey ? { ...a, url: data.url } : a))
      );
      loadAssets();
    } catch (err: any) {
      alert(err.message || "ফাইল আপলোড করতে সমস্যা হয়েছে");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleInputChange = (assetKey: string, field: string, value: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.assetKey === assetKey ? { ...a, [field]: value } : a))
    );
  };

  // Organize by the 4-step sequence
  const blessingVideo = assets.find((a) => a.assetKey === "blessing_video");
  const devotionalSong = assets.find((a) => a.assetKey === "devotional_song");
  const audiobookChapters = assets.filter((a) => a.assetKey.startsWith("audiobook_ch"));

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-12">
      <AdminNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gold-gradient font-bengali">
              মিডিয়া ফাইল ও ভিডিও আপলোড সেন্টার
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-bengali mt-0.5">
              প্রথমে শুভেচ্ছা ভিডিও, তারপর গান, তারপর অডিওবুক এবং কুইজ সেকশনের মিডিয়া ফাইল ব্যবস্থাপনা।
            </p>
          </div>

          <button
            onClick={loadAssets}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white font-bengali text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>রিফ্রেশ</span>
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-xs sm:text-sm text-emerald-300 font-bengali flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Folder Structure Visual Guide for Project Owner */}
        <div className="card-devotional p-6 rounded-2xl border-2 border-amber-500/40 space-y-4">
          <div className="flex items-center gap-2 text-amber-300">
            <Folder className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold font-bengali">
              প্রকল্পের মিডিয়া ফোল্ডার ডিরেক্টরি গাইড (Directory Paths)
            </h2>
          </div>
          <p className="text-xs text-slate-300 font-bengali leading-relaxed">
            আপনি আপনার নিজের কম্পিউটার থেকে সরাসরি নিচের ফোল্ডারে ফাইল কপি করে রাখতে পারেন অথবা নিচে প্রতিটি পর্বের <strong>"ফাইল আপলোড করুন"</strong> বোতাম ব্যবহার করে ব্রাউজার থেকেই আপলোড করতে পারেন:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bengali font-bold text-amber-400 block">
                🎥 ভিডিও ১: শুভেচ্ছা ও আশীর্বাদ ভিডিও
              </span>
              <p className="text-slate-300 text-[11px]">
                📁 <code className="text-amber-200">public/media/video/video 1.mp4</code>
              </p>
              <p className="text-emerald-400 text-[10px] font-sans">✓ আপনার আপলোড করা ফাইল সক্রিয়</p>
              <p className="text-slate-500 text-[10px] font-sans">১ম পর্ব: হোমপেজ, /blessings ও কুইজের আগে</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bengali font-bold text-red-400 block">
                🎥 ভিডিও ২: ভক্তিমূলক গানের ভিডিও
              </span>
              <p className="text-slate-300 text-[11px]">
                📁 <code className="text-red-200">public/media/video/Video 2.mp4</code>
              </p>
              <p className="text-emerald-400 text-[10px] font-sans">✓ আপনার আপলোড করা ফাইল সক্রিয়</p>
              <p className="text-slate-500 text-[10px] font-sans">২য় পর্ব: /music পেজে ভিডিও গান দর্শন</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bengali font-bold text-emerald-400 block">
                🎥 ভিডিও ৩: ভাইফোঁটা কুইজ বা অডিওবুক ভিডিও
              </span>
              <p className="text-slate-300 text-[11px]">
                📁 <code className="text-emerald-200">public/media/video/video 3.mp4</code>
              </p>
              <p className="text-emerald-400 text-[10px] font-sans">✓ আপনার আপলোড করা ফাইল সক্রিয়</p>
              <p className="text-slate-500 text-[10px] font-sans">৩য়/৪র্থ পর্ব: /audiobook বা ডে ২ কুইজ</p>
            </div>
          </div>
        </div>

        {/* STEP 1: SUBHECHHA / MAA KALI BLESSING VIDEO */}
        {blessingVideo && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs">
                ১
              </span>
              <h2 className="text-lg font-bold text-amber-200 font-bengali">
                প্রথম পর্ব: শুভেচ্ছা ও মা কালীর আশীর্বাদ ভিডিও (Subhechha Video)
              </h2>
            </div>

            <div className="card-devotional p-6 rounded-2xl border-2 border-amber-500/50 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/40">
                    <FileVideo className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 font-bengali">
                      {blessingVideo.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">KEY: {blessingVideo.assetKey}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* File Upload Trigger */}
                  <input
                    type="file"
                    ref={(el) => {
                      fileInputRefs.current[blessingVideo.assetKey] = el;
                    }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(blessingVideo.assetKey, "video", e.target.files[0]);
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingKey === blessingVideo.assetKey}
                    onClick={() => fileInputRefs.current[blessingVideo.assetKey]?.click()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bengali text-xs font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploadingKey === blessingVideo.assetKey ? "ভিডিও আপলোড হচ্ছে..." : "নতুন ভিডিও ফাইল আপলোড করুন"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={savingKey === blessingVideo.assetKey}
                    onClick={() => handleUpdate(blessingVideo)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bengali text-xs font-bold border border-amber-500/30 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>সংরক্ষণ</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bengali">
                <div>
                  <label className="block text-slate-400 mb-1">ভিডিও ফাইলের পাথ / URL:</label>
                  <input
                    type="text"
                    value={blessingVideo.url || ""}
                    onChange={(e) => handleInputChange(blessingVideo.assetKey, "url", e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">ভিডিও পোস্টার ছবি পাথ:</label>
                  <input
                    type="text"
                    value={blessingVideo.posterUrl || ""}
                    onChange={(e) => handleInputChange(blessingVideo.assetKey, "posterUrl", e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="pt-2 border-t border-slate-800">
                <p className="text-[11px] text-slate-400 font-bengali mb-2">বর্তমান ভিডিও লাইভ প্রিভিউ:</p>
                <video
                  src={blessingVideo.url}
                  controls
                  className="w-full max-w-md rounded-2xl aspect-video bg-black border border-amber-500/30 shadow-md"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DEVOTIONAL SONG */}
        {devotionalSong && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                ২
              </span>
              <h2 className="text-lg font-bold text-amber-200 font-bengali">
                দ্বিতীয় পর্ব: মায়ের চরণে আমার গান (Song)
              </h2>
            </div>

            <div className="card-devotional p-6 rounded-2xl border border-amber-500/30 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/40">
                    <Music className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 font-bengali">
                      {devotionalSong.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">KEY: {devotionalSong.assetKey}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="audio/mp3,audio/wav,audio/mpeg"
                    ref={(el) => {
                      fileInputRefs.current[devotionalSong.assetKey] = el;
                    }}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(devotionalSong.assetKey, "audio", e.target.files[0]);
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingKey === devotionalSong.assetKey}
                    onClick={() => fileInputRefs.current[devotionalSong.assetKey]?.click()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bengali text-xs font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploadingKey === devotionalSong.assetKey ? "গান আপলোড হচ্ছে..." : "নতুন গান ফাইল আপলোড করুন"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={savingKey === devotionalSong.assetKey}
                    onClick={() => handleUpdate(devotionalSong)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bengali text-xs font-bold border border-amber-500/30 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>সংরক্ষণ</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bengali">
                <div>
                  <label className="block text-slate-400 mb-1">অডিও গান পাথ / URL:</label>
                  <input
                    type="text"
                    value={devotionalSong.url || ""}
                    onChange={(e) => handleInputChange(devotionalSong.assetKey, "url", e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">গান কভার ছবি পাথ:</label>
                  <input
                    type="text"
                    value={devotionalSong.posterUrl || ""}
                    onChange={(e) => handleInputChange(devotionalSong.assetKey, "posterUrl", e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <p className="text-[11px] text-slate-400 font-bengali mb-1.5">গান প্রিভিউ:</p>
                <audio src={devotionalSong.url} controls className="w-full max-w-md h-9" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: AUDIOBOOK 5 CHAPTERS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              ৩
            </span>
            <h2 className="text-lg font-bold text-amber-200 font-bengali">
              তৃতীয় পর্ব: মায়ের মহিমা অডিওবুক - ৫টি অধ্যায় (Audiobook)
            </h2>
          </div>

          <div className="space-y-4">
            {audiobookChapters.map((ch, idx) => (
              <div
                key={ch.assetKey}
                className="card-devotional p-5 rounded-2xl border border-slate-800 hover:border-amber-500/30 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 font-bengali">{ch.title}</h4>
                      <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-1.5 py-0.5 rounded">
                        {ch.assetKey}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={(el) => {
                        fileInputRefs.current[ch.assetKey] = el;
                      }}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(ch.assetKey, "audio", e.target.files[0]);
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploadingKey === ch.assetKey}
                      onClick={() => fileInputRefs.current[ch.assetKey]?.click()}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bengali text-xs font-semibold border border-amber-500/40 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingKey === ch.assetKey ? "আপলোড হচ্ছে..." : "অধ্যায় অডিও আপলোড"}</span>
                    </button>

                    <button
                      type="button"
                      disabled={savingKey === ch.assetKey}
                      onClick={() => handleUpdate(ch)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                      title="সংরক্ষণ"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-bengali">
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      value={ch.url || ""}
                      onChange={(e) => handleInputChange(ch.assetKey, "url", e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <audio src={ch.url} controls className="h-7 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 4: QUIZ SECTION NOTICE & LINK */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-yellow-600 text-black flex items-center justify-center font-bold text-xs">
              ৪
            </span>
            <h2 className="text-lg font-bold text-amber-200 font-bengali">
              চতুর্থ পর্ব: দুই দিনের বিশেষ জ্ঞান কুইজ (Quiz Section)
            </h2>
          </div>

          <div className="card-devotional p-6 rounded-2xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gold-gradient font-bengali">
                কুইজ সেকশন সমন্বয় ও প্রশ্নাবলী
              </h3>
              <p className="text-xs text-slate-300 font-bengali mt-1">
                কুইজ শুরুর পূর্বে প্রতিযোগী মা কালীর আপলোডকৃত আশীর্বাদ ভিডিওটি সম্পূর্ণ দর্শন করবে। এরপর Day 1 এবং Day 2-এর ৫০টি করে মোট ১০০টি প্রশ্ন সক্রিয় হবে।
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/admin/quiz"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-bengali font-bold transition-all"
              >
                প্রশ্নাবলী সম্পাদনা
              </a>
              <a
                href="/quiz"
                target="_blank"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bengali font-bold transition-all flex items-center gap-1.5"
              >
                <span>কুইজ পোর্টাল দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
