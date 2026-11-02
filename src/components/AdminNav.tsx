"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, HelpCircle, Film, Users, 
  Trophy, History, LogOut, ExternalLink, Shield, ShieldAlert,
  FileSpreadsheet
} from "lucide-react";

interface AdminNavProps {
  adminName?: string;
}

export function AdminNav({ adminName = "অ্যাডমিন" }: AdminNavProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/admin";
    } catch {}
  };

  const navLinks = [
    { name: "ওভারভিউ", href: "/admin", icon: LayoutDashboard },
    { name: "কুইজ প্রশ্নাবলী", href: "/admin/quiz", icon: HelpCircle },
    { name: "কুইজ নিরাপত্তা", href: "/admin/security", icon: ShieldAlert },
    { name: "মিডিয়া ফাইল", href: "/admin/media", icon: Film },
    { name: "প্রতিযোগী ও কমিটি", href: "/admin/participants", icon: Users },
    { name: "গুগল শিট সিঙ্ক", href: "/admin/sheets", icon: FileSpreadsheet },
    { name: "বিজয়ী ও সার্টিফিকেট", href: "/admin/winner", icon: Trophy },
    { name: "অডিট লগ", href: "/admin/audit", icon: History },
  ];

  return (
    <div className="w-full bg-[#0a0c20] border-b border-amber-500/20 px-4 py-3 mb-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600/30 text-amber-300 flex items-center justify-center border border-amber-500/40">
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-300 font-bengali">
              নকুন্ডা কালীপূজা অ্যাডমিন প্যানেল
            </h2>
            <p className="text-[11px] text-slate-400 font-sans">
              Logged in as: <strong className="text-slate-200">{adminName}</strong>
            </p>
          </div>
        </div>

        {/* Tab links */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bengali">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isActive
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-amber-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </a>
            );
          })}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-amber-300 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">মূল ওয়েবসাইট</span>
          </a>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-300 bg-red-950/40 border border-red-500/30 rounded-lg hover:bg-red-900/50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট</span>
          </button>
        </div>
      </div>
    </div>
  );
}
