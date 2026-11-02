"use client";

import React, { useState, useEffect } from "react";
import { AdminNav } from "@/components/AdminNav";
import { 
  FileSpreadsheet, ExternalLink, RefreshCw, CheckCircle2, 
  AlertCircle, Save, Send, Download, Copy, Check, 
  ShieldCheck, Sparkles, Database, ArrowRight
} from "lucide-react";

export default function AdminSheetsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [settings, setSettings] = useState({
    webhookUrl: "",
    sheetUrl: "",
    isEnabled: true,
    syncOnRegister: true,
    syncOnSubmit: true,
    lastSyncAt: null as string | null,
    lastSyncStatus: null as string | null,
    lastError: null as string | null,
    totalSyncedRows: 0,
  });

  const [stats, setStats] = useState({
    totalParticipants: 0,
    totalAttempts: 0,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/sheets");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings({
            webhookUrl: data.settings.webhookUrl || "",
            sheetUrl: data.settings.sheetUrl || "",
            isEnabled: data.settings.isEnabled ?? true,
            syncOnRegister: data.settings.syncOnRegister ?? true,
            syncOnSubmit: data.settings.syncOnSubmit ?? true,
            lastSyncAt: data.settings.lastSyncAt,
            lastSyncStatus: data.settings.lastSyncStatus,
            lastError: data.settings.lastError,
            totalSyncedRows: data.settings.totalSyncedRows || 0,
          });
        }
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err: any) {
      console.error("Sheets load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "সেটিংস সংরক্ষণ ব্যর্থ");

      setMessage("গুগল শিট সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err: any) {
      setErrorMessage(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.webhookUrl) {
      alert("অনুগ্রহ করে প্রথমে গুগল অ্যাপস স্ক্রিপ্ট Web App URL প্রদান করুন।");
      return;
    }

    setTesting(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/sheets/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "কানেকশন টেস্ট ব্যর্থ");

      setMessage("✓ গুগল শিট কানেকশন সম্পূর্ণ সফল! গুগল শিটে টেস্ট পিং সফলভাবে পৌঁছেছে।");
      loadSettings();
    } catch (err: any) {
      setErrorMessage("কানেকশন ব্যর্থ: " + (err.message || "URL ঠিক আছে কিনা এবং Web app permission Anyone করা আছে কিনা যাচাই করুন।"));
    } finally {
      setTesting(false);
    }
  };

  const handleBulkSync = async () => {
    if (!settings.webhookUrl) {
      alert("প্রথমে গুগল শিট Web App URL সেভ করুন।");
      return;
    }

    setSyncing(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/sheets/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "সিঙ্ক করতে ব্যর্থ");

      setMessage(`✓ ${data.message}`);
      loadSettings();
    } catch (err: any) {
      setErrorMessage(err.message || "ডাটা সিঙ্ক ব্যর্থ হয়েছে");
    } finally {
      setSyncing(false);
    }
  };

  const copyScriptCode = () => {
    const code = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    setupHeaders(sheet);

    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === "TEST") {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "নকুন্ডা টেস্ট সফল!" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "REGISTER" || action === "SCORE_UPDATE") {
      upsertParticipantRow(sheet, data.row);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", updatedCode: data.row.code })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "BULK_SYNC") {
      var rows = data.rows || [];
      for (var i = 0; i < rows.length; i++) {
        upsertParticipantRow(sheet, rows[i]);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: rows.length })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "unknown_action" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function setupHeaders(sheet) {
  var headers = [
    "প্রতিযোগী কোড (Code)",
    "নাম (Name)",
    "রেজিস্ট্রেশনের সময় (Registered At)",
    "কমিটি সদস্য (Is Committee)",
    "Day 1 স্কোর (/৫০)",
    "Day 1 সময়",
    "Day 2 স্কোর (/৫০)",
    "Day 2 সময়",
    "মোট স্কোর (/১০০)",
    "মোট সময়",
    "কুইজ স্ট্যাটাস",
    "সর্বশেষ আপডেট"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#991b1b");
    headerRange.setFontColor("#fef08a");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    for (var col = 1; col <= headers.length; col++) {
      sheet.setColumnWidth(col, 160);
    }
  }
}

