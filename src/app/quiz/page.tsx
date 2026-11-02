"use client";

import React, { useState, useEffect } from "react";
import { DiyaFlame } from "@/components/DiyaFlame";
import { QuizRunner } from "@/components/QuizRunner";
import { ParticipantRegisterModal } from "@/components/ParticipantRegisterModal";
import { MaaKaliBlessingIntro } from "@/components/MaaKaliBlessingIntro";
import { 
  HelpCircle, Trophy, Calendar, CheckCircle2, 
  ArrowRight, Sparkles, UserCheck, ShieldAlert, 
  XOctagon, Play, Film, ShieldCheck, Lock, Users
} from "lucide-react";

export default function QuizPortalPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [participant, setParticipant] = useState<any | null>(null);
  const [selectedEventSlug, setSelectedEventSlug] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [pendingEventSlug, setPendingEventSlug] = useState<string | null>(null);

  // Blessing Video State
  const [hasWatchedBlessing, setHasWatchedBlessing] = useState<boolean>(false);
  const [activeBlessingSlug, setActiveBlessingSlug] = useState<string | null>(null);

  // 1. Fetch participant, events & video status on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [eventsRes, participantRes, videoRes] = await Promise.all([
        fetch("/api/quiz/events"),
        fetch("/api/participant/me"),
        fetch("/api/quiz/video-status"),
      ]);

      if (eventsRes.ok) {
        const eData = await eventsRes.json();
        setEvents(eData.events || []);
      }

      if (participantRes.ok) {
        const pData = await participantRes.json();
        if (pData.authenticated && pData.participant) {
          setParticipant(pData.participant);
          if (pData.participant.blessingVideoCompleted) {
            setHasWatchedBlessing(true);
          }
        }
      }

      if (videoRes.ok) {
        const vData = await videoRes.json();
        if (vData.completed) {
          setHasWatchedBlessing(true);
        }
      }
    } catch (err) {
      console.error("Error loading quiz portal:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Start Quiz Event Handler (Checks Video Blessing -> Registration -> Questions)
  const handleInitiateQuiz = (slug: string) => {
    // If participant hasn't watched the mandatory blessing video yet, prompt video first
    if (!hasWatchedBlessing) {
      setActiveBlessingSlug(slug);
      return;
    }

    // Next check registration
    if (!participant) {
      setPendingEventSlug(slug);
      setIsRegisterOpen(true);
      return;
    }

    // Launch Quiz questions loader
    loadQuizQuestions(slug);
  };

  // 3. Callback when Blessing Video finishes & user clicks "এবার কুইজ শুরু করো"
  const handleBlessingComplete = () => {
    setHasWatchedBlessing(true);
    const slug = activeBlessingSlug;
    setActiveBlessingSlug(null);

    if (slug) {
      if (!participant) {
        setPendingEventSlug(slug);
        setIsRegisterOpen(true);
      } else {
        loadQuizQuestions(slug);
      }
    }
  };

  // 4. Fetch questions and launch runner
  const loadQuizQuestions = async (slug: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quiz/questions?slug=${slug}`);
      const data = await res.json();

      if (!res.ok && !data.isInvalidated) {
        throw new Error(data.error || "প্রশ্ন লোড করতে সমস্যা হয়েছে");
      }

      setQuizData(data);
      setSelectedEventSlug(slug);
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setLoading(false);
    }
  };

  // 5. Callback from registration modal
  const handleRegisterSuccess = (newParticipant: any) => {
    setParticipant(newParticipant);
    setIsRegisterOpen(false);
    if (newParticipant.blessingVideoCompleted) {
      setHasWatchedBlessing(true);
    }

    if (pendingEventSlug) {
      const slug = pendingEventSlug;
      setPendingEventSlug(null);
      loadQuizQuestions(slug);
    }
  };

  const handleLogoutParticipant = async () => {
    try {
      await fetch("/api/participant/logout", { method: "POST" });
      setParticipant(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
        <DiyaFlame size="lg" />
        <p className="mt-4 text-amber-300 font-bengali text-base animate-pulse">
          কুইজ তথ্য যাচাই ও লোড হচ্ছে...
        </p>
      </div>
    );
  }

  // Active Blessing Video Screen before Quiz
  if (activeBlessingSlug) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="max-w-4xl mx-auto mb-4">
          <button
            onClick={() => setActiveBlessingSlug(null)}
            className="text-xs text-slate-400 hover:text-amber-300 font-bengali flex items-center gap-1"
          >
            ← কুইজ তালিকায় ফিরে যাও
          </button>
        </div>

        <MaaKaliBlessingIntro
          onComplete={handleBlessingComplete}
          alreadyWatched={hasWatchedBlessing}
        />
      </div>
    );
  }

  // Active Quiz Runner
  if (selectedEventSlug && quizData) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-6 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedEventSlug(null);
              setQuizData(null);
            }}
            className="text-xs text-slate-400 hover:text-amber-300 font-bengali flex items-center gap-1"
          >
            ← কুইজ তালিকায় ফিরে যাও
          </button>
        </div>

        <QuizRunner
          eventSlug={selectedEventSlug}
          eventTitle={quizData.event.title}
          dayNumber={quizData.event.dayNumber}
          timeLimitSeconds={quizData.event.timeLimitSeconds}
          questions={quizData.questions}
          participant={participant}
          hasAlreadySubmitted={quizData.hasAlreadySubmitted}
          existingScore={quizData.existingScore}
          initialAttemptId={quizData.attemptId}
          initialIsInvalidated={quizData.isInvalidated}
          initialInvalidationReason={quizData.invalidationReason}
          initialWarningCount={quizData.warningCount || 0}
          securitySettings={quizData.securitySettings}
          onFinish={() => {
            fetch("/api/participant/me")
              .then((r) => r.json())
              .then((d) => d.authenticated && setParticipant(d.participant));
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col items-center">
      {/* Devotional Heading */}
      <div className="text-center mb-8 max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-2">
          <DiyaFlame size="sm" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest bg-amber-950/40 px-3 py-1 rounded-full border border-amber-500/30">
            নকুন্ডা মহাজ্ঞান কুইজ উৎসব ২০২৬
          </span>
          <DiyaFlame size="sm" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-gold-gradient font-bengali py-1">
          দুই দিনের বিশেষ জ্ঞান কুইজ
        </h1>
        <p className="text-sm sm:text-base text-slate-300 font-bengali mt-2">
          কালীপূজা ও ভাইফোঁটা—উভয় দিনের কুইজে অংশগ্রহণ করে সর্বমোট ১০০ নম্বরের ভিত্তিতে অর্জন করো 
          একমাত্র সম্মাননা শংসাপত্র: <strong className="text-amber-300">"শ্রেষ্ঠ জ্ঞানী সম্মান ২০২৬"</strong>।
        </p>
      </div>

      {/* Blessing Video Status Banner */}
      <div className="w-full max-w-3xl mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-red-950/30 to-amber-950/40 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/40">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-300 font-bengali">
              মা কালীর স্নেহাশিস দর্শন স্থিতি
            </p>
            <p className="text-xs text-slate-300 font-bengali">
              {hasWatchedBlessing
                ? "পুণ্য দর্শন সম্পন্ন হয়েছে ✓ (কুইজে অংশগ্রহণের অনুমতি প্রাপ্ত)"
                : "বাধ্যতামূলক: কুইজ শুরুর পূর্বে মা কালীর আশীর্বাদ ভিডিও দর্শন সম্পন্ন করতে হবে।"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveBlessingSlug("preview")}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bengali text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{hasWatchedBlessing ? "পুনরায় দর্শন করুন" : "ভিডিওটি দেখুন"}</span>
        </button>
      </div>

      {/* Participant Status Bar */}
      <div className="card-devotional p-4 sm:p-5 rounded-2xl w-full max-w-3xl mb-8 flex flex-wrap items-center justify-between gap-4 border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/40">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            {participant ? (
              <>
                <p className="text-xs text-slate-400 font-bengali">নিবন্ধিত প্রতিযোগী</p>
                <p className="text-base font-bold text-amber-200 font-bengali">
                  {participant.name}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400 font-bengali">প্রতিযোগী স্থিতি</p>
                <p className="text-sm font-semibold text-slate-300 font-bengali">
                  অংশগ্রহণের জন্য নাম নিবন্ধন করুন
                </p>
              </>
            )}
          </div>
        </div>

        {participant ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-amber-300 bg-amber-950/70 border border-amber-500/40 px-3 py-1.5 rounded-lg">
              কোড: {participant.code}
            </span>
            {participant.familyPackId && (
              <a
                href="/family"
                className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1 font-bengali"
              >
                <Users className="w-3.5 h-3.5" />
                <span>ফ্যামিলি ড্যাশবোর্ড</span>
              </a>
            )}
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="text-xs text-slate-400 hover:text-amber-300 font-bengali underline"
            >
              বদলান
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={handleLogoutParticipant}
              className="text-xs text-red-400 hover:text-red-300 font-bengali underline"
            >
              লগআউট
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bengali text-xs font-bold shadow-md hover:from-red-500 hover:to-amber-500 transition-all"
          >
            নাম নিবন্ধন করো
          </button>
        )}
      </div>

      {/* Two Quiz Events Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-10">
        {events.map((event) => {
          const attempt = participant?.attempts?.find((a: any) => a.quizEventId === event.id);
          const isCompleted = attempt?.isCompleted;
          const isInvalidated = attempt?.isInvalidated;

          return (
            <div
              key={event.id}
              className={`card-devotional p-6 sm:p-8 rounded-3xl border-2 flex flex-col justify-between transition-all ${
                isInvalidated
                  ? "border-red-500/50 bg-red-950/10"
                  : isCompleted
                  ? "border-emerald-500/50 bg-emerald-950/10"
                  : "border-amber-500/40 hover:border-amber-400"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold font-mono text-amber-300 bg-amber-950/70 border border-amber-500/30 px-3 py-1 rounded-full">
                    DAY {event.dayNumber} • ৫০ নম্বর
                  </span>

                  {isInvalidated ? (
                    <span className="flex items-center gap-1 text-xs text-red-400 font-bengali font-bold bg-red-950/70 px-2.5 py-0.5 rounded-full border border-red-500/40">
                      <XOctagon className="w-3.5 h-3.5" />
                      <span>প্রচেষ্টা বাতিল</span>
                    </span>
                  ) : isCompleted ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-bengali font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>সম্পন্ন ({attempt.score}/50)</span>
                    </span>
                  ) : null}
                </div>

                <h3 className="text-2xl font-bold text-gold-gradient font-bengali">
                  {event.title}
                </h3>
                <p className="text-xs font-semibold text-amber-200/80 font-bengali mt-1">
                  {event.subtitle}
                </p>
                <p className="text-xs text-slate-300 font-bengali mt-3 leading-relaxed">
                  {event.description}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 font-bengali">
                  <div>
                    সময়: <strong className="text-white">{Math.round(event.timeLimitSeconds / 60)} মিনিট</strong>
                  </div>
                  <div>
                    প্রশ্ন: <strong className="text-white">ঠিক ৫০টি</strong>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4">
                <button
                  type="button"
                  onClick={() => handleInitiateQuiz(event.slug)}
                  className={`w-full py-3.5 rounded-xl font-bengali font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                    isInvalidated
                      ? "bg-red-950/80 hover:bg-red-900/80 text-red-200 border border-red-500/50"
                      : isCompleted
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      : "bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white border border-amber-300/40 shadow-red-950/50"
                  }`}
                >
                  {isInvalidated ? (
                    <>
                      <XOctagon className="w-4 h-4 text-red-400" />
                      <span>বাতিল স্থিতি দেখুন</span>
                    </>
                  ) : isCompleted ? (
                    <>
                      <span>ফলাফল ও স্কোর দেখুন</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>কুইজ শুরু করো</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rules Notice */}
      <div className="card-devotional p-6 rounded-2xl w-full max-w-3xl mb-8 space-y-3">
        <h4 className="text-sm font-bold text-amber-300 font-bengali flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>কুইজ প্রতিযোগিতা ও ফেয়ার-প্লে নিয়মাবলী:</span>
        </h4>
        <ul className="text-xs text-slate-300 font-bengali space-y-1.5 list-disc pl-5">
          <li><strong>মা কালীর আশীর্বাদ দর্শন:</strong> প্রতিটি কুইজ শুরু করার পূর্বে মায়ের পুণ্য আশিসবাণী ভিডিও সম্পূর্ণ দর্শন করা বাধ্যতামূলক।</li>
          <li><strong>পূর্ণ পর্দা ও পরিবেশ:</strong> কুইজ চলাকালীন ব্রাউজার সম্পূর্ণ পর্দায় থাকতে হবে। অন্য কোনো ট্যাব, উইন্ডো বা বাহ্যিক সার্চ ইঞ্জিন ব্যবহার কঠোরভাবে নিষিদ্ধ।</li>
          <li><strong>কঠোর প্রস্থান নীতি:</strong> সক্রিয় কুইজের সময় পৃষ্ঠা থেকে বেরিয়ে গেলে বা ব্রাউজার ব্যাক বাটন ব্যবহার করলে প্রচেষ্টা তৎক্ষণাৎ বাতিল হয়ে যাবে।</li>
          <li>প্রতিটি কুইজে ঠিক ৫০টি করে প্রশ্ন থাকবে এবং প্রতিটি সঠিক উত্তরের জন্য ১ নম্বর (সর্বমোট ১০০ নম্বর)।</li>
          <li>উভয় দিনের কুইজ মিলিয়ে সর্বোচ্চ নম্বর প্রাপ্ত একাকী প্রতিযোগী পাবেন <strong>"শ্রেষ্ঠ জ্ঞানী সম্মান ২০২৬"</strong> ডিজিটাল সার্টিফিকেট।</li>
        </ul>
      </div>

      {/* Registration Modal */}
      <ParticipantRegisterModal
        isOpen={isRegisterOpen}
        onSuccess={handleRegisterSuccess}
        onClose={() => setIsRegisterOpen(false)}
      />
    </div>
  );
}
