"use client";

import React, { useState } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { useUIStore } from "@/store/uiStore";
import { translations } from "@/lib/translations";
import {
  Building2,
  Key,
  Check,
  Copy,
  Lock,
} from "lucide-react";

export function OrganizationSettings() {
  const {
    orgName,
    setOrgName,
    apiKey,
    autoDeleteRawPdf,
    setAutoDeleteRawPdf,
  } = useDashboardStore();

  const { locale } = useUIStore();
  const t = translations[locale].dashboard.settings;

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.title}
          </h3>
          <p className="text-xs text-slate-500">
            Tenant isolation, compliance policies, and API keys
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Org Name */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            {t.orgName}
          </label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full sm:w-96 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-navy-800 dark:focus:border-blue-500"
          />
        </div>

        {/* API Key */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            {t.apiKey}
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 sm:w-96 flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-600 dark:text-slate-300 font-mono text-xs">
              <Key className="w-3.5 h-3.5 text-slate-400 me-2" />
              <span>{apiKey}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyKey}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Auto-Delete Raw PDF Toggle (Privacy Setting) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                <Lock className="w-3.5 h-3.5 text-navy-800 dark:text-blue-400" />
                <span>{t.autoDeleteTitle}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-navy-800 dark:text-blue-300 font-bold">
                  GDPR &amp; SOC2
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {t.autoDeleteDesc}
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={autoDeleteRawPdf}
                onChange={(e) => setAutoDeleteRawPdf(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-800 dark:peer-checked:bg-blue-600" />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-navy-800 hover:bg-navy-900 text-white font-semibold text-xs shadow-sm transition-all"
          >
            {t.saveBtn}
          </button>
          {saved && (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> Settings saved successfully
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
