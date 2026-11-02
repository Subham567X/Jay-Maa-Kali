"use client";

import React, { useState, useEffect } from "react";
import { AdminNav } from "@/components/AdminNav";
import { Users, Shield, Plus, Edit, Check, X, Search, ShieldAlert, CheckCircle2, Trash2 } from "lucide-react";

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [committeeMembers, setCommitteeMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // New committee member modal / state
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAliases, setNewMemberAliases] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [partsRes, commRes] = await Promise.all([
        fetch("/api/admin/participants"),
        fetch("/api/admin/committee"),
      ]);

      if (partsRes.ok) {
        const pData = await partsRes.json();
        setParticipants(pData.participants || []);
      }
      if (commRes.ok) {
        const cData = await commRes.json();
        setCommitteeMembers(cData.members || []);
      }
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle participant committee manual override
  const toggleParticipantCommittee = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/participants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          isCommittee: !currentStatus,
          committeeMatchReason: !currentStatus
            ? "Manually flagged by Admin review"
            : "Manually approved by Admin review",
        }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      alert("আপডেট ব্যর্থ");
    }
  };

  const handleDeleteParticipant = async (id: string, name: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে প্রতিযোগী "${name}" এবং তার সমস্ত ফলাফল মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/participants?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadData();
      } else {
        alert("মুছে ফেলতে ব্যর্থ হয়েছে");
      }
    } catch (err) {
      alert("সার্ভার ত্রুটি");
    }
  };

  const handleAddCommitteeMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    try {
      const res = await fetch("/api/admin/committee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMemberName.trim(),
          aliases: newMemberAliases.split(",").map((s) => s.trim()),
        }),
      });

      if (res.ok) {
        setShowAddMember(false);
        setNewMemberName("");
        setNewMemberAliases("");
        loadData();
      }
    } catch (err) {
      alert("সদস্য যোগ করতে ব্যর্থ");
    }
  };

  const filteredParticipants = participants.filter((p) => {
    const s = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) ||
      p.code.toLowerCase().includes(s) ||
      (p.normalizedName && p.normalizedName.includes(s))
    );
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-12">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Committee Members Registry Section */}
        <div className="card-devotional p-6 rounded-2xl border border-amber-500/30">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-bold text-gold-gradient font-bengali">
                  নকুন্ডা পূজা কমিটি সদস্য ও অ্যালিয়াস তালিকা
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-bengali mt-0.5">
                এই সদস্যরা কুইজে অংশ নিতে পারেন কিন্তু নিয়ম অনুযায়ী বিজয়ী সার্টিফিকেট পাবেন না।
              </p>
            </div>

            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bengali text-xs font-bold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>কমিটি সদস্য যোগ করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {committeeMembers.map((member) => {
              let aliases: string[] = [];
              try {
                aliases = JSON.parse(member.aliases || "[]");
              } catch {
                aliases = [member.aliases];
              }
              return (
                <div
                  key={member.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-amber-200 font-bengali">{member.name}</h3>
                    <span className="text-[10px] bg-red-950/70 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full">
                      সার্টিফিকেট বর্জন
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <strong className="text-slate-300">স্বীকৃত অ্যালিয়াস:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {aliases.map((al, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300"
                        >
                          {al}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Participants Table Section */}
        <div className="card-devotional rounded-2xl border border-amber-500/30 overflow-hidden">
          <div className="p-5 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-bengali flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>নিবন্ধিত প্রতিযোগীদের তালিকা ({filteredParticipants.length})</span>
              </h2>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="নাম বা কোড খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 focus:outline-none font-bengali"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-bengali text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">কোড</th>
                  <th className="py-3 px-4">নাম</th>
                  <th className="py-3 px-4 text-center">Day 1 স্কোর</th>
                  <th className="py-3 px-4 text-center">Day 2 স্কোর</th>
                  <th className="py-3 px-4 text-center">মিলিত স্কোর</th>
                  <th className="py-3 px-4 text-center">কমিটি স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredParticipants.map((p) => {
                  const day1 = p.attempts?.find((a: any) => a.quizEvent?.dayNumber === 1);
                  const day2 = p.attempts?.find((a: any) => a.quizEvent?.dayNumber === 2);
                  const day1Score = day1?.isInvalidated ? "বাতিল" : day1?.isCompleted ? day1.score : "-";
                  const day2Score = day2?.isInvalidated ? "বাতিল" : day2?.isCompleted ? day2.score : "-";
                  const combined =
                    (typeof day1Score === "number" ? day1Score : 0) +
                    (typeof day2Score === "number" ? day2Score : 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-300">{p.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-100">{p.name}</td>
                      <td className="py-3 px-4 text-center font-mono">
                        {day1?.isInvalidated ? (
                          <span className="text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded text-[10px]">
                            বাতিল ✕
                          </span>
                        ) : typeof day1Score === "number" ? (
                          `${day1Score} / 50`
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {day2?.isInvalidated ? (
                          <span className="text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded text-[10px]">
                            বাতিল ✕
                          </span>
                        ) : typeof day2Score === "number" ? (
                          `${day2Score} / 50`
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-400 text-sm">
                        {combined} / 100
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.isCommittee ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-red-950/80 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full">
                            <ShieldAlert className="w-3 h-3 text-red-400" />
                            কমিটি (বর্জিত)
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            সাধারণ প্রতিযোগী ✓
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => toggleParticipantCommittee(p.id, p.isCommittee)}
                            className="text-[11px] text-amber-400 hover:text-amber-300 underline"
                            title="কমিটি স্ট্যাটাস টগল করুন"
                          >
                            {p.isCommittee ? "সাধারণ করুন" : "কমিটি করুন"}
                          </button>
                          <span className="text-slate-600">|</span>
                          <button
                            onClick={() => handleDeleteParticipant(p.id, p.name)}
                            className="text-[11px] text-red-400 hover:text-red-300 inline-flex items-center gap-1 hover:underline"
                            title="প্রতিযোগী মুছে ফেলুন"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>মুছুন</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Committee Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="card-devotional max-w-md w-full p-6 sm:p-8 rounded-3xl border-2 border-amber-500 shadow-2xl relative">
            <h3 className="text-xl font-bold text-gold-gradient font-bengali mb-4">
              নতুন কমিটি সদস্য যোগ করুন
            </h3>
            <form onSubmit={handleAddCommitteeMember} className="space-y-4 font-bengali text-xs">
              <div>
                <label className="block text-slate-300 mb-1">সদস্যের নাম:</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: দেব গোপাল ঘোষ"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">
                  স্বীকৃত অ্যালিয়াস (কমা দিয়ে পৃথক করুন):
                </label>
                <textarea
                  rows={3}
                  placeholder="Dev Gopal Ghosh, Deb Gopal, দেবগোপাল ঘোষ"
                  value={newMemberAliases}
                  onChange={(e) => setNewMemberAliases(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white font-bold shadow-md"
                >
                  সদস্য যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