function upsertParticipantRow(sheet, row) {
  var values = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < values.length; i++) {
    if (values[i][0] && values[i][0].toString().trim() === row.code.toString().trim()) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowArray = [
    row.code,
    row.name,
    row.registeredAt,
    row.isCommittee,
    row.day1Score,
    row.day1Duration,
    row.day2Score,
    row.day2Duration,
    row.totalScore,
    row.totalDuration,
    row.status,
    row.lastUpdated
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowArray.length).setValues([rowArray]);
  } else {
    sheet.appendRow(rowArray);
  }
}`;

    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-12">
      <AdminNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Only Secure Integration</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gold-gradient font-bengali">
              গুগল শিট অটোমেশন ও লাইভ স্কোর সিঙ্ক
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-bengali mt-1">
              প্রতিযোগী রেজিস্ট্রেশন করলে স্বয়ংক্রিয়ভাবে নাম যুক্ত হবে এবং কুইজ জমা দিলে তাদের লাইভ স্কোর তাৎক্ষণিক গুগল শিটে সংরক্ষিত হবে।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadSettings}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white font-bengali text-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>রিফ্রেশ</span>
            </button>

            {settings.sheetUrl && (
              <a
                href={settings.sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bengali text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all hover:scale-105"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>গুগল শিট খুলুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Status Alerts */}
        {message && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-xs sm:text-sm text-emerald-300 font-bengali flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-xs sm:text-sm text-red-300 font-bengali flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-devotional p-4 rounded-xl border border-amber-500/30">
            <span className="text-xs text-slate-400 font-bengali block">মোট নিবন্ধিত প্রতিযোগী</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 mt-1 block">
              {stats.totalParticipants}
            </span>
          </div>

          <div className="card-devotional p-4 rounded-xl border border-amber-500/30">
            <span className="text-xs text-slate-400 font-bengali block">সম্পন্ন কুইজ প্রচেষ্টা</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1 block">
              {stats.totalAttempts}
            </span>
          </div>

          <div className="card-devotional p-4 rounded-xl border border-amber-500/30">
            <span className="text-xs text-slate-400 font-bengali block">গুগল শিট সিঙ্ক স্থিতি</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${settings.isEnabled ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
              <span className="text-sm sm:text-base font-bold text-slate-200 font-bengali">
                {settings.isEnabled ? (settings.webhookUrl ? "লাইভ সক্রিয়" : "URL প্রয়োজন") : "বন্ধ"}
              </span>
            </div>
          </div>

          <div className="card-devotional p-4 rounded-xl border border-amber-500/30">
            <span className="text-xs text-slate-400 font-bengali block">সর্বশেষ সিঙ্ক সময়</span>
            <span className="text-xs text-amber-200/90 font-mono mt-1 block truncate">
              {settings.lastSyncAt ? new Date(settings.lastSyncAt).toLocaleTimeString("bn-BD") : "এখনো হয়নি"}
            </span>
          </div>
        </div>

        {/* Configuration Form & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <form onSubmit={handleSave} className="lg:col-span-2 card-devotional p-6 rounded-2xl border-2 border-amber-500/40 space-y-6">
            <div className="flex items-center gap-2 text-amber-300">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold font-bengali">গুগল শিট কানেকশন সেটিংস</h2>
            </div>

            <div className="space-y-4 text-xs font-bengali">
              {/* Webhook URL Input */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  গুগল অ্যাপস স্ক্রিপ্ট Web App URL: <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={settings.webhookUrl}
                  onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-700 text-amber-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  নিচের স্ক্রিপ্টটি আপনার Google Sheet-এ Deploy করে তৈরি হওয়া Web App URL এখানে দিন।
                </p>
              </div>

              {/* Viewable Sheet Link */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  গুগল শিট ভিউ লিংক (অ্যাডমিনের জন্য সরাসরি খোলার সুবিধার্থে):
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  value={settings.sheetUrl}
                  onChange={(e) => setSettings({ ...settings, sheetUrl: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Automatic Trigger Toggles */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <span className="text-slate-200 font-bold block">স্বয়ংক্রিয় সিঙ্ক রুলস (Automated Rules):</span>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-amber-500/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.isEnabled}
                    onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <div>
                    <span className="text-slate-200 font-semibold block">গুগল শিট সিঙ্ক চালু রাখুন (Enable Master Sync)</span>
                    <span className="text-[11px] text-slate-400">বন্ধ রাখলে কোনো ডাটা গুগল শিটে পাঠানো হবে না।</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-amber-500/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.syncOnRegister}
                    onChange={(e) => setSettings({ ...settings, syncOnRegister: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <div>
                    <span className="text-slate-200 font-semibold block">নতুন প্রতিযোগী রেজিস্ট্রেশন হলেই শিটে নাম যোগ করুন</span>
                    <span className="text-[11px] text-slate-400">প্রতিযোগী নাম রেজিস্টার করলেই নতুন সারি (Row) তৈরি হবে।</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-amber-500/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.syncOnSubmit}
                    onChange={(e) => setSettings({ ...settings, syncOnSubmit: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <div>
                    <span className="text-slate-200 font-semibold block">কুইজ সাবমিট হলে লাইভ স্কোর তৎক্ষণাৎ শিটে আপডেট করুন</span>
                    <span className="text-[11px] text-slate-400">Day 1 বা Day 2 কুইজের স্কোর শেষ হওয়ার সাথে সাথে আপডেট হবে।</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-bengali font-bold text-xs shadow-lg transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "সংরক্ষণ হচ্ছে..." : "সেটিংস সংরক্ষণ করুন"}</span>
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !settings.webhookUrl}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bengali font-semibold text-xs border border-amber-500/30 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testing ? "পরীক্ষা হচ্ছে..." : "কানেকশন টেস্ট করুন"}</span>
              </button>
            </div>
          </form>

          {/* Quick Actions & Backup Panel */}
          <div className="space-y-4">
            <div className="card-devotional p-6 rounded-2xl border border-amber-500/30 space-y-4">
              <div className="flex items-center gap-2 text-amber-300">
                <Database className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-bengali">এক-ক্লিকে সিঙ্ক ও ব্যাকআপ</h3>
              </div>
              <p className="text-xs text-slate-300 font-bengali leading-relaxed">
                ওয়েবসাইটের বর্তমান সমস্ত নিবন্ধিত প্রতিযোগী ও তাদের পরীক্ষার সম্পূর্ণ স্কোর একসাথে গুগল শিটে পাঠাতে নিচের বোতামটি চাপুন:
              </p>

              <button
                onClick={handleBulkSync}
                disabled={syncing || !settings.webhookUrl}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bengali font-bold text-xs shadow-lg transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                <span>{syncing ? "সিঙ্ক হচ্ছে..." : "সব ডাটা এখনই গুগল শিটে সিঙ্ক করুন"}</span>
              </button>

              <div className="pt-3 border-t border-slate-800">
                <a
                  href="/api/admin/sheets/export"
                  download
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bengali text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>অফলাইন CSV স্প্রেডশিট ডাউনলোড</span>
                </a>
              </div>
            </div>

            {/* Admin Security Note */}
            <div className="card-devotional p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-xs font-bengali space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>অ্যাডমিন গোপনীয়তা নিরাপত্তা:</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                গুগল শিট শুধুমাত্র অ্যাডমিনের ব্যক্তিগত Google অ্যাকাউন্টে থাকবে। সাধারণ ব্যবহারকারী বা কুইজের প্রতিযোগী কেউই এই শিট দেখতে বা অ্যাক্সেস করতে পারবে না।
              </p>
            </div>
          </div>
        </div>

        {/* 1-Click Google Apps Script Setup Guide */}
        <div className="card-devotional p-6 rounded-2xl border-2 border-emerald-500/40 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-emerald-300">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold font-bengali">
                গুগল শিট সেটআপ গাইড (মাত্র ১ মিনিটের সহজ প্রক্রিয়া)
              </h2>
            </div>

            <button
              onClick={copyScriptCode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bengali text-xs font-bold transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-900" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "কোড কপি হয়েছে!" : "১-ক্লিকে কোড কপি করুন"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-bengali">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="font-bold text-amber-300">ধাপ ১: শিট খুলুন</span>
              <p className="text-slate-400 text-[11px]">
                <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-400 underline">sheets.new</a> লিংকে গিয়ে একটি নতুন Google Sheet খুলুন।
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="font-bold text-amber-300">ধাপ ২: স্ক্রিপ্ট ওপেন করুন</span>
              <p className="text-slate-400 text-[11px]">
                শিটের মেনু থেকে <strong>Extensions &gt; Apps Script</strong>-এ ক্লিক করুন।
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="font-bold text-amber-300">ধাপ ৩: কোড পেস্ট করুন</span>
              <p className="text-slate-400 text-[11px]">
                উপরের <strong>"কোড কপি করুন"</strong> বোতামে চাপ দিয়ে পাওয়া কোডটি পেস্ট করে Save করুন।
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="font-bold text-amber-300">ধাপ ৪: Deploy Web App</span>
              <p className="text-slate-400 text-[11px]">
                Deploy &gt; New deployment &gt; Type: <strong>Web app</strong> &gt; Access: <strong>Anyone</strong> দিয়ে URL কপি করে উপরে পেস্ট করুন।
              </p>
            </div>
          </div>

          {/* Script Code View Box */}
          <div className="relative">
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-56 border border-slate-800">
              {`// Google Apps Script for Auto-Syncing Participants & Live Scores
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  setupHeaders(sheet);
  var data = JSON.parse(e.postData.contents);
  if (data.action === "REGISTER" || data.action === "SCORE_UPDATE") {
    upsertParticipantRow(sheet, data.row);
  } else if (data.action === "BULK_SYNC") {
    for (var i = 0; i < data.rows.length; i++) {
      upsertParticipantRow(sheet, data.rows[i]);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
