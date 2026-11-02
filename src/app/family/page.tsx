"use client";

import React, { useState, useEffect } from "react";
import { DiyaFlame } from "@/components/DiyaFlame";
import {
  Users,
  Award,
  Trophy,
  ShieldCheck,
  Download,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  UserCheck,
  Sparkles,
  Phone,
} from "lucide-react";

export default function FamilyDashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search by family ID or mobile if not in session
  const [searchFamilyId, setSearchFamilyId] = useState("");
  const [searchMobile, setSearchMobile] = useState("");

  const loadDashboard = async (customId?: string, customPhone?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (customId) params.set("familyId", customId);
      if (customPhone) params.set("mobileNumber", customPhone);

      const res = await fetch(`/api/family/dashboard?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "ফ্যামিলি ড্যাশবোর্ড লোড করতে ব্যর্থ হয়েছে");
      }

      setData(json);
    } catch (err: any) {
      setError(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchFamilyId.trim() && !searchMobile.trim()) {
      setError("অনুগ্রহ করে ফ্যামিলি আইডি অথবা পরিবার প্রধানের মোবাইল নম্বর দিন");
      return;
    }
    loadDashboard(searchFamilyId.trim(), searchMobile.trim());
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 max-w-6xl mx-auto flex flex-col items-center">
      {/* Devotional Heading */}
      <div className="text-center mb-8 max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-2">
          <DiyaFlame size="sm" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest bg-amber-950/40 px-3 py-1 rounded-full border border-amber-500/30">
            নকুন্ডা মেধা ও জ্ঞান উৎসব ২০২৬
          </span>
          <DiyaFlame size="sm" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-gold-gradient font-bengali py-1">
          ফ্যামিলি প্যাক ড্যাশবোর্ড
        </h1>
        <p className="text-sm sm:text-base text-slate-300 font-bengali mt-2">
          পরিবারের সদস্যদের সম্মিলিত অংশগ্রহণ, লাইভ স্কোর এবং পারিবারিক বিশেষ সম্মাননা স্থিতি।
        </p>
      </div>

      {/* Search Bar if not auto-loaded from session */}
      {!data && !loading && (
        <div className="card-devotional max-w-lg w-full p-6 rounded-3xl border border-amber-500/40 text-center mb-8 font-bengali">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 mx-auto flex items-center justify-center mb-3 border border-amber-500/40">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-1">
            ফ্যামিলি প্যাক খুঁজুন
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            আপনার ফ্যামিলি আইডি অথবা পরিবার প্রধানের ১০-সংখ্যার মোবাইল নম্বর প্রবেশ করান।
          </p>

          <form onSubmit={handleSearch} className="space-y-3">
            <input
              type="text"
              placeholder="ফ্যামিলি আইডি (যেমন: FAM-2026-XXXX)"
              value={searchFamilyId}
              onChange={(e) => setSearchFamilyId(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono focus:border-amber-400 focus:outline-none"
            />
            <div className="text-xs text-slate-500">অথবা</div>
            <input
              type="tel"
              maxLength={10}
              placeholder="পরিবার প্রধানের ১০-সংখ্যার মোবাইল নম্বর"
              value={searchMobile}
              onChange={(e) => setSearchMobile(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono focus:border-amber-400 focus:outline-none"
            />

            {error && (
              <p className="text-xs text-red-400 flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
            >
              ড্যাশবোর্ড দেখুন
            </button>
          </form>
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-amber-300 font-bengali animate-pulse">
          <DiyaFlame size="md" />
          <p className="mt-3 text-sm">পারিবারিক তথ্য লোড হচ্ছে...</p>
        </div>
      )}

      {/* DASHBOARD CONTENT */}
      {data && data.family && (
        <div className="w-full space-y-6">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Family ID & Head */}
            <div className="card-devotional p-5 rounded-2xl border border-amber-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-bengali">পারিবারিক পরিচয়</span>
                <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                  লকড তালিকা
                </span>
              </div>
              <p className="text-xl font-black font-mono text-amber-300">
                {data.family.familyId}
              </p>
              <p className="text-xs text-slate-200 font-bengali mt-1">
                প্রধান: <strong>{data.family.familyHeadName}</strong>
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                📞 {data.family.mobileNumber}
              </p>
            </div>

            {/* Card 2: Total Family Score */}
            <div className="card-devotional p-5 rounded-2xl border border-amber-500/30">
              <span className="text-xs text-slate-400 font-bengali">মোট অর্জিত ফ্যামিলি স্কোর</span>
              <p className="text-3xl font-black font-mono text-gold-gradient mt-1">
                {data.family.familyScore}{" "}
                <span className="text-base font-normal text-slate-400">
                  / {data.family.maxPossibleScore}
                </span>
              </p>
              <p className="text-xs text-slate-400 font-bengali mt-1">
                {data.family.memberCount} জন সদস্যের মিলিত ফলাফল
              </p>
            </div>

            {/* Card 3: Achievement Percentage */}
            <div className="card-devotional p-5 rounded-2xl border border-amber-500/30">
              <span className="text-xs text-slate-400 font-bengali">অ্যাচিভমেন্ট শতাংশ</span>
              <p className="text-3xl font-black font-mono text-amber-400 mt-1">
                {data.family.achievementPercentage}%
              </p>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, data.family.achievementPercentage)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-bengali">
                সার্টিফিকেট যোগ্যতা: সর্বনিম্ন ৪০%
              </p>
            </div>

            {/* Card 4: Family Certificate Status */}
            <div className="card-devotional p-5 rounded-2xl border border-amber-500/30 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bengali">সার্টিফিকেট স্থিতি</span>
                <div className="mt-1">
                  {data.family.isEligibleForCertificate ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bengali">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      যোগ্যতা অর্জন করেছে ✓
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2.5 py-1 rounded-full font-bengali">
                      {data.family.allMembersCompletedBoth ? "৪০% পূর্ণ হয়নি" : "মূল্যায়ন প্রক্রিয়াধীন"}
                    </span>
                  )}
                </div>
              </div>

              {/* Download Family Certificate Button for Family Head */}
              {data.isFamilyHead && data.familyCertificate && (
                <a
                  href={`/api/certificate/download?code=${data.familyCertificate.certificateCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bengali font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all hover:scale-105"
                >
                  <Download className="w-3.5 h-3.5 text-black" />
                  <span>ফ্যামিলি সার্টিফিকেট ডাউনলোড</span>
                </a>
              )}
            </div>
          </div>

          {/* Notice Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-red-950/30 to-amber-950/40 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4 font-bengali text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/40 flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-slate-200 leading-relaxed">
                {data.statusMessage}
              </p>
            </div>

            {!data.canAccessCertificates && (
              <span className="text-[11px] text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                🔒 সার্টিফিকেট দেখার অধিকার কেবলমাত্র পরিবার প্রধানের রয়েছে।
              </span>
            )}
          </div>

          {/* Members Table */}
          <div className="card-devotional rounded-2xl border border-amber-500/30 overflow-hidden shadow-2xl">
            <div className="p-5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 font-bengali flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>পরিবারের সদস্যদের তালিকা ও স্কোরকার্ড ({data.members.length} জন)</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-bengali text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">সদস্যের নাম</th>
                    <th className="py-3 px-4 text-center">কোড</th>
                    <th className="py-3 px-4 text-center">Day 1 স্কোর</th>
                    <th className="py-3 px-4 text-center">Day 2 স্কোর</th>
                    <th className="py-3 px-4 text-center">মিলিত স্কোর</th>
                    <th className="py-3 px-4 text-center">একক সার্টিফিকেট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.members.map((m: any, idx: number) => (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-100 flex items-center gap-2">
                        <span>{m.name}</span>
                        {m.isHead && (
                          <span className="text-[10px] bg-red-950/80 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full">
                            পরিবার প্রধান
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-amber-300">
                        {m.code}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                        {m.day1Score}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                        {m.day2Score}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400 text-sm">
                        {m.combinedScore}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {m.isIndividualEligible ? (
                          data.isFamilyHead && m.individualCertificate ? (
                            <a
                              href={`/api/certificate/download?code=${m.individualCertificate.certificateCode}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 underline font-bold"
                            >
                              <Download className="w-3 h-3" />
                              <span>ডাউনলোড ({m.individualCertificate.grade})</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              যোগ্যতা প্রাপ্ত ✓
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-500">যোগ্যতাহীন</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <a
              href="/quiz"
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bengali hover:text-amber-300 transition-all flex items-center gap-1.5"
            >
              ← কুইজ পোর্টালে যান
            </a>

            <a
              href="/leaderboard"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs font-bengali font-bold shadow-md hover:from-red-500 hover:to-amber-500 transition-all flex items-center gap-1.5"
            >
              <span>ফ্যামিলি লিডারবোর্ড দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
