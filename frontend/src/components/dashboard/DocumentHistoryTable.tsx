"use client";

import React from "react";
import Link from "next/link";
import { useDashboardStore } from "@/store/dashboardStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useUIStore } from "@/store/uiStore";
import { translations } from "@/lib/translations";
import { exportToExcel } from "@/lib/exportUtils";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Trash2,
} from "lucide-react";

export function DocumentHistoryTable() {
  const {
    documents,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    deleteDocument,
  } = useDashboardStore();

  const { invoice } = useWorkspaceStore();
  const { locale } = useUIStore();
  const t = translations[locale].dashboard.history;

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && doc.status === statusFilter;
  });

  const handleDownloadExcel = (docName: string) => {
    exportToExcel(invoice, `${docName.replace(/\.[^/.]+$/, "")}_archive.xlsx`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-5">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.title}
          </h3>
          <p className="text-xs text-slate-500">
            {filteredDocs.length} documents archived
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="ps-8 pe-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-navy-800 dark:focus:border-blue-500 w-48 sm:w-64"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {t.filterAll}
            </button>
            <button
              onClick={() => setStatusFilter("verified")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                statusFilter === "verified"
                  ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {t.filterVerified}
            </button>
            <button
              onClick={() => setStatusFilter("warning")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                statusFilter === "warning"
                  ? "bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {t.filterWarning}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto text-xs">
        <table className="w-full text-start">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3 text-start">{t.columns.file}</th>
              <th className="py-2.5 px-3 text-start">{t.columns.vendor}</th>
              <th className="py-2.5 px-3 text-start">{t.columns.date}</th>
              <th className="py-2.5 px-3 text-end">{t.columns.total}</th>
              <th className="py-2.5 px-3 text-center">{t.columns.confidence}</th>
              <th className="py-2.5 px-3 text-center">{t.columns.status}</th>
              <th className="py-2.5 px-3 text-end">{t.columns.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No documents found matching the filter criteria.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {doc.fileName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {doc.fileSize}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {doc.vendorName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {doc.invoiceNumber}
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                    {doc.invoiceDate}
                  </td>

                  <td className="py-3 px-3 text-end font-mono font-bold text-slate-900 dark:text-white">
                    ${doc.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3 px-3 text-center font-mono text-[11px]">
                    <span
                      className={`font-semibold ${
                        doc.confidenceScore >= 0.85
                          ? "text-navy-800 dark:text-blue-400"
                          : "text-amber-600"
                      }`}
                    >
                      {Math.round(doc.confidenceScore * 100)}%
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    {doc.status === "verified" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                        <AlertTriangle className="w-3 h-3" />
                        Review
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href="/app/workspace"
                        className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-navy-800 dark:hover:text-blue-400 transition-colors"
                        title={t.openWorkspace}
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleDownloadExcel(doc.fileName)}
                        className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors"
                        title={t.redownload}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
