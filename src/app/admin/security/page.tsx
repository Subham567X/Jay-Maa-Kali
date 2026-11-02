"use client";

import React, { useState, useEffect } from "react";
import { AdminNav } from "@/components/AdminNav";
import { DiyaFlame } from "@/components/DiyaFlame";
import { 
  ShieldAlert, ShieldCheck, Save, RotateCcw, 
  AlertTriangle, CheckCircle2, History, XOctagon, 
  Eye, RefreshCw, AlertCircle, Info, Lock
} from "lucide-react";

export default function AdminSecurityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Security Settings Form State
  const [settings, setSettings] = useState({
    requireFullscreen: true,
    tabSwitchWarning: true,
    maxWarnings: 2,
    invalidateOnExit: true,
    allowRefresh: true,
    canAdminReview: true,
    warningMessageBn:
      "কুইজ চলাকালীন অন্য কোনো ওয়েবসাইট, Google, AI টুল অথবা অন্য অ্যাপ ব্যবহার করা সম্পূর্ণ নিষিদ্ধ। কুইজ চলাকালীন পৃষ্ঠা থেকে বেরিয়ে গেলে আপনার পরীক্ষা বাতিল হতে পারে।",
  });

  // Flagged / Invalidated Attempts & Violations
  const [flaggedAttempts, setFlaggedAttempts] = useState<any[]>([]);
  const [recentViolations, setRecentViolations] = useState<any[]>([]);

  // Reinstate Modal State
  const [reinstatingAttempt, setReinstatingAttempt] = useState<any | null>(null);
  const [reinstateNotes, setReinstateNotes] = useState("");
  const [reinstating, setReinstating] = useState(false);

  // Violations History Modal State
  const [viewingViolations, setViewingViolations] = useState<any | null>(null);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/security");
      if (res.ok) {
        const d = await res.json();
        if (d.settings) setSettings(d.settings);
        setFlaggedAttempts(d.flaggedAttempts || []);
        setRecentViolations(d.recentViolations || []);
      }
    } catch (err) {
      console.error("Error loading security data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "সেটিংস সংরক্ষণ ব্যর্থ");

      setMessage(d.message || "নিরাপত্তা নীতি সফলভাবে সংরক্ষিত হয়েছে!");
      if (d.settings) setSettings(d.settings);
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setSaving(false);
    }
  };

  const handleReinstate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reinstatingAttempt) return;

    setReinstating(true);
    try {
      const res = await fetch("/api/admin/security/reinstate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: reinstatingAttempt.id,
          notes: reinstateNotes.trim() || "অ্যাডমিন কর্তৃক যাচাইপূর্বক পুনর্বহালকৃত",
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "পুনর্বহাল করতে সমস্যা হয়েছে");

      setMessage(d.message || "প্রচেষ্টা সফলভাবে পুনর্বহাল করা হয়েছে!");
      setReinstatingAttempt(null);
      setReinstateNotes("");
      loadSecurityData();
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setReinstating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-12">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gold-gradient font-bengali">
                কুইজ নিরাপত্তা ও ফেয়ার প্লে কন্ট্রোল
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-bengali mt-0.5">
              ফুলস্ক্রিন মোড, ট্যাব সুইচ ও প্রস্থান নিয়ন্ত্রণ, লঙ্ঘন ট্র্যাকিং এবং বাতিলকৃত প্রচেষ্টা পুনর্বহাল।
            </p>
          </div>

          <button
            onClick={loadSecurityData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white font-bengali text-xs transition-colors"
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

        {/* Security Configuration Form */}
        <div className="card-devotional p-6 sm:p-8 rounded-3xl border border-amber-500/30 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-amber-200 font-bengali">
                কুইজ নিরাপত্তা সেটিংস ও নীতিমালা
              </h2>
              <p className="text-xs text-slate-400 font-bengali mt-0.5">
                কালীপূজা ও ভাইফোঁটা উভয় কুইজ ইভেন্টে স্বয়ংক্রিয়ভাবে এই নীতি প্রযোজ্য হবে।
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-bengali">
              {/* Fullscreen Toggle */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-slate-100 block">
                    পূর্ণ পর্দা (Fullscreen) বাধ্যতামূলক
                  </label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    কুইজ চালুর সময় ব্রাউজার স্বয়ংক্রিয়ভাবে ফুলস্ক্রিন করবে।
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireFullscreen}
                  onChange={(e) => setSettings({ ...settings, requireFullscreen: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Tab Switch Warning Toggle */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-slate-100 block">
                    ট্যাব সুইচ ও উইন্ডো ব্লার সনাক্তকরণ
                  </label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    অন্য ট্যাব, সার্চ ইঞ্জিন বা বাহ্যিক অ্যাপে গেলে সতর্কতা প্রদান করবে।
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.tabSwitchWarning}
                  onChange={(e) => setSettings({ ...settings, tabSwitchWarning: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Invalidate on Exit / Back Navigation */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-red-200 block">
                    পৃষ্ঠা ত্যাগ বা ব্যাক বাটনে তৎক্ষণাৎ বাতিল
                  </label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    কুইজ চলাকালীন ব্যাক বাটন চাপলে বা উইন্ডো বন্ধ করলে প্রচেষ্টা বাতিল হবে।
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.invalidateOnExit}
                  onChange={(e) => setSettings({ ...settings, invalidateOnExit: e.target.checked })}
                  className="w-5 h-5 accent-red-500 cursor-pointer"
                />
              </div>

              {/* Allow Refresh within Timer */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-slate-100 block">
                    টাইমার বজায় রেখে ব্রাউজার রিফ্রেশ অনুমতি
                  </label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    অন থাকলে রিফ্রেশ করলে অবশিষ্ট সময়সহ কুইজ চালু থাকবে (টাইমার রিসেট হবে না)। অফ থাকলে রিফ্রেশেও পরীক্ষা বাতিল হবে।
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowRefresh}
                  onChange={(e) => setSettings({ ...settings, allowRefresh: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Max Allowed Warnings */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <label className="text-sm font-bold text-amber-200 block mb-1">
                  বাতিলের পূর্বে সর্বোচ্চ সতর্কতা সংখ্যা
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  ট্যাব পরিবর্তন বা উইন্ডো ফোকাস হারানোর কততমবারে পরীক্ষা বাতিল হবে (ডিফল্ট: ২ বার সতর্কতা, ৩য় বারে বাতিল)।
                </p>
                <select
                  value={settings.maxWarnings}
                  onChange={(e) => setSettings({ ...settings, maxWarnings: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:border-amber-400 focus:outline-none"
                >
                  <option value={1}>১ বার সতর্কতা (২য় বারে বাতিল)</option>
                  <option value={2}>২ বার সতর্কতা (৩য় বারে বাতিল - ডিফল্ট)</option>
                  <option value={3}>৩ বার সতর্কতা (৪র্থ বারে বাতিল)</option>
                  <option value={5}>৫ বার সতর্কতা</option>
                </select>
              </div>

              {/* Admin Review Capability */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-slate-100 block">
                    অ্যাডমিন ম্যানুয়াল রিভিউ ও পুনর্বহাল সুবিধা
                  </label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    অ্যাডমিন প্রয়োজনবোধে বাতিলকৃত প্রচেষ্টাকে উপযুক্ত কারণ দর্শিয়ে পুনর্বহাল করতে পারবেন।
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.canAdminReview}
                  onChange={(e) => setSettings({ ...settings, canAdminReview: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Warning Message Box */}
            <div className="font-bengali">
              <label className="block text-xs font-bold text-amber-200 mb-1">
                কুইজ শুরুর পূর্বে প্রদর্শিত বাধ্যতামূলক বাংলা সতর্কবার্তা:
              </label>
              <textarea
                rows={2}
                value={settings.warningMessageBn}
                onChange={(e) => setSettings({ ...settings, warningMessageBn: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-bengali font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "সংরক্ষণ হচ্ছে..." : "নিরাপত্তা নীতি সংরক্ষণ করুন"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Flagged and Disqualified Attempts Section */}
        <div className="card-devotional rounded-2xl border border-amber-500/30 overflow-hidden">
          <div className="p-5 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-bengali flex items-center gap-2">
                <XOctagon className="w-5 h-5 text-red-400" />
                <span>বাতিলকৃত ও সতর্কতাপ্রাপ্ত কুইজ প্রচেষ্টা ({flaggedAttempts.length})</span>
              </h2>
              <p className="text-xs text-slate-400 font-bengali mt-0.5">
                নিয়ম লঙ্ঘনের কারণে বাতিল হওয়া প্রচেষ্টা এবং অ্যাডমিন পর্যালোচনার তালিকা।
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            {flaggedAttempts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-bengali text-xs">
                কোনো বাতিলকৃত বা লঙ্ঘিত প্রচেষ্টা নথিভুক্ত নেই।
              </div>
            ) : (
              <table className="w-full text-left border-collapse font-bengali text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">প্রতিযোগী</th>
                    <th className="py-3 px-4">কুইজ ইভেন্ট</th>
                    <th className="py-3 px-4 text-center">স্থিতি</th>
                    <th className="py-3 px-4 text-center">সতর্কতা সংখ্যা</th>
                    <th className="py-3 px-4">বাতিলকরণের কারণ</th>
                    <th className="py-3 px-4 text-center">লঙ্ঘন বিবরণ</th>
                    <th className="py-3 px-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {flaggedAttempts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-100">{a.participant.name}</p>
                        <p className="font-mono text-[10px] text-amber-300">{a.participant.code}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-300">
                        {a.quizEvent.title} (Day {a.quizEvent.dayNumber})
                      </td>
                      <td className="py-3 px-4 text-center">
                        {a.isInvalidated ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-red-950/80 text-red-300 border border-red-500/50 px-2.5 py-0.5 rounded-full font-bold">
                            <XOctagon className="w-3 h-3 text-red-400" />
                            বাতিল (Invalidated)
                          </span>
                        ) : a.isCompleted ? (
                          <span className="text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            সম্পন্ন ({a.score}/50)
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            চলমান ({a.warningCount} সতর্কতা)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                        {a.warningCount}
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate text-[11px]">
                        {a.invalidationReason || "সতর্কতা সীমার মধ্যে চলমান"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setViewingViolations(a)}
                          className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300 hover:bg-slate-800 text-[11px] inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>লগ দেখুন ({a.violations?.length || 0})</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {a.isInvalidated && settings.canAdminReview && (
                          <button
                            onClick={() => {
                              setReinstatingAttempt(a);
                              setReinstateNotes("");
                            }}
                            className="text-[11px] px-2.5 py-1 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 rounded font-bold transition-all"
                          >
                            পুনর্বহাল করুন
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Realtime Violation Event Stream */}
        <div className="card-devotional p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100 font-bengali">
              সাম্প্রতিক নিরাপত্তা লঙ্ঘন ইভেন্ট স্ট্রিম ({recentViolations.length})
            </h3>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
            {recentViolations.length === 0 ? (
              <p className="text-xs text-slate-400 font-bengali">এখনও কোনো লঙ্ঘন ইভেন্ট রেকর্ড হয়নি।</p>
            ) : (
              recentViolations.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-bengali"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                    <div>
                      <p className="text-slate-200">
                        <strong className="text-amber-300">{v.attempt?.participant?.name}</strong> ({v.attempt?.participant?.code}) —{" "}
                        <span className="font-mono text-red-300">{v.eventType}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">{v.details}</p>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 font-mono">
                    {new Date(v.createdAt).toLocaleTimeString("bn-IN")}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Violations Details Modal */}
      {viewingViolations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="card-devotional max-w-lg w-full p-6 rounded-3xl border-2 border-amber-500 shadow-2xl space-y-4 font-bengali">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gold-gradient">
                  লঙ্ঘন বিস্তারিত লগ
                </h3>
                <p className="text-xs text-slate-400">
                  প্রতিযোগী: {viewingViolations.participant?.name} ({viewingViolations.participant?.code})
                </p>
              </div>
              <button
                onClick={() => setViewingViolations(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {viewingViolations.violations?.length === 0 ? (
                <p className="text-xs text-slate-400">কোনো লঙ্ঘন রেকর্ড পাওয়া যায়নি।</p>
              ) : (
                viewingViolations.violations.map((violation: any, idx: number) => (
                  <div key={violation.id || idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between text-amber-300 font-bold">
                      <span>সতর্কতা #{violation.warningNumber} • {violation.eventType}</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(violation.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{violation.details}</p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setViewingViolations(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* Reinstate Attempt Modal */}
      {reinstatingAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="card-devotional max-w-md w-full p-6 sm:p-8 rounded-3xl border-2 border-emerald-500 shadow-2xl space-y-4 font-bengali">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  কুইজ প্রচেষ্টা পুনর্বহাল
                </h3>
                <p className="text-xs text-slate-400">
                  {reinstatingAttempt.participant.name} ({reinstatingAttempt.participant.code})
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <p>• কুইজ: <strong className="text-amber-300">{reinstatingAttempt.quizEvent.title}</strong></p>
              <p>• বর্তমান বাতিল কারণ: <span className="text-red-300">{reinstatingAttempt.invalidationReason}</span></p>
            </div>

            <form onSubmit={handleReinstate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-200 font-semibold mb-1">
                  অ্যাডমিন পর্যালোচনার কারণ / নোট (বাধ্যতামূলক):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="যেমন: যান্ত্রিক বিঘ্ন বা নেটওয়ার্ক ড্রপের সত্যতা যাচাইপূর্বক পুনরায় কুইজ দেওয়ার অনুমোদন দেওয়া হলো।"
                  value={reinstateNotes}
                  onChange={(e) => setReinstateNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReinstatingAttempt(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={reinstating}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
                >
                  {reinstating ? "পুনর্বহাল হচ্ছে..." : "হ্যাঁ, পুনর্বহাল করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
