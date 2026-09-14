"use client";

import React, { useRef, useState } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { useUIStore } from "@/store/uiStore";
import { translations } from "@/lib/translations";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  Loader2,
  Layers,
} from "lucide-react";

export function BatchUploadZone() {
  const { batchQueue, addBatchFiles } = useDashboardStore();
  const { locale } = useUIStore();
  const t = translations[locale].dashboard.batch;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    addBatchFiles(fileArray);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.title}
            </h3>
            <p className="text-xs text-slate-500">{t.subtitle}</p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-900">
          Max 50 files / batch
        </span>
      </div>

      {/* Drag & Drop Input Zone */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        multiple
        accept=".pdf"
        className="hidden"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
          isDragging
            ? "border-navy-800 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500"
            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-950/40"
        }`}
      >
        <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {t.dragDrop}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">{t.limits}</div>
      </div>

      {/* Batch Processing Queue */}
      {batchQueue.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t.queueTitle} ({batchQueue.length})
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {batchQueue.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.size}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {item.status === "completed" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                      <CheckCircle2 className="w-3 h-3" />
                      {t.statusDone}
                    </span>
                  )}

                  {item.status === "processing" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {t.statusProcessing}
                    </span>
                  )}

                  {item.status === "queued" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3" />
                      {t.statusQueued}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
