"use client";

import React, { useState } from "react";
import { useUIStore } from "@/store/uiStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { translations } from "@/lib/translations";
import { PdfViewer } from "@/components/workspace/PdfViewer";
import { DataGrid } from "@/components/workspace/DataGrid";
import { FileText, Table } from "lucide-react";

export function SplitScreen() {
  const { locale } = useUIStore();
  const t = translations[locale].workspace.splitScreen;

  const { invoice } = useWorkspaceStore();

  // Mobile view tab state: 'pdf' | 'table'
  const [activeMobileTab, setActiveMobileTab] = useState<"pdf" | "table">("table");

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-170px)] min-h-[600px] overflow-hidden">
      {/* Mobile Tab Switcher (Visible on mobile/tablet < md screens) */}
      <div className="md:hidden flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 gap-2 shadow-xs">
        <button
          onClick={() => setActiveMobileTab("pdf")}
          className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeMobileTab === "pdf"
              ? "bg-navy-800 dark:bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{t.tabPdf}</span>
        </button>

        <button
          onClick={() => setActiveMobileTab("table")}
          className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeMobileTab === "table"
              ? "bg-navy-800 dark:bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>{t.tabTable}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            activeMobileTab === "table"
              ? "bg-white/20 text-white"
              : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
          }`}>
            {invoice.lineItems.length}
          </span>
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        {/* Left Column: 50% width on desktop */}
        <div
          className={`w-full md:w-1/2 h-full ${
            activeMobileTab === "pdf" ? "flex flex-col" : "hidden md:flex flex-col"
          }`}
        >
          <PdfViewer />
        </div>

        {/* Right Column: 50% width on desktop */}
        <div
          className={`w-full md:w-1/2 h-full ${
            activeMobileTab === "table" ? "flex flex-col" : "hidden md:flex flex-col"
          }`}
        >
          <DataGrid />
        </div>
      </div>
    </div>
  );
}
