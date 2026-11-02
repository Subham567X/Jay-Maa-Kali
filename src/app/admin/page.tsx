"use client";

import React, { useState, useEffect } from "react";
import { AdminNav } from "@/components/AdminNav";
import { DiyaFlame } from "@/components/DiyaFlame";
import { 
  Lock, User, Shield, Users, HelpCircle, Trophy, 
  Film, AlertCircle, ArrowRight, CheckCircle2 
} from "lucide-react";

export default function AdminDashboardPage() {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Login form state
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Stats state
  const [stats, setStats] = useState<{
    participantCount: number;
    day1Attempts: number;
    day2Attempts: number;
    provisionalWinner: any | null;
    isWinnerPublished: boolean;
  }>({
    participantCount: 0,
    day1Attempts: 0,
    day2Attempts: 0,
    provisionalWinner: null,
    isWinnerPublished: false,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setSession(data.admin);
        loadDashboardStats();
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const [partsRes, winRes] = await Promise.all([
        fetch("/api/admin/participants"),
        fetch("/api/admin/winner/approve"),
      ]);

      let participantCount = 0;
      let day1Attempts = 0;
      let day2Attempts = 0;

      if (partsRes.ok) {
        const partsData = await partsRes.json();
        const list = partsData.participants || [];
        participantCount = list.length;
        list.forEach((p: any) => {
          if (p.attempts?.some((a: any) => a.quizEvent?.dayNumber === 1 && a.isCompleted)) {
            day1Attempts++;
          }
          if (p.attempts?.some((a: any) => a.quizEvent?.dayNumber === 2 && a.isCompleted)) {
            day2Attempts++;
          }
        });
      }

      let provisionalWinner = null;
      let isWinnerPublished = false;

      if (winRes.ok) {
        const winData = await winRes.json();
        provisionalWinner = winData.provisionalWinner || null;
        isWinnerPublished = winData.currentApproval?.status === "PUBLISHED";
      }

      setStats({
        participantCount,
        day1Attempts,
        day2Attempts,
        provisionalWinner,
        isWinnerPublished,
      });
    } catch (err) {
      console.error("Dashboard stats error:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "লগইন ব্যর্থ হয়েছে");
      }

      setSession(data.admin);
      loadDashboardStats();
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <DiyaFlame size="lg" />
        <p className="mt-4 text-amber-300 font-bengali text-base animate-pulse">
          অ্যাডমিন যাচাই হচ্ছে...
        </p>
      </div>
    );
  }

  // If not logged in, show Login Screen
  if (!session) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 alpona-pattern">
        <div className="card-devotional max-w-md w-full p-6 sm:p-8 rounded-3xl border-2 border-amber-500/40 shadow-2xl relative">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-red-600/20 text-amber-300 mx-auto flex items-center justify-center mb-3 border border-amber-500/40">
              <Shield className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-gold-gradient font-bengali">
              কমিটি অ্যাডমিন লগইন
            </h1>
            <p className="text-xs text-slate-400 font-bengali mt-1">
              নকুন্ডা কালীপূজা ২০২৬ পরিচালনা ড্যাশবোর্ড
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 font-bengali">
                ইউজারনেম
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 font-bengali">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">ডিফল্ট পাসওয়ার্ড: NakundaMaa@2026</p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-xs text-red-300 font-bengali flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-bengali font-bold text-sm shadow-lg shadow-red-950/50 border border-amber-300/40 transition-all disabled:opacity-50"
            >
              {loggingIn ? "লগইন হচ্ছে..." : "অ্যাডমিন প্যানেলে প্রবেশ করুন"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated Admin Overview Dashboard
  return (
    <div className="min-h-[calc(100vh-4rem)] pb-12">
      <AdminNav adminName={session.name || session.username} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gold-gradient font-bengali">
              নকুন্ডা কালীপূজা ও কুইজ কন্ট্রোল ড্যাশবোর্ড
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-bengali mt-0.5">
              দুই দিনের কুইজ, মিডিয়া ফাইল, অংশগ্রহণকারী ও সার্টিফিকেট প্রকাশের কেন্দ্রীয় পরিচালনা কেন্দ্র।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5 font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM ACTIVE (100 Questions Verified)
            </span>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-devotional p-5 rounded-2xl border border-amber-500/30">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-bengali font-bold uppercase tracking-wider text-slate-400">
                মোট প্রতিযোগী
              </span>
              <Users className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold font-mono text-slate-100">
              {stats.participantCount}
            </div>
            <p className="text-[11px] text-slate-400 font-bengali mt-1">নিবন্ধিত ও সক্রিয় প্রতিযোগী</p>
          </div>

          <div className="card-devotional p-5 rounded-2xl border border-amber-500/30">
            <div className="flex items-center justify-between text-red-400 mb-2">
              <span className="text-xs font-bengali font-bold uppercase tracking-wider text-slate-400">
                Day 1 সম্পন্ন
              </span>
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold font-mono text-slate-100">
              {stats.day1Attempts}
            </div>
            <p className="text-[11px] text-slate-400 font-bengali mt-1">কালীপূজা কুইজ সমাপ্তকারী</p>
          </div>

          <div className="card-devotional p-5 rounded-2xl border border-amber-500/30">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-bengali font-bold uppercase tracking-wider text-slate-400">
                Day 2 সম্পন্ন
              </span>
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold font-mono text-slate-100">
              {stats.day2Attempts}
            </div>
            <p className="text-[11px] text-slate-400 font-bengali mt-1">ভাইফোঁটা কুইজ সমাপ্তকারী</p>
          </div>

          <div className="card-devotional p-5 rounded-2xl border border-amber-500/30">
            <div className="flex items-center justify-between text-yellow-400 mb-2">
              <span className="text-xs font-bengali font-bold uppercase tracking-wider text-slate-400">
                সার্টিফিকেট স্থিতি
              </span>
              <Trophy className="w-5 h-5" />
            </div>
            <div className="text-base font-bold font-bengali text-amber-300 truncate">
              {stats.isWinnerPublished ? "প্রকাশিত ✅" : stats.provisionalWinner ? "প্রস্তুত (অনুমোদন বাকি)" : "কুইজ চলমান"}
            </div>
            <p className="text-[11px] text-slate-400 font-bengali mt-1">
              একক শ্রেষ্ঠ জ্ঞানী সম্মাননা ২০২৬
            </p>
          </div>
        </div>

        {/* Provisional Winner Card */}
        {stats.provisionalWinner && (
          <div className="card-devotional p-6 rounded-2xl border-2 border-amber-400 bg-amber-950/20 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30">
                শীর্ষ সম্ভাব্য বিজয়ী (কম্বাইন্ড স্কোর ও টাই-ব্রেকার যাচাইকৃত)
              </span>
              <h3 className="text-2xl font-bold text-slate-100 font-bengali mt-2">
                {stats.provisionalWinner.name} ({stats.provisionalWinner.code})
              </h3>
              <p className="text-xs text-slate-300 font-bengali mt-1">
                Day 1: <strong className="text-amber-300">{stats.provisionalWinner.day1Score}</strong> | Day 2:{" "}
                <strong className="text-amber-300">{stats.provisionalWinner.day2Score}</strong> | সর্বমোট:{" "}
                <strong className="text-amber-400 font-mono text-sm">{stats.provisionalWinner.combinedScore} / ১০০</strong> | মোট সময়:{" "}
                <span className="font-mono">{stats.provisionalWinner.combinedDuration} সে.</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/admin/winner"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-bengali font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <span>বিজয়ী পর্যালোচনা ও অনুমোদন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Quick Management Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <a
            href="/admin/quiz"
            className="card-devotional p-6 rounded-2xl border border-amber-500/30 hover:border-amber-400 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-amber-200 font-bengali">কুইজ ও প্রশ্নাবলী</h3>
              <p className="text-xs text-slate-300 font-bengali mt-1 leading-relaxed">
                উভয় দিনের কুইজের ৫০টি করে প্রশ্ন সম্পাদনা, সঠিক উত্তর নির্ধারণ ও যাচাই।
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-bengali text-amber-400 flex items-center gap-1">
              <span>প্রশ্নাবলী দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </a>

          <a
            href="/admin/security"
            className="card-devotional p-6 rounded-2xl border border-red-500/30 hover:border-red-400 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-amber-200 font-bengali">কুইজ নিরাপত্তা নীতি</h3>
              <p className="text-xs text-slate-300 font-bengali mt-1 leading-relaxed">
                ফুলস্ক্রিন, ট্যাব সুইচ ও প্রস্থান নিয়ন্ত্রণ, লঙ্ঘন অডিট এবং বাতিল প্রচেষ্টা পুনর্বহাল।
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-bengali text-red-400 flex items-center gap-1">
              <span>নিরাপত্তা নিয়ন্ত্রণ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </a>

          <a
            href="/admin/participants"
            className="card-devotional p-6 rounded-2xl border border-amber-500/30 hover:border-amber-400 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-amber-200 font-bengali">প্রতিযোগী ও কমিটি</h3>
              <p className="text-xs text-slate-300 font-bengali mt-1 leading-relaxed">
                অংশগ্রহণকারীদের স্কোর রেকর্ড, কমিটি অ্যালিয়াস ও সার্টিফিকেট বর্জন নিয়ন্ত্রণ।
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-bengali text-amber-400 flex items-center gap-1">
              <span>প্রতিযোগী তালিকা</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </a>

          <a
            href="/admin/media"
            className="card-devotional p-6 rounded-2xl border border-amber-500/30 hover:border-amber-400 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Film className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-amber-200 font-bengali">মিডিয়া ফাইল প্রতিস্থাপন</h3>
              <p className="text-xs text-slate-300 font-bengali mt-1 leading-relaxed">
                মা কালীর আশীর্বাদ ভিডিও, ভক্তিগীতি ও অডিওবুক আসল রেকর্ডিং আপলোড ও পরিবর্তন।
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-bengali text-amber-400 flex items-center gap-1">
              <span>মিডিয়া পরিচালনা</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
