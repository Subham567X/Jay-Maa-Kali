"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import { DiyaFlame } from "@/components/DiyaFlame";
import { 
  Clock, CheckCircle, ChevronLeft, ChevronRight, AlertTriangle, 
  Send, Trophy, ArrowRight, ShieldAlert, Sparkles, Maximize, 
  ShieldCheck, AlertCircle, XOctagon, Info, Check, X, Award, Eye
} from "lucide-react";

interface Option {
  id: string;
  optionKey: string;
  optionText: string;
}

interface Question {
  id: string;
  questionNumber: number;
  questionText: string;
  options: Option[];
}

interface SecurityConfig {
  requireFullscreen: boolean;
  tabSwitchWarning: boolean;
  maxWarnings: number;
  invalidateOnExit: boolean;
  allowRefresh: boolean;
  canAdminReview: boolean;
  warningMessageBn: string;
}

interface QuizRunnerProps {
  eventSlug: string;
  eventTitle: string;
  dayNumber: number;
  timeLimitSeconds: number;
  questions: Question[];
  participant: {
    id: string;
    name: string;
    code: string;
    isCommittee: boolean;
    familyPackId?: string | null;
  };
  hasAlreadySubmitted: boolean;
  existingScore?: number | null;
  initialAttemptId?: string | null;
  initialIsInvalidated?: boolean;
  initialInvalidationReason?: string | null;
  initialWarningCount?: number;
  securitySettings?: SecurityConfig;
  onFinish?: () => void;
}

export const MANDATORY_PRE_QUIZ_WARNING_BN =
  "কুইজ চলাকালীন অন্য কোনো ওয়েবসাইট, Google, AI টুল অথবা অন্য অ্যাপ ব্যবহার করা সম্পূর্ণ নিষিদ্ধ। কুইজ চলাকালীন পৃষ্ঠা থেকে বেরিয়ে গেলে আপনার পরীক্ষা বাতিল হতে পারে।";

export const MANDATORY_EXIT_DISQUALIFIED_BN =
  "দুঃখিত! আপনি একাধিকবার কুইজের পেজ থেকে বেরিয়ে যাওয়ায় নিয়ম অনুযায়ী আপনার এই কুইজটি বাতিল করা হয়েছে। আজ আর দ্বিতীয়বার কুইজে অংশগ্রহণ করতে পারবেন না। অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত।";

