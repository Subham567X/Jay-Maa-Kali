"use client";

import React, { useState } from "react";
import {
  User,
  Users,
  Phone,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Check,
  Plus,
  Trash2,
  LogIn,
  AlertTriangle,
  Lock,
} from "lucide-react";

interface ParticipantModalProps {
  isOpen: boolean;
  onSuccess: (participant: any) => void;
  onClose?: () => void;
}

export function ParticipantRegisterModal({ isOpen, onSuccess, onClose }: ParticipantModalProps) {
  // Mode: "INDIVIDUAL" | "FAMILY_REGISTER" | "FAMILY_JOIN" | "RETURNING_CODE"
  const [activeTab, setActiveTab] = useState<
    "INDIVIDUAL" | "FAMILY_REGISTER" | "FAMILY_JOIN" | "RETURNING_CODE"
  >("INDIVIDUAL");

  // Individual Form State
  const [indivName, setIndivName] = useState("");
  const [indivMobile, setIndivMobile] = useState("");

  // Confirmation Modal for Account Change
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmWarningMsg, setConfirmWarningMsg] = useState("");

  // Family Register Form State (5 to 10 members)
  const [familyHeadName, setFamilyHeadName] = useState("");
  const [familyMobile, setFamilyMobile] = useState("");
  // Additional 4 members minimum to start (Total 5)
  const [familyMembers, setFamilyMembers] = useState<string[]>(["", "", "", ""]);

  // Family Join Form State (separate phone device access)
  const [joinMemberName, setJoinMemberName] = useState("");
  const [joinMobile, setJoinMobile] = useState("");
  const [joinFamilyId, setJoinFamilyId] = useState("");

  // Legacy Code Return
  const [legacyCode, setLegacyCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Add / remove member fields for family pack (5 to 10 total members)
  const handleAddMember = () => {
    if (familyMembers.length + 1 >= 10) return; // 1 head + 9 members = 10
    setFamilyMembers([...familyMembers, ""]);
  };

  const handleRemoveMember = (idx: number) => {
    if (familyMembers.length <= 4) return; // Minimum 4 additional + 1 head = 5
    const updated = familyMembers.filter((_, i) => i !== idx);
    setFamilyMembers(updated);
  };

  const handleMemberChange = (idx: number, val: string) => {
    const updated = [...familyMembers];
    updated[idx] = val;
    setFamilyMembers(updated);
  };

  // 1. Submit Individual Registration
  const handleIndividualSubmit = async (confirmAccountChange: boolean = false) => {
    setError(null);
    if (!indivName.trim()) {
      setError("আপনার পূর্ণ নাম প্রদান করুন");
      return;
    }
    const cleanPhone = indivMobile.replace(/[\s\-+]/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("সঠিক ১০-সংখ্যার ভারতীয় মোবাইল নম্বর লিখুন (উদাঃ 9876543210)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/participant/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: indivName.trim(),
          mobileNumber: cleanPhone,
          confirmAccountChange,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "নিবন্ধন ব্যর্থ হয়েছে");
      }

      // Check if confirmation modal required
      if (data.requiresConfirmation) {
        setConfirmWarningMsg(data.warningMessage);
        setShowConfirmModal(true);
        setLoading(false);
        return;
      }

      setShowConfirmModal(false);

      if (data.token) {
        localStorage.setItem("nakunda_participant_token", data.token);
        localStorage.setItem("nakunda_participant_data", JSON.stringify(data.participant));
      }

      onSuccess(data.participant);
    } catch (err: any) {
      setError(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Family Pack Registration
  const handleFamilyRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!familyHeadName.trim()) {
      setError("পরিবার প্রধানের (Family Head) নাম প্রদান করুন");
      return;
    }

    const cleanPhone = familyMobile.replace(/[\s\-+]/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("পরিবার প্রধানের সঠিক ১০-সংখ্যার মোবাইল নম্বর লিখুন");
      return;
    }

    const filteredMembers = familyMembers.map((m) => m.trim()).filter((m) => m.length > 0);
    const totalCount = 1 + filteredMembers.length;

    if (totalCount < 5) {
      setError("ফ্যামিলি প্যাকে সর্বনিম্ন ৫ জন সদস্য থাকা আবশ্যক (প্রধান সহ)");
      return;
    }
    if (totalCount > 10) {
      setError("ফ্যামিলি প্যাকে সর্বোচ্চ ১০ জন সদস্য রাখা যাবে");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/family/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyHeadName: familyHeadName.trim(),
          mobileNumber: cleanPhone,
          memberNames: filteredMembers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ফ্যামিলি প্যাক নিবন্ধন ব্যর্থ হয়েছে");
      }

      if (data.token) {
        localStorage.setItem("nakunda_participant_token", data.token);
        localStorage.setItem("nakunda_participant_data", JSON.stringify(data.headMember));
      }

      onSuccess(data.headMember);
    } catch (err: any) {
      setError(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Family Join from Separate Device
  const handleFamilyJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!joinMemberName.trim()) {
      setError("আপনার নিবন্ধিত নাম লিখুন");
      return;
    }

    const cleanPhone = joinMobile.replace(/[\s\-+]/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("পরিবার প্রধানের সঠিক ১০-সংখ্যার মোবাইল নম্বর লিখুন");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/family/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberName: joinMemberName.trim(),
          mobileNumber: cleanPhone,
          familyId: joinFamilyId.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ফ্যামিলি প্যাকে যোগ দিতে ব্যর্থ হয়েছে");
      }

      if (data.token) {
        localStorage.setItem("nakunda_participant_token", data.token);
        localStorage.setItem("nakunda_participant_data", JSON.stringify(data.member));
      }

      onSuccess(data.member);
    } catch (err: any) {
      setError(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit Legacy Code
  const handleLegacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!legacyCode.trim()) {
      setError("প্রতিযোগী কোড লিখুন (উদাঃ MK-2026-XXXX)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/participant/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: legacyCode.trim().toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "প্রবেশ ব্যর্থ হয়েছে");
      }

      if (data.token) {
        localStorage.setItem("nakunda_participant_token", data.token);
        localStorage.setItem("nakunda_participant_data", JSON.stringify(data.participant));
      }

      onSuccess(data.participant);
    } catch (err: any) {
      setError(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="card-devotional max-w-xl w-full p-6 sm:p-8 rounded-3xl border-2 border-amber-500/50 shadow-2xl relative my-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 mx-auto flex items-center justify-center mb-3 border border-amber-500/40">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold text-gold-gradient font-bengali">
            কুইজে অংশগ্রহণের নিবন্ধন
          </h3>
          <p className="text-xs text-slate-300 font-bengali mt-1">
            মায়ের আশীর্বাদ – নকুন্ডা কালীপূজা ও ভাইফোঁটা বিশেষ কুইজ ২০২৬
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 mb-6 font-bengali text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("INDIVIDUAL");
              setError(null);
            }}
            className={`py-2 px-2 rounded-lg transition-all text-center ${
              activeTab === "INDIVIDUAL"
                ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            একক কুইজ
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("FAMILY_REGISTER");
              setError(null);
            }}
            className={`py-2 px-2 rounded-lg transition-all text-center ${
              activeTab === "FAMILY_REGISTER"
                ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ফ্যামিলি প্যাক
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("FAMILY_JOIN");
              setError(null);
            }}
            className={`py-2 px-2 rounded-lg transition-all text-center ${
              activeTab === "FAMILY_JOIN"
                ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            পরিবারে যোগ
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("RETURNING_CODE");
              setError(null);
            }}
            className={`py-2 px-2 rounded-lg transition-all text-center ${
              activeTab === "RETURNING_CODE"
                ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            কোড লগইন
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 flex items-start gap-2.5 text-red-200 text-xs font-bengali">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: INDIVIDUAL PARTICIPATION */}
        {activeTab === "INDIVIDUAL" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleIndividualSubmit(false);
            }}
            className="space-y-4 font-bengali"
          >
            <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-xs text-slate-300">
              💡 একক কুইজে নিজের নাম ও ১০ সংখ্যার মোবাইল নম্বর দিয়ে অংশগ্রহণ করুন। সার্টিফিকেট অর্জনের জন্য উভয় কুইজে সর্বনিম্ন ২০ ও মোট ৪০ নম্বর পেতে হবে।
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                আপনার পূর্ণ নাম <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="যেমন: অনির্বাণ চক্রবর্তী"
                  value={indivName}
                  onChange={(e) => setIndivName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ১০-সংখ্যার ভারতীয় মোবাইল নম্বর <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="যেমন: 9876543210"
                  value={indivMobile}
                  onChange={(e) => setIndivMobile(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                OTP-এর প্রয়োজন নেই। আপনার প্রোফাইল ও সার্টিফিকেট সংরক্ষণের জন্য মোবাইল নম্বর ব্যবহৃত হবে।
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-red-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? "যাচাই করা হচ্ছে..." : "একক কুইজ শুরু করুন"}</span>
            </button>
          </form>
        )}

        {/* TAB 2: FAMILY PACK REGISTRATION (5-10 MEMBERS) */}
        {activeTab === "FAMILY_REGISTER" && (
          <form onSubmit={handleFamilyRegisterSubmit} className="space-y-4 font-bengali">
            <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-xs text-amber-200">
              👨‍👩‍👧‍👦 <strong>ফ্যামিলি প্যাক নিয়মাবলী:</strong> পরিবারের ৫ থেকে ১০ জন সদস্য একসঙ্গে নাম নথিভুক্ত করুন। পরিবার প্রধানের মোবাইল নম্বরের অধীনে প্রত্যেকে আলাদা ফোনে অংশ নিতে পারবেন। নিবন্ধনের পর সদস্য তালিকা স্থায়ীভাবে <strong>লক</strong> হয়ে যাবে।
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                পরিবার প্রধানের নাম (Family Head) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="পরিবার প্রধানের নাম লিখুন"
                  value={familyHeadName}
                  onChange={(e) => setFamilyHeadName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-slate-100 text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                পরিবার প্রধানের ১০-সংখ্যার মোবাইল নম্বর <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="যেমন: 9832100000"
                  value={familyMobile}
                  onChange={(e) => setFamilyMobile(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-slate-100 text-sm font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                এই মোবাইল নম্বর ব্যবহার করে পরিবারের অন্য সদস্যরা নিজেদের ডিভাইস থেকে লগইন করবেন।
              </p>
            </div>

            {/* Additional Members List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  পরিবারের অন্যান্য সদস্যবৃন্দ ({1 + familyMembers.length} / ১০ জন)
                </label>
                {familyMembers.length + 1 < 10 && (
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>সদস্য যোগ করুন</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {familyMembers.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500 w-6 text-right">
                      #{idx + 2}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder={`সদস্য ${idx + 2} এর পূর্ণ নাম`}
                      value={member}
                      onChange={(e) => handleMemberChange(idx, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
                    />
                    {familyMembers.length > 4 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(idx)}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                        title="সদস্য সরান"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-red-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? "নিবন্ধন হচ্ছে..." : "ফ্যামিলি প্যাক রেজিস্টার ও লক করুন"}</span>
            </button>
          </form>
        )}

        {/* TAB 3: JOIN EXISTING FAMILY PACK (SEPARATE DEVICE ACCESS) */}
        {activeTab === "FAMILY_JOIN" && (
          <form onSubmit={handleFamilyJoinSubmit} className="space-y-4 font-bengali">
            <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-xs text-slate-300">
              📱 আপনি যদি কোনো ফ্যামিলি প্যাকের নিবন্ধিত সদস্য হন, তবে আপনার নিজস্ব ফোন থেকে এখানে নাম ও পরিবার প্রধানের মোবাইল নম্বর দিয়ে কুইজে প্রবেশ করুন।
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                আপনার নিবন্ধিত নাম <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="ফ্যামিলি প্যাকে নিবন্ধিত আপনার হুবহু নাম লিখুন"
                  value={joinMemberName}
                  onChange={(e) => setJoinMemberName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                পরিবার প্রধানের (Family Head) মোবাইল নম্বর <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="পরিবার প্রধানের ১০-সংখ্যার মোবাইল নম্বর"
                  value={joinMobile}
                  onChange={(e) => setJoinMobile(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ফ্যামিলি আইডি (ঐচ্ছিক)
              </label>
              <input
                type="text"
                placeholder="যেমন: FAM-2026-XXXX"
                value={joinFamilyId}
                onChange={(e) => setJoinFamilyId(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-red-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? "যাচাই করা হচ্ছে..." : "পরিবারে যোগ দিন ও কুইজ দিন"}</span>
            </button>
          </form>
        )}

        {/* TAB 4: RETURNING BY CODE */}
        {activeTab === "RETURNING_CODE" && (
          <form onSubmit={handleLegacySubmit} className="space-y-4 font-bengali">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                আপনার প্রতিযোগী কোড <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: MK-2026-4821"
                value={legacyCode}
                onChange={(e) => setLegacyCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono focus:border-amber-400 focus:outline-none uppercase"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-red-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? "যাচাই হচ্ছে..." : "কোড দিয়ে প্রবেশ করুন"}</span>
            </button>
          </form>
        )}

        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-3 py-2 text-xs text-slate-400 hover:text-slate-200 font-bengali"
          >
            বাতিল করুন
          </button>
        )}

        {/* ACCOUNT CHANGE WARNING CONFIRMATION MODAL (PART 3) */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="card-devotional max-w-md w-full p-6 sm:p-7 rounded-3xl border-2 border-red-500 shadow-2xl relative text-center">
              <div className="w-14 h-14 rounded-full bg-red-950/80 text-red-400 mx-auto flex items-center justify-center mb-3 border border-red-500/50">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <h4 className="text-xl font-bold text-red-300 font-bengali mb-2">
                সতর্কবার্তা!
              </h4>

              <p className="text-sm text-slate-200 font-bengali leading-relaxed mb-6">
                {confirmWarningMsg ||
                  "সতর্কবার্তা! আপনার নাম বা মোবাইল নম্বর পরিবর্তন করলে আগের কুইজের স্কোর ও অংশগ্রহণের সমস্ত রেকর্ড মুছে যাবে। আপনি কি নিশ্চিত?"}
              </p>

              <div className="flex gap-3 justify-center font-bengali">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all"
                >
                  না, ফিরে যাব
                </button>
                <button
                  type="button"
                  onClick={() => handleIndividualSubmit(true)}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-lg shadow-red-950 disabled:opacity-50"
                >
                  {loading ? "প্রক্রিয়াকরণ..." : "হ্যাঁ, পরিবর্তন করব"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
