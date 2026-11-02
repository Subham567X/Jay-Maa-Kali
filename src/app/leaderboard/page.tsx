"use client";

import React, { useState, useEffect } from "react";
import { DiyaFlame } from "@/components/DiyaFlame";
import { Trophy, Award, Users, CheckCircle2, Medal, ArrowRight } from "lucide-react";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"INDIVIDUAL" | "FAMILY">("INDIVIDUAL");
  const [individualLeaderboard, setIndividualLeaderboard] = useState<any[]>([]);
  const [familyLeaderboard, setFamilyLeaderboard] = useState<any[]>([]);
  const [publishedWinner, setPublishedWinner] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIndividualLeaderboard(data.leaderboard || []);
          setFamilyLeaderboard(data.familyLeaderboard || []);
          setPublishedWinner(data.publishedWinner || null);
        }
      })
      .catch((err) => console.error("Error loading leaderboard:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col items-center">
      {/* Devotional Heading */}
      <div className="text-center mb-8 max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-2">
          <DiyaFlame size="sm" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest bg-amber-950/40 px-3 py-1 rounded-full border border-amber-500/30">
            নকুন্ডা মেধা ও জ্ঞান সম্মাননা ২০২৬
          </span>
          <DiyaFlame size="sm" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-gold-gradient font-bengali py-1">
          কুইজ মহোৎসব লিডারবোর্ড
        </h1>
        <p className="text-sm sm:text-base text-slate-300 font-bengali mt-2">
          একক প্রতিযোগী এবং ফ্যামিলি প্যাক—কালীপূজা ও ভাইফোঁটা কুইজের লাইভ স্থান ও ফলাফল।
        </p>
      </div>

      {/* Official Winner Banner if Published */}
      {publishedWinner && (
        <div className="card-devotional p-6 sm:p-8 rounded-3xl w-full max-w-3xl mb-8 border-2 border-amber-400 shadow-2xl bg-gradient-to-r from-red-950/50 via-amber-950/50 to-red-950/50 text-center relative overflow-hidden animate-glow">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 text-black mx-auto flex items-center justify-center shadow-lg shadow-amber-500/40 mb-3 border-2 border-white">
            <Trophy className="w-8 h-8 fill-current text-amber-700" />
          </div>

          <span className="text-xs font-bold text-amber-300 uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full border border-amber-500/50">
            অফিশিয়াল একক শ্রেষ্ঠ জ্ঞানী ২০২৬
          </span>

          <h2 className="text-3xl sm:text-4xl font-black text-gold-gradient font-bengali mt-2">
            {publishedWinner.winnerName}
          </h2>

          <p className="text-sm text-slate-200 font-bengali mt-1">
            সম্মিলিত স্কোর: <strong className="text-amber-400 font-mono text-lg">{publishedWinner.combinedScore} / ১০০</strong>
          </p>

          <div className="mt-4 flex justify-center">
            <a
              href="/certificate"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-bengali font-bold text-sm shadow-xl shadow-amber-600/30 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Award className="w-4 h-4 text-black" />
              <span>ডিজিটাল সম্মাননা সার্টিফিকেট দেখুন ও ডাউনলোড করুন</span>
            </a>
          </div>
        </div>
      )}

      {/* Tab Switcher: Individual vs Family Pack */}
      <div className="flex rounded-2xl bg-slate-900/90 p-1.5 mb-6 border border-amber-500/30 w-full max-w-md font-bengali font-bold text-sm">
        <button
          onClick={() => setActiveTab("INDIVIDUAL")}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "INDIVIDUAL"
              ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>একক প্রতিযোগী ({individualLeaderboard.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("FAMILY")}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "FAMILY"
              ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>ফ্যামিলি প্যাক ({familyLeaderboard.length})</span>
        </button>
      </div>

      {/* Main Leaderboard Table Card */}
      <div className="card-devotional rounded-2xl w-full max-w-4xl overflow-hidden border border-amber-500/30 shadow-2xl">
        <div className="p-4 sm:p-5 bg-slate-900/80 border-b border-amber-500/20 flex items-center justify-between font-bengali">
          <div className="flex items-center gap-2">
            {activeTab === "INDIVIDUAL" ? (
              <Trophy className="w-5 h-5 text-amber-400" />
            ) : (
              <Users className="w-5 h-5 text-amber-400" />
            )}
            <h3 className="text-base sm:text-lg font-bold text-slate-100">
              {activeTab === "INDIVIDUAL" ? "একক প্রতিযোগীদের ক্রমতালিকা" : "ফ্যামিলি প্যাকের ক্রমতালিকা"}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {activeTab === "INDIVIDUAL"
              ? `মোট প্রতিযোগী: ${individualLeaderboard.length}`
              : `মোট পরিবার: ${familyLeaderboard.length}`}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-amber-300 font-bengali animate-pulse">
            তালিকা লোড হচ্ছে...
          </div>
        ) : activeTab === "INDIVIDUAL" ? (
          // 1. INDIVIDUAL LEADERBOARD TABLE
          individualLeaderboard.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bengali">
              এখনও পর্যন্ত কোনো একক প্রতিযোগী কুইজ জমা দেয়নি। প্রথম প্রতিযোগী হয়ে এখনই কুইজে অংশ নাও!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] sm:text-xs text-amber-300 font-bengali uppercase">
                    <th className="py-3 px-4 text-center">স্থান</th>
                    <th className="py-3 px-4">প্রতিযোগীর নাম</th>
                    <th className="py-3 px-4 text-center">Day 1 স্কোর</th>
                    <th className="py-3 px-4 text-center">Day 2 স্কোর</th>
                    <th className="py-3 px-4 text-center">মিলিত স্কোর</th>
                    <th className="py-3 px-4 text-center">স্থিতি</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm font-bengali">
                  {individualLeaderboard.map((item, index) => (
                    <tr
                      key={index}
                      className={`transition-colors ${
                        item.rank === 1 ? "bg-amber-500/10 hover:bg-amber-500/15" : "hover:bg-slate-800/30"
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {item.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-black shadow-md text-xs font-bold">
                            🥇 1
                          </span>
                        ) : item.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-black shadow-md text-xs font-bold">
                            🥈 2
                          </span>
                        ) : item.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white shadow-md text-xs font-bold">
                            🥉 3
                          </span>
                        ) : (
                          <span className="text-slate-400">{item.rank}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        <div className="flex items-center gap-2">
                          <span>{item.name}</span>
                          {item.isCommittee && (
                            <span className="text-[10px] bg-red-950/70 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-normal">
                              পূজা কমিটি
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                        {item.day1Score} / 50
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                        {item.day2Score} / 50
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-black text-amber-400 text-base">
                        {item.combinedScore} <span className="text-xs text-slate-500">/ 100</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {item.isCommittee ? (
                          <span className="text-[11px] text-slate-400">সম্মাননীয় অংশগ্রহণ</span>
                        ) : item.bothDaysCompleted ? (
                          <span className="text-[11px] text-emerald-400 flex items-center justify-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>সম্পন্ন ({item.isEligible ? "সার্টিফিকেট যোগ্য" : "অকৃতকার্য"})</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-400/80">Day 2 বাকি</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          // 2. FAMILY PACK LEADERBOARD TABLE
          familyLeaderboard.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bengali">
              এখনও পর্যন্ত কোনো ফ্যামিলি প্যাকের ফলাফল জমা হয়নি। ৫-১০ জন সদস্য নিয়ে আপনার ফ্যামিলি প্যাক তৈরি করুন!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] sm:text-xs text-amber-300 font-bengali uppercase">
                    <th className="py-3 px-4 text-center">স্থান</th>
                    <th className="py-3 px-4">পরিবার প্রধান ও আইডি</th>
                    <th className="py-3 px-4 text-center">সদস্য সংখ্যা</th>
                    <th className="py-3 px-4 text-center">মোট ফ্যামিলি স্কোর</th>
                    <th className="py-3 px-4 text-center">অ্যাচিভমেন্ট %</th>
                    <th className="py-3 px-4 text-center">সম্মাননা স্থিতি</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm font-bengali">
                  {familyLeaderboard.map((item, index) => (
                    <tr
                      key={index}
                      className={`transition-colors ${
                        item.rank === 1 ? "bg-amber-500/10 hover:bg-amber-500/15" : "hover:bg-slate-800/30"
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {item.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-black shadow-md text-xs font-bold">
                            🥇 1
                          </span>
                        ) : item.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-black shadow-md text-xs font-bold">
                            🥈 2
                          </span>
                        ) : item.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white shadow-md text-xs font-bold">
                            🥉 3
                          </span>
                        ) : (
                          <span className="text-slate-400">{item.rank}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        <div>
                          <span>{item.familyHeadName} ও পরিবার</span>
                          <span className="block text-[11px] font-mono text-amber-300 font-normal">
                            {item.familyId}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                        {item.memberCount} জন
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-black text-amber-400 text-base">
                        {item.familyScore}{" "}
                        <span className="text-xs text-slate-500 font-normal">
                          / {item.maxPossibleScore}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                        {item.achievementPercentage}%
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {item.isEligible ? (
                          <span className="text-[11px] text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ফ্যামিলি সার্টিফিকেট প্রাপ্ত
                          </span>
                        ) : item.allCompleted ? (
                          <span className="text-[11px] text-amber-400">৪০% পূর্ণ হয়নি</span>
                        ) : (
                          <span className="text-[11px] text-slate-400">কুইজ চলমান...</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Rules Notice */}
      <div className="mt-8 text-center text-xs text-slate-400 font-bengali max-w-xl space-y-1">
        <p>
          • <strong>গোপনীয়তা নীতি:</strong> লিডারবোর্ডে কোনো প্রতিযোগী বা পরিবারের মোবাইল নম্বর উন্মুক্ত করা হয় না।
        </p>
        <p>
          • <strong>স্বচ্ছ টাই-ব্রেকার:</strong> সমান স্কোর অর্জনকারী পরিবার ও প্রতিযোগীরা স্বচ্ছভাবে একই স্থান ভাগ করে নেয়।
        </p>
      </div>
    </div>
  );
}
