"use client";

import React from "react";
import { useUIStore } from "@/store/uiStore";
import { translations } from "@/lib/translations";
import { Quote } from "lucide-react";

export function Testimonials() {
  const { locale } = useUIStore();
  const t = translations[locale].testimonials;

  return (
    <section className="py-16 md:py-24 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.items.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div className="mb-4">
                <Quote className="w-6 h-6 text-navy-800/30 dark:text-blue-400/30 mb-3" />
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  {item.author}
                </div>
                <div className="text-[11px] text-slate-500">
                  {item.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
