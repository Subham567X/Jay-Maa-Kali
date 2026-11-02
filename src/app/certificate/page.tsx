"use client";

import React, { useState, useEffect } from "react";
import { CertificateRenderer } from "@/components/CertificateRenderer";
import { DiyaFlame } from "@/components/DiyaFlame";
import { Award, Trophy, ArrowRight, ShieldCheck, Download, Users, Lock } from "lucide-react";

export default function CertificatePage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/certificate/my")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error("Certificate fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
        <DiyaFlame size="lg" />
        <p className="mt-4 text-amber-300 font-bengali text-base animate-pulse">
          সম্মাননা শংসাপত্র লোড হচ্ছে...
        </p>
      </div>
    );
  }

  // 1. Family Member who is NOT head
  if (data?.canAccess === false) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 max-w-xl mx-auto flex flex-col items-center justify-center text-center font-bengali">
        <div className="card-devotional p-8 rounded-3xl border border-amber-500/40 w-full space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-950 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/40">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-amber-200">
            পরিবার প্রধানের সংরক্ষিত অনুমতি
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {data.message ||
              "ফ্যামিলি প্যাকের নিয়ম অনুযায়ী শুধুমাত্র পরিবার প্রধান (Family Head) সার্টিফিকেট দেখতে ও ডাউনলোড করতে পারেন।"}
          </p>
          <div className="pt-2">
            <a
              href="/family"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs"
            >
              ফ্যামিলি ড্যাশবোর্ডে ফিরে যান
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col items-center">
      {/* Heading */}
      <div className="text-center mb-8 max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-2">
          <DiyaFlame size="sm" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest bg-amber-950/40 px-3 py-1 rounded-full border border-amber-500/30">
            নকুন্ডা মেধা সম্মাননা ২০২৬
          </span>
          <DiyaFlame size="sm" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-gold-gradient font-bengali py-1">
          {data?.isFamily ? "পারিবারিক ও ব্যক্তিগত সম্মাননা" : "ডিজিটাল সম্মাননা শংসাপত্র"}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 font-bengali mt-2">
          কালীপূজা ও ভাইফোঁটা কুইজে কৃতী অংশগ্রহণকারী ও পরিবারের ডিজিটাল শংসাপত্র।
        </p>
      </div>

      {/* 2. FAMILY HEAD VIEW: SHOW FAMILY ACHIEVEMENT CERTIFICATE + MEMBER CERTIFICATES */}
      {data?.isFamily && data?.isFamilyHead ? (
        <div className="w-full space-y-8">
          {data.familyCertificate ? (
            <div className="space-y-4 text-center">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-widest bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/40 font-bengali">
                পারিবারিক বিশেষ সম্মাননা সার্টিফিকেট
              </span>
              <CertificateRenderer certificate={data.familyCertificate} />
            </div>
          ) : (
            <div className="card-devotional p-6 rounded-3xl border border-amber-500/30 text-center font-bengali text-xs text-slate-300">
              পরিবারের সকল সদস্য কুইজ সম্পন্ন করে ৪০% নম্বর পূর্ণ করলে এখানে ফ্যামিলি সার্টিফিকেট আনলক হবে।
            </div>
          )}

          {/* Member Individual Certificates (Family Head Downloads) */}
          <div className="card-devotional p-6 rounded-3xl border border-amber-500/30">
            <h3 className="text-base font-bold text-slate-100 font-bengali mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span>পরিবারের সদস্যদের ব্যক্তিগত সার্টিফিকেট ({data.memberCertificates?.length || 0})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-bengali text-xs">
              {data.memberCertificates?.map((m: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-100">{m.memberName}</p>
                    <p className="text-[11px] text-slate-400">
                      {m.isHead ? "পরিবার প্রধান" : "সদস্য"}
                    </p>
                  </div>

                  {m.certificate ? (
                    <a
                      href={`/api/certificate/download?code=${m.certificate.certificateCode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-[11px] flex items-center gap-1 shadow hover:scale-105 transition-all"
                    >
                      <Download className="w-3 h-3 text-black" />
                      <span>ডাউনলোড ({m.certificate.grade})</span>
                    </a>
                  ) : (
                    <span className="text-slate-500 text-[11px]">সার্টিফিকেট অনুপলব্ধ</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : data?.certificate ? (
        // 3. INDIVIDUAL PARTICIPANT CERTIFICATE
        <CertificateRenderer certificate={data.certificate} />
      ) : (
        // 4. NOT ELIGIBLE / NOT GENERATED YET
        <div className="card-devotional max-w-xl w-full p-8 rounded-3xl border border-amber-500/40 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-300 mx-auto flex items-center justify-center border border-amber-500/40">
            <Award className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-bold text-gold-gradient font-bengali">
            সার্টিফিকেট স্থিতি
          </h3>

          <p className="text-sm text-slate-300 font-bengali leading-relaxed">
            {data?.error ||
              "দুঃখিত! এবারের প্রতিযোগিতায় তুমি সার্টিফিকেট অর্জনের নির্ধারিত যোগ্যতা পূরণ করতে পারোনি। মন খারাপ কোরো না। আগামী বছর আবার নতুন উদ্যমে চেষ্টা করবে। তোমার জন্য রইল মায়ের আশীর্বাদ। ❤️"}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center font-bengali">
            <a
              href="/quiz"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs shadow-md hover:from-red-500 hover:to-amber-500 transition-all"
            >
              কুইজে অংশগ্রহণ করো
            </a>

            <a
              href="/leaderboard"
              className="px-6 py-3 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700 transition-all border border-slate-700"
            >
              বর্তমান লিডারবোর্ড দেখুন
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