export function QuizRunner({
  eventSlug,
  eventTitle,
  dayNumber,
  timeLimitSeconds = 3600, // 60 minutes default
  questions,
  participant,
  hasAlreadySubmitted,
  existingScore,
  initialAttemptId,
  initialIsInvalidated = false,
  initialInvalidationReason,
  initialWarningCount = 0,
  securitySettings,
  onFinish,
}: QuizRunnerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Security & Attempt State
  const [attemptId, setAttemptId] = useState<string | null>(initialAttemptId || null);
  const [hasStartedExam, setHasStartedExam] = useState<boolean>(false);
  const [startingExam, setStartingExam] = useState<boolean>(false);
  const [rulesConsent, setRulesConsent] = useState<boolean>(false);
  const [isInvalidated, setIsInvalidated] = useState<boolean>(initialIsInvalidated);
  const [invalidationReason, setInvalidationReason] = useState<string>(
    initialInvalidationReason || MANDATORY_EXIT_DISQUALIFIED_BN
  );
  const [warningCount, setWarningCount] = useState<number>(initialWarningCount);
  const [activeWarningModal, setActiveWarningModal] = useState<{
    message: string;
    warningNumber: number;
    maxWarnings: number;
  } | null>(null);

  const [activeSecurity, setActiveSecurity] = useState<SecurityConfig>(
    securitySettings || {
      requireFullscreen: true,
      tabSwitchWarning: true,
      maxWarnings: 2,
      invalidateOnExit: true,
      allowRefresh: true,
      canAdminReview: true,
      warningMessageBn: MANDATORY_PRE_QUIZ_WARNING_BN,
    }
  );

  // Quiz Engine State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds || 3600);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Result Processing State (2-minute delay)
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [processingRemainingSeconds, setProcessingRemainingSeconds] = useState(120);

  // Final Result State
  const [finalResult, setFinalResult] = useState<any | null>(null);

  const [startTime, setStartTime] = useState<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastViolationTimeRef = useRef<number>(0);

  // Check if result is already completed on load
  useEffect(() => {
    if (hasAlreadySubmitted) {
      fetchResult();
    }
  }, [hasAlreadySubmitted]);

  // Restore draft answers from sessionStorage if permitted
  useEffect(() => {
    try {
      const storageKey = `nakunda_quiz_answers_${eventSlug}_${participant.code}`;
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        setSelectedAnswers(JSON.parse(saved));
      }
    } catch {}
  }, [eventSlug, participant.code]);

  // Countdown timer logic with automatic submission upon timeout
  useEffect(() => {
    if (!hasStartedExam || finalResult || hasAlreadySubmitted || isInvalidated || isProcessingResult) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasStartedExam, finalResult, hasAlreadySubmitted, isInvalidated, isProcessingResult]);

  // Report violation to backend
  const reportViolation = useCallback(
    async (
      eventType: "TAB_SWITCH" | "WINDOW_BLUR" | "FULLSCREEN_EXIT" | "PAGE_LEAVE" | "BACK_NAVIGATION",
      details?: string
    ) => {
      if (!attemptId || finalResult || isInvalidated || isProcessingResult) return;

      const now = Date.now();
      if (now - lastViolationTimeRef.current < 1200) return;
      lastViolationTimeRef.current = now;

      try {
        const res = await fetch("/api/quiz/violation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId,
            eventType,
            details,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.isInvalidated) {
            setIsInvalidated(true);
            setInvalidationReason(data.message || MANDATORY_EXIT_DISQUALIFIED_BN);
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            }
          } else {
            setWarningCount(data.warningCount);
            setActiveWarningModal({
              message: data.message,
              warningNumber: data.warningCount,
              maxWarnings: data.maxWarnings,
            });
          }
        }
      } catch (err) {
        console.error("Violation logging error:", err);
      }
    },
    [attemptId, finalResult, isInvalidated, isProcessingResult]
  );

  // Anti-Cheat Event Listeners (visibilitychange, blur, pagehide)
  useEffect(() => {
    if (!hasStartedExam || finalResult || isInvalidated || isProcessingResult) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        reportViolation("TAB_SWITCH", "ট্যাব বা ব্রাউজার অদৃশ্য হয়েছে (visibilityState: hidden)");
      }
    };

    const handleWindowBlur = () => {
      reportViolation("WINDOW_BLUR", "উইন্ডো ফোকাস নষ্ট হয়েছে (window blur)");
    };

    const handlePageHide = () => {
      reportViolation("PAGE_LEAVE", "পৃষ্ঠা প্রস্থান হয়েছে (pagehide)");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [hasStartedExam, finalResult, isInvalidated, isProcessingResult, reportViolation]);

  // Fetch finalized result
  const fetchResult = async () => {
    try {
      const res = await fetch(`/api/quiz/result?slug=${eventSlug}`);
      const data = await res.json();

      if (data.ready) {
        setIsProcessingResult(false);
        setFinalResult(data);
        if (processingTimerRef.current) clearInterval(processingTimerRef.current);

        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
            colors: ["#ffd700", "#dc2626", "#fbbf24"],
          });
        } catch {}

        if (onFinish) onFinish();
      } else {
        setIsProcessingResult(true);
        setProcessingRemainingSeconds(data.remainingSeconds || 120);
      }
    } catch (err) {
      console.error("Fetch result error:", err);
    }
  };

  // Start Exam Handler
  const handleStartExam = async () => {
    if (!rulesConsent) {
      alert("অনুগ্রহ করে কুইজের নিয়মাবলী পড়ে সম্মতি বক্সে টিক দিন।");
      return;
    }

    setStartingExam(true);
    try {
      if (activeSecurity.requireFullscreen && containerRef.current) {
        try {
          if (!document.fullscreenElement) {
            await containerRef.current.requestFullscreen();
          }
        } catch (fsErr) {
          console.warn("Fullscreen request error:", fsErr);
        }
      }

      const res = await fetch("/api/quiz/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventSlug }),
      });

      const data = await res.json();

      if (!res.ok && !data.isInvalidated && !data.isCompleted) {
        throw new Error(data.error || "কুইজ শুরু করতে ত্রুটি হয়েছে");
      }

      if (data.isInvalidated) {
        setIsInvalidated(true);
        setInvalidationReason(data.invalidationReason || MANDATORY_EXIT_DISQUALIFIED_BN);
        return;
      }

      if (data.isCompleted) {
        fetchResult();
        return;
      }

      setAttemptId(data.attemptId);
      setTimeLeft(data.remainingSeconds ?? 3600);
      setWarningCount(data.warningCount ?? 0);
      if (data.securitySettings) {
        setActiveSecurity(data.securitySettings);
      }
      setStartTime(Date.now());
      setHasStartedExam(true);
    } catch (err: any) {
      alert(err.message || "কুইজ শুরু করতে সমস্যা হয়েছে");
    } finally {
      setStartingExam(false);
    }
  };

  // Save selected answer
  const handleSelectOption = (questionId: string, optionKey: string) => {
    if (finalResult || isInvalidated || isProcessingResult) return;
    const updated = { ...selectedAnswers, [questionId]: optionKey };
    setSelectedAnswers(updated);
    try {
      const storageKey = `nakunda_quiz_answers_${eventSlug}_${participant.code}`;
      sessionStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  // Submit Quiz API call
  const performSubmission = async () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);

    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug,
          answers: selectedAnswers,
          durationSeconds: elapsedSeconds,
        }),
      });

      const data = await res.json();

      if (res.status === 403 && data.isInvalidated) {
        setIsInvalidated(true);
        setInvalidationReason(data.error || MANDATORY_EXIT_DISQUALIFIED_BN);
        return;
      }

      if (!res.ok && !data.alreadyCompleted) {
        throw new Error(data.error || "কুইজ জমা দিতে সমস্যা হয়েছে");
      }

      // Clear draft answers
      try {
        sessionStorage.removeItem(`nakunda_quiz_answers_${eventSlug}_${participant.code}`);
      } catch {}

      // Exit fullscreen safely
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      // Enter 2-minute result processing mode
      setIsProcessingResult(true);
      setProcessingRemainingSeconds(120);

      // Processing countdown & polling
      processingTimerRef.current = setInterval(() => {
        setProcessingRemainingSeconds((prev) => {
          if (prev <= 1) {
            fetchResult();
            return 0;
          }
          if (prev % 5 === 0) {
            fetchResult();
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      alert(err.message || "কুইজ জমা দিতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    performSubmission();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = Math.round((answeredCount / (questions.length || 50)) * 100);

  // 1. IF ATTEMPT IS DISQUALIFIED / INVALIDATED (STRICT FAIR-PLAY SCREEN)
  if (isInvalidated) {
    return (
      <div className="card-devotional max-w-xl w-full mx-auto p-6 sm:p-10 rounded-3xl border-2 border-red-500/70 shadow-2xl text-center animate-fadeIn bg-red-950/20">
        <div className="w-20 h-20 rounded-full bg-red-600/30 text-red-400 mx-auto flex items-center justify-center shadow-lg shadow-red-950/60 mb-4 border-2 border-red-500/60">
          <XOctagon className="w-10 h-10 text-red-400" />
        </div>

        <span className="text-xs font-bold text-red-400 uppercase tracking-widest bg-red-950/80 px-3.5 py-1 rounded-full border border-red-500/50">
          প্রচেষ্টা বাতিল • DISQUALIFIED
        </span>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-red-200 font-bengali mt-3">
          কুইজ প্রচেষ্টা বাতিল করা হয়েছে
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 font-bengali mt-1">
          প্রতিযোগী: <strong className="text-amber-200">{participant.name}</strong> ({participant.code})
        </p>

        {/* Required Mandatory Bengali Message */}
        <div className="my-6 p-5 rounded-2xl bg-black/70 border-2 border-red-500/40 text-left space-y-3 font-bengali">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm sm:text-base font-bold text-red-300 leading-relaxed">
              {invalidationReason || MANDATORY_EXIT_DISQUALIFIED_BN}
            </p>
          </div>

          <div className="pt-3 border-t border-red-900/40 text-xs text-slate-400 space-y-1">
            <p>• ইভেন্ট: <span className="text-slate-200">{eventTitle}</span></p>
            <p>• নিয়ম নীতি: কুইজ চলাকালীন একাধিকবার পৃষ্ঠা ত্যাগ, ট্যাব পরিবর্তন বা অন্য অ্যাপে যাওয়া সম্পূর্ণ নিষিদ্ধ।</p>
            <p>• সার্ভার স্থিতি: স্থায়ীভাবে লক করা হয়েছে। আজ আর এই কুইজে পুনরায় অংশগ্রহণ সম্ভব নয়।</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/leaderboard"
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 text-slate-200 font-bengali font-bold text-xs hover:bg-slate-700 transition-all border border-slate-700"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>যুগ্ম লিডারবোর্ড দেখুন</span>
          </a>

          <a
            href="/quiz"
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-700 to-amber-700 text-white font-bengali font-bold text-xs hover:from-red-600 hover:to-amber-600 transition-all border border-amber-500/30"
          >
            <span>কুইজ সূচিতে ফিরে যান</span>
          </a>
        </div>
      </div>
    );
  }

  // 2. TWO-MINUTE RESULT PROCESSING STATE (PART 9)
  if (isProcessingResult) {
    return (
      <div className="card-devotional max-w-xl w-full mx-auto p-6 sm:p-10 rounded-3xl border-2 border-amber-500/60 shadow-2xl text-center animate-fadeIn space-y-6">
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-amber-500/30 border-t-amber-400 animate-spin" />
          <DiyaFlame size="md" />
        </div>

        <div>
          <span className="text-xs font-bold text-amber-300 uppercase tracking-widest bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/40">
            উত্তরপত্র যাচাইকরণ চলমান
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gold-gradient font-bengali mt-3">
            {eventTitle}
          </h2>
          <p className="text-xs text-slate-300 font-bengali mt-1">
            প্রতিযোগী: <strong className="text-amber-200">{participant.name}</strong>
          </p>
        </div>

        {/* Exact Prompt Message */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/60 via-amber-950/50 to-red-950/60 border border-amber-500/40 text-center font-bengali">
          <p className="text-lg sm:text-xl font-bold text-amber-200 leading-relaxed">
            "মায়ের আশীর্বাদে তোমার উত্তরপত্র যাচাই করা হচ্ছে। একটু অপেক্ষা করো সন্তান… ❤️"
          </p>
          <div className="mt-4 font-mono text-3xl font-black text-amber-400">
            {formatTimer(processingRemainingSeconds)}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            সার্ভারে উত্তরমালা সুরক্ষিতভাবে যাচাই শেষে আপনার পূর্ণ ফলাফল ও উত্তর পর্যালোচনা প্রদর্শিত হবে।
          </p>
        </div>

        <button
          onClick={fetchResult}
          className="text-xs text-amber-400 hover:text-amber-300 font-bengali underline"
        >
          যাচাই স্থিতি রিফ্রেশ করুন
        </button>
      </div>
    );
  }

  // 3. FINAL RESULTS SCREEN (WITH 1-TIME DETAILED ANSWER REVIEW)
  if (finalResult) {
    const { score, totalQuestions, correctCount, incorrectCount, unansweredCount, canReviewDetails, detailedResults, reviewNotice, overall } = finalResult;

    return (
      <div className="card-devotional max-w-3xl w-full mx-auto p-6 sm:p-10 rounded-3xl border-2 border-amber-500/50 shadow-2xl text-center animate-fadeIn space-y-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-red-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-red-950/60 mb-2 border border-amber-300">
          <Trophy className="w-10 h-10 text-amber-200" />
        </div>

        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest bg-amber-950/50 px-3 py-1 rounded-full border border-amber-500/30">
            কুইজ ফলাফল ও উত্তরপত্র যাচাই সম্পন্ন
          </span>
          <h2 className="text-3xl font-extrabold text-gold-gradient font-bengali mt-2">
            {eventTitle}
          </h2>
          <p className="text-sm text-slate-300 font-bengali mt-1">
            প্রতিযোগী: <strong className="text-amber-200">{participant.name}</strong> ({participant.code})
          </p>
        </div>

        {/* Score Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-bengali">
          <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30">
            <span className="text-[11px] text-slate-400">মোট প্রাপ্ত স্কোর</span>
            <p className="text-3xl font-mono font-black text-amber-400 mt-1">
              {score} <span className="text-sm font-normal text-slate-500">/ {totalQuestions}</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
            <span className="text-[11px] text-emerald-300">সঠিক উত্তর</span>
            <p className="text-3xl font-mono font-black text-emerald-400 mt-1">
              {correctCount}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40">
            <span className="text-[11px] text-red-300">ভুল উত্তর</span>
            <p className="text-3xl font-mono font-black text-red-400 mt-1">
              {incorrectCount}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400">অনুত্তরিত</span>
            <p className="text-3xl font-mono font-black text-slate-300 mt-1">
              {unansweredCount}
            </p>
          </div>
        </div>

        {/* Individual Certificate Status Banner */}
        {overall?.bothCompleted && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-red-950/40 to-amber-950/40 border border-amber-500/40 text-left font-bengali space-y-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-bold text-amber-200">
                উভয় কুইজের সমন্বিত সম্মাননা স্থিতি
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              • কালীপূজা স্কোর: <strong>{overall.day1Score} / ৫০</strong>  |  ভাইফোঁটা স্কোর: <strong>{overall.day2Score} / ৫০</strong>  |  সম্মিলিত স্কোর: <strong>{(overall.day1Score || 0) + (overall.day2Score || 0)} / ১০০</strong>
            </p>
            <p className={`text-xs font-bold ${overall.isEligible ? "text-emerald-300" : "text-amber-300"}`}>
              {overall.eligibilityMessage}
            </p>

            {overall.certificate && (
              <div className="pt-2">
                <a
                  href={`/api/certificate/download?code=${overall.certificate.code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-xs shadow-md hover:scale-105 transition-all"
                >
                  <Award className="w-4 h-4 text-black" />
                  <span>ডিজিটাল সার্টিফিকেট ডাউনলোড করুন ({overall.certificate.grade})</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* 1-Time Detailed Answer Review Notice */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-amber-300/90 font-bengali text-left flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <span>{reviewNotice}</span>
        </div>

        {/* Detailed Question Review List (Only visible if canReviewDetails is true) */}
        {canReviewDetails && detailedResults && detailedResults.length > 0 && (
          <div className="text-left space-y-4 pt-4 border-t border-slate-800">
            <h4 className="text-base font-bold text-slate-100 font-bengali flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>প্রশ্নোত্তর বিশদ পর্যালোচনা (১-বার প্রদর্শনীয়)</span>
            </h4>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 font-bengali text-xs">
              {detailedResults.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    item.isCorrect
                      ? "bg-emerald-950/20 border-emerald-500/40"
                      : item.selectedDisplayKey
                      ? "bg-red-950/20 border-red-500/40"
                      : "bg-slate-900/60 border-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-bold text-slate-100 text-sm">
                      {idx + 1}. {item.questionText}
                    </span>
                    {item.isCorrect ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1 shrink-0 text-[11px] bg-emerald-950 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> সঠিক
                      </span>
                    ) : item.selectedDisplayKey ? (
                      <span className="text-red-400 font-bold flex items-center gap-1 shrink-0 text-[11px] bg-red-950 px-2 py-0.5 rounded-full">
                        <X className="w-3 h-3" /> ভুল
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px] bg-slate-800 px-2 py-0.5 rounded-full">
                        অনুত্তরিত
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-slate-300 mt-2">
                    <p>
                      আপনার উত্তর:{" "}
                      <strong className={item.isCorrect ? "text-emerald-300" : "text-red-300"}>
                        {item.selectedOptionText ? `(${item.selectedDisplayKey}) ${item.selectedOptionText}` : "উত্তর দেননি"}
                      </strong>
                    </p>
                    {!item.isCorrect && (
                      <p>
                        সঠিক উত্তর:{" "}
                        <strong className="text-amber-300">
                          ({item.correctDisplayKey}) {item.correctOptionText}
                        </strong>
                      </p>
                    )}
                    {item.explanation && (
                      <p className="text-[11px] text-slate-400 pt-1 italic">
                        ব্যাখ্যা: {item.explanation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <a
            href="/leaderboard"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white font-bengali font-bold text-xs shadow-md hover:from-red-500 hover:to-amber-500 transition-all"
          >
            <Trophy className="w-4 h-4 text-amber-200" />
            <span>যুগ্ম লিডারবোর্ড দেখুন</span>
          </a>

          {participant.familyPackId && (
            <a
              href="/family"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bengali font-bold text-xs border border-amber-500/40 transition-all"
            >
              <span>ফ্যামিলি ড্যাশবোর্ড দেখুন</span>
            </a>
          )}

          <a
            href="/quiz"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 text-slate-200 font-bengali font-bold text-xs hover:bg-slate-700 transition-all border border-slate-700"
          >
            <span>অন্যান্য কুইজ দেখুন</span>
          </a>
        </div>
      </div>
    );
  }

  // 4. PRE-QUIZ SECURITY BRIEFING & CONSENT SCREEN (PART 6)
  if (!hasStartedExam) {
    return (
      <div className="card-devotional max-w-2xl w-full mx-auto p-6 sm:p-10 rounded-3xl border-2 border-amber-500/50 shadow-2xl space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-red-600/20 text-amber-300 mx-auto flex items-center justify-center border border-amber-500/40 mb-2">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
          </div>

          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-950/60 px-3.5 py-1 rounded-full border border-amber-500/30">
            কঠোর নিরাপত্তা ও ফেয়ার প্লে নিয়মাবলী
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-gold-gradient font-bengali">
            {eventTitle}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 font-bengali">
            প্রতিযোগী: <strong className="text-amber-200">{participant.name}</strong> ({participant.code})
          </p>
        </div>

        {/* Clear Mandatory Warning Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/90 to-amber-950/80 border-2 border-red-500/60 text-slate-100 font-bengali space-y-2">
          <div className="flex items-center gap-2 text-red-300 font-bold text-sm sm:text-base">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>কঠোর সতর্কবার্তা ও নিষেধাজ্ঞা:</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-200 font-bold leading-relaxed">
            "{activeSecurity.warningMessageBn || MANDATORY_PRE_QUIZ_WARNING_BN}"
          </p>
        </div>

        {/* Fair Play Environment Conditions */}
        <div className="space-y-3 font-bengali text-xs sm:text-sm text-slate-300">
          <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>কুইজ চলাকালীন পরিবেশের শর্তসমূহ:</span>
          </h4>
          <ul className="space-y-2 pl-2">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>র‍্যান্ডমাইজড প্রশ্ন ও অপশন:</strong> অ্যান্টি-কপি সুরক্ষায় প্রত্যেক প্রতিযোগীর প্রশ্ন ও উত্তরের বিকল্প আলাদা ক্রমে সাজানো থাকবে।</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>পূর্ণ পর্দা (Fullscreen) মোড:</strong> পরীক্ষা শুরু হলে ব্রাউজার পূর্ণ পর্দায় চালিত হবে।</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>ট্যাব ও উইন্ডো সুইচ পর্যবেক্ষণ:</strong> অন্য কোনো ট্যাব, উইন্ডো বা অ্যাপে সুইচ করলে তা চিহ্নিত হবে।</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>৩য় সতর্কতায় পরীক্ষা বাতিল:</strong> প্রথম ও দ্বিতীয়বার সতর্কবার্তা দেওয়া হবে; তৃতীয়বার বের হলে সেই দিনের পরীক্ষা বাতিল হবে।</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>টাইমার:</strong> কুইজের সময়সীমা ঠিক <strong>৬০ মিনিট</strong>। সময় শেষ হলে উত্তর স্বয়ংক্রিয়ভাবে জমা হবে।</span>
            </li>
          </ul>
        </div>

        {/* Mandatory Rules Consent Checkbox (Part 6 Requirement) */}
        <div className="p-4 rounded-2xl bg-amber-950/30 border-2 border-amber-500/50 flex items-center gap-3 cursor-pointer select-none"
             onClick={() => setRulesConsent(!rulesConsent)}>
          <input
            type="checkbox"
            id="rulesConsent"
            checked={rulesConsent}
            onChange={(e) => setRulesConsent(e.target.checked)}
            className="w-5 h-5 rounded text-amber-600 focus:ring-amber-400 cursor-pointer accent-amber-500"
          />
          <label htmlFor="rulesConsent" className="text-xs sm:text-sm font-bold text-amber-200 font-bengali cursor-pointer">
            "আমি সব নিয়ম পড়েছি ও মেনে নিচ্ছি"
          </label>
        </div>

        {/* Accept and Start Button */}
        <button
          onClick={handleStartExam}
          disabled={startingExam || !rulesConsent}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-bengali font-extrabold text-base shadow-xl shadow-red-950/60 border-2 border-amber-300/40 transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {startingExam ? (
            <span>নিরাপদ পরিবেশ তৈরি হচ্ছে...</span>
          ) : (
            <>
              <Maximize className="w-5 h-5 text-amber-200" />
              <span>কুইজ শুরু করো (৬০ মিনিট)</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    );
  }

  // 5. ACTIVE QUIZ RUNNER INTERFACE
  return (
    <div ref={containerRef} className="max-w-3xl w-full mx-auto space-y-6 select-none">
      {/* Quiz Header Bar: Title, Timer, Progress */}
      <div className="card-devotional p-4 sm:p-5 rounded-2xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-500/30">
              দিন {dayNumber} • মোট ৫০টি প্রশ্ন (৬০ মিনিট)
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SECURE RANDOMIZED
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gold-gradient font-bengali mt-1">
            {eventTitle}
          </h2>
          <p className="text-xs text-slate-300 font-bengali">
            প্রতিযোগী: <span className="text-amber-200 font-semibold">{participant.name}</span>
          </p>
        </div>

        {/* Countdown Timer Badge */}
        <div
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-mono text-sm sm:text-base font-bold shadow-md ${
            timeLeft < 300
              ? "bg-red-950/80 text-red-400 border-red-500/60 animate-pulse"
              : "bg-slate-900/90 text-amber-300 border-amber-500/40"
          }`}
          title="অবশিষ্ট সময়"
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>{formatTimer(timeLeft)}</span>
        </div>
      </div>

      {/* Progress Bar & Answered Counter */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400 font-bengali">
          <span>
            উত্তর দেওয়া হয়েছে: <strong className="text-amber-300">{answeredCount}</strong> / {questions.length}
          </span>
          <span>{progressPercent}% সমাপ্ত</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-amber-300 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Active Question Card (One question at a time) */}
      {currentQuestion && (
        <div className="card-devotional p-6 sm:p-8 rounded-3xl border-2 border-amber-500/30 shadow-2xl relative min-h-[380px] flex flex-col justify-between">
          <div>
            {/* Question Number Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/70 border border-amber-500/40 px-3 py-1 rounded-full">
                প্রশ্ন {currentQuestion.questionNumber} / {questions.length}
              </span>

              {selectedAnswers[currentQuestion.id] && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-bengali">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>উত্তর চিহ্নিত</span>
                </span>
              )}
            </div>

            {/* Question Text */}
            <h3 className="text-lg sm:text-2xl font-bold font-bengali text-slate-100 leading-relaxed mb-6">
              {currentQuestion.questionText}
            </h3>

            {/* 4 Answer Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {currentQuestion.options.map((opt) => {
                const isSelected = selectedAnswers[currentQuestion.id] === opt.optionKey;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(currentQuestion.id, opt.optionKey)}
                    className={`p-4 rounded-2xl text-left border transition-all flex items-center gap-3.5 group ${
                      isSelected
                        ? "bg-gradient-to-r from-amber-500/20 to-red-500/20 border-amber-400 shadow-lg shadow-amber-950/40"
                        : "bg-slate-900/60 border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/60"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm shrink-0 transition-colors ${
                        isSelected
                          ? "bg-amber-400 text-black shadow-md"
                          : "bg-slate-800 text-slate-300 group-hover:bg-slate-700"
                      }`}
                    >
                      {opt.optionKey}
                    </div>
                    <span
                      className={`text-sm sm:text-base font-bengali leading-snug ${
                        isSelected ? "text-amber-200 font-bold" : "text-slate-200"
                      }`}
                    >
                      {opt.optionText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Question Navigation: Prev, Skip, Next, Submit */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800/80">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bengali text-sm hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>পূর্ববর্তী</span>
            </button>

            {/* Skip Button */}
            {currentIndex < questions.length - 1 && (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="text-xs text-slate-400 hover:text-amber-300 font-bengali underline px-2 py-1"
              >
                স্কিপ করুন
              </button>
            )}

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 text-white font-bengali font-bold text-sm hover:from-amber-500 hover:to-red-500 shadow-md transition-all"
              >
                <span>পরবর্তী</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bengali font-bold text-sm hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>কুইজ জমা দিন</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Direct Submit Button Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-slate-800 text-xs">
        <span className="text-slate-400 font-bengali">
          কুইজ জমা দেওয়ার পূর্ব পর্যন্ত যেকোনো প্রশ্নের উত্তর পরিবর্তন করা যাবে।
        </span>
        <button
          onClick={() => setShowConfirmModal(true)}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 font-bengali underline"
        >
          সরাসরি জমা দিন ({answeredCount}/{questions.length})
        </button>
      </div>

      {/* Active Warning Modal (When participant switches tab or blurs window) */}
      {activeWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="card-devotional max-w-md w-full p-6 sm:p-8 rounded-3xl border-2 border-red-500 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-600/30 text-red-400 mx-auto flex items-center justify-center border-2 border-red-500/50 animate-bounce">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>

            <span className="text-xs font-bold text-red-400 uppercase tracking-widest bg-red-950/80 px-3 py-1 rounded-full border border-red-500/50">
              নিরাপত্তা সতর্কতা #{activeWarningModal.warningNumber} / {activeWarningModal.maxWarnings}
            </span>

            <h3 className="text-xl font-bold text-red-200 font-bengali">
              অনুমতিহীন ক্রিয়াকলাপ সনাক্ত হয়েছে!
            </h3>

            <p className="text-xs sm:text-sm text-slate-200 font-bengali leading-relaxed bg-black/60 p-3 rounded-xl border border-red-500/30">
              {activeWarningModal.message}
            </p>

            <div className="text-[11px] text-amber-300/90 font-bengali">
              ⚠️ মনে রাখবেন: সতর্কতা সীমা ({activeWarningModal.maxWarnings} বার) অতিক্রম করলে অথবা কুইজ থেকে বের হলে পরীক্ষা অবিলম্বে <strong>বাতিল (Disqualified)</strong> করা হবে।
            </div>

            <button
              onClick={() => {
                setActiveWarningModal(null);
                if (activeSecurity.requireFullscreen && !document.fullscreenElement && containerRef.current) {
                  containerRef.current.requestFullscreen().catch(() => {});
                }
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bengali font-bold text-sm shadow-lg transition-all"
            >
              আমি সতর্ক থাকব - কুইজে ফিরে যাও
            </button>
          </div>
        </div>
      )}

      {/* Submission Confirmation Modal (Part 6 Exact Text) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="card-devotional max-w-md w-full p-6 sm:p-8 rounded-3xl border-2 border-amber-500 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-300 mx-auto flex items-center justify-center mb-4 border border-amber-500/40">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            </div>

            <h3 className="text-xl font-bold text-gold-gradient font-bengali">
              "আপনি কি নিশ্চিত যে কুইজটি জমা দিতে চান?"
            </h3>

            <div className="my-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-300 font-bengali space-y-1.5 text-left">
              <p>
                • মোট প্রশ্ন: <strong className="text-white">{questions.length}</strong> টি
              </p>
              <p>
                • তুমি উত্তর দিয়েছ: <strong className="text-amber-300">{answeredCount}</strong> টির
              </p>
              {questions.length - answeredCount > 0 && (
                <p className="text-red-400">
                  • অনুত্তরিত প্রশ্ন: <strong>{questions.length - answeredCount}</strong> টি (অনুত্তরিত প্রশ্নে ০ নম্বর)
                </p>
              )}
              <p className="text-[11px] text-amber-400/90 pt-1 border-t border-slate-800">
                ⚠️ জমা দেওয়ার পর ২ মিনিট ফলাফল প্রক্রিয়াকরণ সময় লাগবে এবং উত্তরমালা যাচাই করা হবে।
              </p>
            </div>

            {/* Buttons strictly matching prompt: "হ্যাঁ, জমা দিন" & "না, ফিরে যান" */}
            <div className="flex gap-3 justify-center font-bengali">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all"
              >
                না, ফিরে যান
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={performSubmission}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-red-950/50 border border-amber-300/40 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "জমা হচ্ছে..." : "হ্যাঁ, জমা দিন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
