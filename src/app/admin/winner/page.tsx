"use client";

import React, { useState, useEffect } from "react";
import { AdminNav } from "@/components/AdminNav";
import { CertificateRenderer } from "@/components/CertificateRenderer";
import { 
  Trophy, Award, CheckCircle2, AlertTriangle, 
  ShieldAlert, Send, Eye, RefreshCw 
} from "lucide-react";

export default function AdminWinnerPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadWinnerData();
  }, []);

  const loadWinnerData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/winner/approve");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (err) {
      console.error("Error loading winner data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrPublish = async (action: "APPROVE" | "PUBLISH", participantId: string) => {
    setProcessing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/winner/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          action,
          notes: adminNotes || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "কার্য সম্পাদন ব্যর্থ");

      setMessage(resData.message || "সফলভাবে সংরক্ষিত হয়েছে");
      loadWinnerData();
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setProcessing(false);
    }
  };

  const provisional = data?.provisionalWinner;
  const currentApproval = data?.currentApproval;

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-12">
      <AdminNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gold-gradient font-bengali">
            একক শ্রেষ্ঠ জ্ঞানী বিজয়ী ও সার্টিফিকেট অনুমোদন
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-bengali mt-0.5">
            নিয়ম: শুধুমাত্র একজন যোগ্য অ-কমিটি প্রতিযোগী বিজয়ী শংসাপত্র পাবেন।
          </p>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-xs sm:text-sm text-emerald-300 font-bengali flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Current Approval Status Banner */}
        {currentApproval && (
          <div className="card-devotional p-6 rounded-2xl border-2 border-emerald-500/50 bg-emerald-950/20 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-500/30">
                বর্তমান স্থিতি: {currentApproval.status === "PUBLISHED" ? "জনসমক্ষে প্রকাশিত ✅" : "অনুমোদিত (অপ্রকাশিত)"}
              </span>
              <h3 className="text-2xl font-black text-slate-100 font-bengali mt-2">
                বিজয়ী: {currentApproval.participantName}
              </h3>
              <p className="text-xs text-slate-300 font-bengali mt-1">
                সম্মিলিত স্কোর: <strong className="text-amber-300">{currentApproval.combinedScore} / ১০০</strong> | সার্টিফিকেট কোড:{" "}
                <span className="font-mono text-amber-400">{currentApproval.certificateCode}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {currentApproval.status !== "PUBLISHED" && (
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleApproveOrPublish("PUBLISH", currentApproval.participantId)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bengali font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  সার্টিফিকেট প্রকাশ করুন
                </button>
              )}
              <a
                href="/certificate"
                target="_blank"
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-amber-300 font-bengali font-bold text-xs border border-amber-500/30 hover:bg-slate-700 transition-all flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>সার্টিফিকেট প্রিভিউ</span>
              </a>
            </div>
          </div>
        )}

        {/* Provisional Winner Calculation Card */}
        {loading ? (
          <div className="p-12 text-center text-amber-300 font-bengali animate-pulse">
            বিজয়ী তথ্য গণনা করা হচ্ছে...
          </div>
        ) : provisional ? (
          <div className="card-devotional p-6 sm:p-8 rounded-3xl border border-amber-500/30 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  স্বয়ংক্রিয় সার্ভার-সাইড হিসাব
                </span>
                <h3 className="text-xl font-bold text-slate-100 font-bengali">
                  শীর্ষ যোগ্য প্রতিযোগী: {provisional.name} ({provisional.code})
                </h3>
              </div>
            </div>

            {/* Score Breakdown Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[11px] text-slate-400 font-bengali">Day 1 স্কোর</p>
                <p className="text-xl font-bold font-mono text-slate-100">{provisional.day1Score} / 50</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[11px] text-slate-400 font-bengali">Day 2 স্কোর</p>
                <p className="text-xl font-bold font-mono text-slate-100">{provisional.day2Score} / 50</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[11px] text-slate-400 font-bengali">মিলিত স্কোর</p>
                <p className="text-xl font-black font-mono text-amber-400">{provisional.combinedScore} / 100</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[11px] text-slate-400 font-bengali">মোট সময় (টাই-ব্রেকার)</p>
                <p className="text-xl font-bold font-mono text-slate-100">{provisional.combinedDuration} সে.</p>
              </div>
            </div>

            {/* Tie Candidates if any */}
            {data.hasTie && (
              <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/50 text-xs text-amber-300 font-bengali space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>টাই-ব্রেকার সতর্কতা: একাধিক প্রতিযোগী হুবহু সমান স্কোর ও সময় অর্জন করেছেন</span>
                </div>
                <p>
                  এডমিনকে নিচে তালিকাভুক্ত প্রার্থীদের মধ্য থেকে যাচাইপূর্বক চূড়ান্ত সিদ্ধান্ত নিতে হবে:
                </p>
                <div className="space-y-1">
                  {data.tieCandidates.map((c: any) => (
                    <div key={c.participantId} className="flex justify-between items-center p-2 bg-slate-900 rounded">
                      <span>{c.name} ({c.code})</span>
                      <button
                        onClick={() => handleApproveOrPublish("PUBLISH", c.participantId)}
                        className="px-3 py-1 bg-amber-500 text-black font-bold rounded"
                      >
                        ইনিকেই বিজয়ী করুন
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approval Action Form */}
            <div className="pt-4 border-t border-slate-800 space-y-3 font-bengali">
              <label className="block text-xs font-semibold text-slate-300">
                কমিটি অনুমোদন নোট বা মন্তব্য:
              </label>
              <input
                type="text"
                placeholder="যেমন: নকুন্ডা কালীপূজা কমিটি কর্তৃক সর্বসম্মত যাচাই ও অনুমোদিত।"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
              />

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleApproveOrPublish("APPROVE", provisional.participantId)}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 transition-all disabled:opacity-50"
                >
                  {processing ? "প্রক্রিয়াকরণ..." : "অনুমোদন করুন (খসড়া)"}
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleApproveOrPublish("PUBLISH", provisional.participantId)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-red-950/50 border border-amber-300/40 transition-all disabled:opacity-50"
                >
                  {processing ? "প্রকাশ হচ্ছে..." : "চূড়ান্ত অনুমোদন ও জনসমক্ষে প্রকাশ করুন"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-devotional p-8 rounded-3xl border border-slate-800 text-center font-bengali text-slate-400">
            এখনও পর্যন্ত কোনো প্রতিযোগী উভয় দিনের কুইজ সম্পন্ন করেনি। প্রতিযোগী সম্পন্ন করার পর এখানে সম্ভাব্য বিজয়ী তালিকা প্রস্তুত হবে।
          </div>
        )}
      </div>
    </div>
  );
}
