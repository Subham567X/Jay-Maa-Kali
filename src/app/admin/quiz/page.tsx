"use client";

import React, { useState, useEffect } from "react";
import { AdminNav } from "@/components/AdminNav";
import { DiyaFlame } from "@/components/DiyaFlame";
import { 
  HelpCircle, Edit, Check, Lock, Unlock, 
  AlertCircle, CheckCircle2, Save, X, Eye 
} from "lucide-react";

export default function AdminQuizPage() {
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [eventData, setEventData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions(dayNumber);
  }, [dayNumber]);

  const loadQuestions = async (day: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/questions?day=${day}`);
      if (res.ok) {
        const data = await res.json();
        setEventData(data);
      }
    } catch (err) {
      console.error("Error loading questions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: editingQuestion.id,
          questionText: editingQuestion.questionText,
          explanation: editingQuestion.explanation,
          options: editingQuestion.options,
          forceUnlock: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "আপডেট ব্যর্থ");

      setMessage("প্রশ্ন সফলভাবে সংরক্ষিত হয়েছে!");
      setEditingQuestion(null);
      loadQuestions(dayNumber);
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setSaving(false);
    }
  };

  const handleCorrectOptionChange = (optionKey: string) => {
    if (!editingQuestion) return;
    const updatedOptions = editingQuestion.options.map((opt: any) => ({
      ...opt,
      isCorrect: opt.optionKey === optionKey,
    }));
    setEditingQuestion({ ...editingQuestion, options: updatedOptions });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-12">
      <AdminNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gold-gradient font-bengali">
              কুইজ প্রশ্নাবলী ব্যবস্থাপনা
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-bengali mt-0.5">
              প্রতিটি ইভেন্টে ঠিক ৫০টি সক্রিয় প্রশ্ন থাকতে হবে।
            </p>
          </div>

          {/* Day 1 / Day 2 Tab Selector */}
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 font-bengali text-xs">
            <button
              onClick={() => setDayNumber(1)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                dayNumber === 1
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Day 1: কালীপূজা কুইজ
            </button>
            <button
              onClick={() => setDayNumber(2)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                dayNumber === 2
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Day 2: ভাইফোঁটা কুইজ
            </button>
          </div>
        </div>

        {/* 50 Questions Validation Alert Bar */}
        {eventData && (
          <div
            className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs font-bengali ${
              eventData.isExactly50
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : "bg-red-950/40 border-red-500/40 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {eventData.isExactly50 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {eventData.event.title} – সক্রিয় প্রশ্ন: {eventData.validCount} / ৫০
                </p>
                <p className="text-[11px] opacity-80">
                  {eventData.isExactly50
                    ? "সতর্কতা পরীক্ষা উত্তীর্ণ: ঠিক ৫০টি প্রশ্ন সম্পূর্ণ প্রস্তুত ও যাচাইকৃত।"
                    : "সতর্কতা: কুইজ চালুর পূর্বে ঠিক ৫০টি প্রশ্ন সক্রিয় থাকা আবশ্যক।"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                সময়সীমা: {Math.round(eventData.event.timeLimitSeconds / 60)} মিনিট
              </span>
            </div>
          </div>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="p-12 text-center text-amber-300 font-bengali animate-pulse">
            প্রশ্ন লোড হচ্ছে...
          </div>
        ) : (
          <div className="space-y-4">
            {eventData?.questions?.map((q: any) => {
              const correctOpt = q.options.find((o: any) => o.isCorrect);
              return (
                <div
                  key={q.id}
                  className="card-devotional p-5 rounded-2xl border border-slate-800 hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono font-bold text-xs border border-amber-500/30">
                          {q.questionNumber}
                        </span>
                        <h3 className="text-base font-bold text-slate-100 font-bengali">
                          {q.questionText}
                        </h3>
                      </div>

                      {/* 4 Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {q.options.map((opt: any) => (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-xl text-xs font-bengali flex items-center gap-2 border ${
                              opt.isCorrect
                                ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-300 font-bold"
                                : "bg-slate-950/60 border-slate-800 text-slate-300"
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px]">
                              {opt.optionKey}
                            </span>
                            <span className="truncate">{opt.optionText}</span>
                            {opt.isCorrect && (
                              <span className="ml-auto text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-400">
                                সঠিক উত্তর ✓
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {q.explanation && (
                        <p className="text-[11px] text-slate-400 font-bengali pt-1">
                          ব্যাখ্যা: {q.explanation}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => setEditingQuestion(JSON.parse(JSON.stringify(q)))}
                      className="p-2 text-slate-400 hover:text-amber-300 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl transition-all"
                      title="প্রশ্ন সম্পাদনা করুন"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="card-devotional max-w-xl w-full p-6 sm:p-8 rounded-3xl border-2 border-amber-500 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gold-gradient font-bengali">
                প্রশ্ন {editingQuestion.questionNumber} সম্পাদনা
              </h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 font-bengali">
              <div>
                <label className="block text-xs font-semibold text-amber-200 mb-1">
                  প্রশ্নের শিরোনাম:
                </label>
                <textarea
                  required
                  rows={3}
                  value={editingQuestion.questionText}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, questionText: e.target.value })
                  }
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Edit 4 Options */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-amber-200">
                  ৪টি বিকল্প এবং সঠিক উত্তর নির্বাচন করুন:
                </label>
                {editingQuestion.options.map((opt: any, idx: number) => (
                  <div key={opt.id || idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={opt.isCorrect}
                      onChange={() => handleCorrectOptionChange(opt.optionKey)}
                      className="w-4 h-4 accent-amber-400 cursor-pointer"
                      title="সঠিক উত্তর হিসেবে চিহ্নিত করুন"
                    />
                    <span className="w-6 font-mono font-bold text-amber-400 text-xs">
                      {opt.optionKey}:
                    </span>
                    <input
                      type="text"
                      required
                      value={opt.optionText}
                      onChange={(e) => {
                        const newOptions = [...editingQuestion.options];
                        newOptions[idx].optionText = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: newOptions });
                      }}
                      className="flex-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ব্যাখ্যা / শাস্ত্রীয় প্রসঙ্গ:
                </label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanation || ""}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {saving ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
