"use client";

import React, { useState, useEffect } from "react";
import { AdminNav } from "@/components/AdminNav";
import { History, ShieldCheck, RefreshCw } from "lucide-react";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-12">
      <AdminNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gold-gradient font-bengali">
              প্রশাসনিক অডিট ট্রেইল ও লগ রেকর্ড
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-bengali mt-0.5">
              কুইজের স্বচ্ছতা ও নিরপেক্ষতা রক্ষায় প্রতিটি প্রশাসনিক পদক্ষেপের অপরিবর্তনীয় রেকর্ড।
            </p>
          </div>

          <button
            onClick={loadLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-300 font-bengali hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>রিফ্রেশ</span>
          </button>
        </div>

        <div className="card-devotional rounded-2xl border border-amber-500/30 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">সময় ও তারিখ</th>
                  <th className="py-3 px-4">অ্যাডমিন</th>
                  <th className="py-3 px-4">কার্যকলাপ (Action)</th>
                  <th className="py-3 px-4">বিভাগ (Target)</th>
                  <th className="py-3 px-4">বিস্তারিত তথ্য (Details)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {logs.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-bengali">
                      কোনো অডিট রেকর্ড এখনও নেই
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    let formattedDetails = log.detailsJson;
                    try {
                      formattedDetails = JSON.stringify(JSON.parse(log.detailsJson));
                    } catch {}

                    return (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                          {new Date(log.createdAt).toLocaleString("bn-IN")}
                        </td>
                        <td className="py-3 px-4 text-amber-300 font-bold">{log.adminUsername}</td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] text-amber-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{log.targetType}</td>
                        <td className="py-3 px-4 text-slate-400 max-w-xs truncate text-[11px]">
                          {formattedDetails || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
