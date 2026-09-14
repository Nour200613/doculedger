"use client";

import React, { useRef } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useUIStore } from "@/store/uiStore";
import { translations } from "@/lib/translations";
import { exportToExcel, exportToCSV } from "@/lib/exportUtils";
import {
  FileText,
  FileSpreadsheet,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";

export function WorkspaceHeader() {
  const { locale } = useUIStore();
  const { invoice, resetInvoice, loadNewInvoice } = useWorkspaceStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[locale].workspace;

  const handleExportXlsx = () => {
    exportToExcel(invoice);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.15 },
    });
  };

  const handleExportCsv = () => {
    exportToCSV(invoice);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate loading the user's custom PDF document into the workspace
    loadNewInvoice({
      ...invoice,
      id: `inv-${Date.now()}`,
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Document info */}
        <div className="flex items-center gap-3">
          <Link
            href="/app/dashboard"
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>

          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 border border-red-200 dark:border-red-900">
            <FileText className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {invoice.fileName}
              </h1>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                {invoice.fileSize}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
              <span>{invoice.vendorName}</span>
              <span>•</span>
              <span className="font-mono">{invoice.invoiceNumber}</span>
              <span>•</span>
              <span className="text-slate-400">{invoice.uploadedAt}</span>
            </div>
          </div>
        </div>

        {/* Center: Audit Badges & Confidence Meter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Math Audit Status */}
          {invoice.mathAuditPassed ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.documentMeta.verified}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.documentMeta.discrepancy}</span>
            </div>
          )}

          {/* Overall Confidence Meter */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500">{t.documentMeta.confidence}:</span>
            <span className="font-mono font-bold text-navy-800 dark:text-blue-400">
              {Math.round(invoice.overallConfidence * 100)}%
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            title={t.uploadNew}
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{t.uploadNew}</span>
          </button>

          <button
            onClick={resetInvoice}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title={t.table.actions.resetData}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExportCsv}
            className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportXlsx}
            className="px-3.5 py-1.5 rounded-md bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.table.actions.exportXlsx}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
