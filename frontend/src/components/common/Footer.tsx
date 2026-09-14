"use client";

import React from "react";
import Link from "next/link";
import { useUIStore } from "@/store/uiStore";
import { translations } from "@/lib/translations";
import { ShieldCheck, FileSpreadsheet, Lock } from "lucide-react";

export function Footer() {
  const { locale } = useUIStore();
  const t = translations[locale];

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & trust */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-navy-800 dark:bg-blue-600 flex items-center justify-center text-white">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-slate-900 dark:text-white">
                {t.nav.brand}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Enterprise financial document extraction engine. Eliminates manual spreadsheet entry with deterministic mathematical audits and sub-second OCR parsing.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> SOC2 Ready
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Lock className="w-3.5 h-3.5" /> 256-bit Presigned Encryption
              </span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/app/workspace" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  {t.nav.workspace}
                </Link>
              </li>
              <li>
                <Link href="/app/dashboard" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  {t.nav.dashboard}
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  {t.nav.pricing}
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  {t.nav.faq}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Compliance & Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Compliance & Security
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>Auto-Delete Raw PDF Mode</li>
              <li>Zero Data Retention Policy</li>
              <li>ZATCA & ETA VAT Compliance</li>
              <li>Stripe PCI-DSS Certified</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <div>© {new Date().getFullYear()} DocuLedger AI Inc. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">Security Portal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
