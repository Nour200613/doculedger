"use client";

import React, { useState } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useUIStore } from "@/store/uiStore";
import { translations } from "@/lib/translations";
import { Sparkles, ArrowRight, Check, SlidersHorizontal } from "lucide-react";

export function CommandBar() {
  const { locale } = useUIStore();
  const {
    naturalLanguagePrompt,
    setPrompt,
    applyPreset,
    appliedPreset,
  } = useWorkspaceStore();

  const t = translations[locale].workspace.commandBar;

  const [inputVal, setInputVal] = useState(naturalLanguagePrompt);
  const [isApplying, setIsApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;

    setIsApplying(true);
    setPrompt(inputVal);

    setTimeout(() => {
      setIsApplying(false);
      setSuccessMessage(
        locale === "ar"
          ? "تم تطبيق قواعد التنسيق الرياضية بنجاح على الجدول"
          : "Formatting rules and extraction schema applied successfully"
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    }, 400);
  };

  const handlePresetClick = (key: string, text: string) => {
    setInputVal(text);
    applyPreset(key);
    setSuccessMessage(
      locale === "ar"
        ? `تم تطبيق الإعداد المسبق: ${text}`
        : `Preset applied: ${text}`
    );
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const presets = [
    { key: "vat14", label: t.presets.vat14 },
    { key: "itemsTotal", label: t.presets.itemsTotal },
    { key: "dateFormat", label: t.presets.dateFormat },
    { key: "normalizeCurrency", label: t.presets.normalizeCurrency },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6 shadow-sm">
      <div className="max-w-7xl mx-auto space-y-2.5">
        {/* Top input bar */}
        <form onSubmit={handleApply} className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute start-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-navy-800 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={t.placeholder}
              className="w-full ps-9 pe-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-navy-800 dark:focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isApplying || !inputVal.trim()}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-navy-800 hover:bg-navy-900 disabled:opacity-50 text-white shadow-sm flex items-center gap-1.5 transition-all flex-shrink-0"
          >
            <span>{isApplying ? "..." : t.applyBtn}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </form>

        {/* 1-Click Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1 text-[11px]">
            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            {t.presetsLabel}
          </span>

          {presets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => handlePresetClick(preset.key, preset.label)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                appliedPreset === preset.key
                  ? "bg-blue-50 dark:bg-blue-950 border-navy-800 dark:border-blue-500 text-navy-800 dark:text-blue-300 font-semibold"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {preset.label}
            </button>
          ))}

          {successMessage && (
            <span className="ms-auto text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              {successMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
