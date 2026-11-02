"use client";

import React, { useState, useEffect } from "react";
import Link from "next/navigation";
import { usePathname } from "next/navigation";
import { 
  Menu, X, Sparkles, Video, Music, BookOpen, 
  HelpCircle, Trophy, Award, Heart, Users 
} from "lucide-react";
import { DiyaFlame } from "./DiyaFlame";

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [participant, setParticipant] = useState<{ name: string; code: string } | null>(null);

  useEffect(() => {
    // Check participant session in browser
    fetch("/api/participant/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.participant) {
          setParticipant(data.participant);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const navItems = [
    { name: "স্বাগতম", href: "/", icon: Sparkles },
    { name: "মায়ের ভিডিও", href: "/blessings", icon: Video },
    { name: "ভক্তিগীতি", href: "/music", icon: Music },
    { name: "অডিওবুক", href: "/audiobook", icon: BookOpen },
    { name: "কুইজ উৎসব", href: "/quiz", icon: HelpCircle },
    { name: "ফ্যামিলি প্যাক", href: "/family", icon: Users },
    { name: "লিডারবোর্ড", href: "/leaderboard", icon: Trophy },
    { name: "সার্টিফিকেট", href: "/certificate", icon: Award },
    { name: "প্রণাম", href: "/pranam", icon: Heart },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#05060f]/90 border-b border-amber-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Diya */}
          <a href="/" className="flex items-center gap-3 group">
            <DiyaFlame size="sm" interactive={false} />
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold tracking-wide text-gold-gradient font-bengali">
                মায়ের আশীর্বাদ
              </span>
              <span className="text-[10px] text-amber-300/80 tracking-wider uppercase font-sans">
                Nakunda Kali Puja 2026
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                      : "text-slate-300 hover:text-amber-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber-400/80" />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Participant Badge & Admin Access */}
          <div className="hidden sm:flex items-center gap-2">
            {participant ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/40 border border-amber-500/30 rounded-full text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-amber-200 font-medium truncate max-w-[120px]">
                  {participant.name}
                </span>
                <span className="text-[10px] font-mono text-amber-400/70 bg-amber-900/50 px-1.5 py-0.5 rounded">
                  {participant.code}
                </span>
              </div>
            ) : (
              <a
                href="/quiz"
                className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-amber-600 text-white font-medium hover:from-red-500 hover:to-amber-500 transition-all shadow-md shadow-red-950/40"
              >
                কুইজে অংশ নাও
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800/60 focus:outline-none"
              aria-label="মেনু খুলুন"
            >
              {isOpen ? <X className="w-6 h-6 text-amber-400" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden bg-[#090b1c]/95 border-b border-amber-500/30 backdrop-blur-xl px-4 pt-3 pb-6 animate-fadeIn">
          {participant && (
            <div className="mb-4 p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-400 font-medium">নিবন্ধিত প্রতিযোগী</p>
                <p className="text-sm font-bold text-amber-200">{participant.name}</p>
              </div>
              <span className="text-xs font-mono bg-amber-900/60 text-amber-300 px-2 py-1 rounded">
                {participant.code}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-amber-200"
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber-400" />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center text-xs text-slate-500 font-bengali">
            <span>নকুন্ডা সর্বজনীন কালীপূজা ২০২৬ • মায়ের আশীর্বাদ</span>
          </div>
        </div>
      )}
    </header>
  );
}
