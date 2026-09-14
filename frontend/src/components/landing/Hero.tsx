"use client";

import React from "react";
import Link from "next/link";
import { useUIStore } from "@/store/uiStore";
import { translations } from "@/lib/translations";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  FileCheck2,
} from "lucide-react";

export function Hero() {
  const { locale } = useUIStore();
  const t = translations[locale].hero;

  return (
    <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
      {/* Subtle corporate grid background (No AI slop gradients) */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Subtle trust chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-navy-50 dark:bg-navy-950/80 text-navy-800 dark:text-blue-300 border border-navy-200/80 dark:border-navy-800 mb-6 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-navy-800 dark:text-blue-400" />
          <span>{t.tag}</span>
        </div>

        {/* 1-Line Value Proposition */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-6">
          {t.headline}
        </h1>

        {/* Subheading */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-10 leading-relaxed">
          {t.subheadline}
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
          <Link
            href="/app/workspace"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold bg-navy-800 hover:bg-navy-900 text-white shadow-md hover:shadow-lg transition-all"
          >
            <span>{t.ctaPrimary}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>

          <a
            href="#demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{t.ctaSecondary}</span>
          </a>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-slate-200/80 dark:border-slate-800/80 max-w-3xl mx-auto text-start">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
            <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">99.8%</div>
              <div className="text-xs text-slate-500">{t.stats.accuracy}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
            <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">&lt; 1.2s</div>
              <div className="text-xs text-slate-500">{t.stats.processingTime}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
            <div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">20+ Hrs</div>
              <div className="text-xs text-slate-500">{t.stats.savedHours}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
