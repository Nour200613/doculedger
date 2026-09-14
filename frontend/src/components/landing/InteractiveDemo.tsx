"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useUIStore } from "@/store/uiStore";
import { translations } from "@/lib/translations";
import { sampleInvoice } from "@/lib/mockData";
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export function InteractiveDemo() {
  const { locale } = useUIStore();
  const t = translations[locale].demo;

  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

  const handleSimulateExtraction = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setHasProcessed(true);
    }, 900);
  };

  return (
    <section id="demo" className="py-16 md:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 mb-3 border border-blue-200 dark:border-blue-900">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Sandbox</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {t.subtitle}
          </p>
        </div>

        {/* Demo Box Container */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono text-slate-500 ms-3">
                sample_b2b_invoice_preview.pdf
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSimulateExtraction}
                disabled={isProcessing}
                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t.loadSample}
              </button>

              <Link
                href="/app/workspace"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-navy-800 hover:bg-navy-900 text-white transition-colors"
              >
                <span>{t.openInWorkspace}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Interactive Area */}
          {!hasProcessed && !isProcessing && (
            <div
              onClick={handleSimulateExtraction}
              className="p-12 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 m-6 rounded-xl hover:border-navy-700 dark:hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 cursor-pointer transition-all group"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-navy-800 dark:group-hover:text-blue-400 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                {t.dropzoneTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                {t.dropzoneHint}
              </p>
              <button className="text-xs font-semibold px-4 py-2 rounded-md bg-navy-800 text-white shadow-sm">
                {t.loadSample}
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="p-20 text-center">
              <div className="w-10 h-10 border-3 border-navy-800 dark:border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t.processing}
              </p>
            </div>
          )}

          {hasProcessed && !isProcessing && (
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Visual Document Preview with active Bounding Box */}
              <div className="lg:col-span-5 bg-slate-100 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 relative select-none">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Source Document Canvas</span>
                  <span className="text-navy-800 dark:text-blue-400">Page 1 of 1</span>
                </div>

                {/* Simulated Invoice Canvas Sheet */}
                <div className="relative bg-white dark:bg-slate-950 rounded-lg p-5 aspect-[1/1.3] shadow-sm border border-slate-200 dark:border-slate-800 text-[10px] text-slate-700 dark:text-slate-300 overflow-hidden">
                  <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">Apex Cloud Infrastructure</div>
                      <div className="text-slate-400">VAT: EG-304-981-220</div>
                    </div>
                    <div className="text-end">
                      <div className="font-semibold text-slate-900 dark:text-white">INV-2026-9810</div>
                      <div className="text-slate-400">Date: 2026-09-01</div>
                    </div>
                  </div>

                  {/* Document lines with coordinate overlay */}
                  <div className="space-y-3 pt-2">
                    {sampleInvoice.lineItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`p-1.5 rounded transition-all flex items-center justify-between ${
                          hoveredRowIndex === idx
                            ? "ring-2 ring-blue-600 bg-blue-50/80 dark:bg-blue-950/60"
                            : "bg-slate-50/70 dark:bg-slate-900/50"
                        }`}
                      >
                        <span className="truncate max-w-[140px]">{item.itemDescription}</span>
                        <span className="font-mono font-semibold">${item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Summary on invoice */}
                  <div className="absolute bottom-4 right-4 left-4 border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Total Due (14% VAT):</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">$5,928.00</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Extracted Table with Hover Bounding Box Event & Warnings */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {t.successTitle}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {t.successHint}
                    </span>
                  </div>

                  {/* Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-start">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2 px-3 text-start font-semibold">Description</th>
                          <th className="py-2 px-2 text-center font-semibold">Qty</th>
                          <th className="py-2 px-2 text-end font-semibold">Unit Price</th>
                          <th className="py-2 px-3 text-end font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {sampleInvoice.lineItems.map((item, idx) => {
                          const isLowConfidence = item.confidenceScores.unitPrice < 0.85;
                          return (
                            <tr
                              key={item.id}
                              onMouseEnter={() => setHoveredRowIndex(idx)}
                              onMouseLeave={() => setHoveredRowIndex(null)}
                              className={`cursor-pointer transition-colors ${
                                hoveredRowIndex === idx
                                  ? "bg-blue-50/70 dark:bg-blue-950/40"
                                  : isLowConfidence
                                  ? "bg-amber-50/70 dark:bg-amber-950/30"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-900/60"
                              }`}
                            >
                              <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                                <div className="flex items-center gap-1.5">
                                  {isLowConfidence && (
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                  )}
                                  <span className="truncate max-w-[220px]">{item.itemDescription}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono text-slate-600 dark:text-slate-400">
                                {item.quantity}
                              </td>
                              <td className="py-2.5 px-2 text-end font-mono text-slate-600 dark:text-slate-400">
                                ${item.unitPrice.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-end font-mono font-semibold text-slate-900 dark:text-white">
                                ${item.total.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Math check note */}
                  <div className="mt-3 p-2.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Math Check: Sum of items + 14% VAT matches $5,928.00 exactly.
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-4">
                  <span className="text-xs text-slate-500">
                    Ready to export or edit inline?
                  </span>
                  <Link
                    href="/app/workspace"
                    className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-md bg-navy-800 hover:bg-navy-900 text-white shadow-sm"
                  >
                    <span>{t.openInWorkspace}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
