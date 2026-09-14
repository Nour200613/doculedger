"use client";

import React, { useRef } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useUIStore } from "@/store/uiStore";
import { translations } from "@/lib/translations";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

export function PdfViewer() {
  const { locale } = useUIStore();
  const {
    invoice,
    highlightedBoundingBox,
    zoom,
    setZoom,
    page,
    totalPages,
    setPage,
    rotation,
    setRotation,
  } = useWorkspaceStore();

  const t = translations[locale].workspace.pdfViewer;
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.7));
  const handleResetZoom = () => setZoom(1.0);
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div className="h-full flex flex-col bg-slate-200/70 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 select-none overflow-hidden">
      {/* Top Toolbar */}
      <div className="px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs flex-shrink-0">
        {/* Page Nav */}
        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
          <span className="font-mono text-[11px] px-1">
            {t.page} {page} {t.of} {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={t.zoomOut}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-slate-500 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={t.zoomIn}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={t.zoomReset}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleRotate}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={t.rotate}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hover Info Banner */}
      <div className="px-3 py-1 bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-300 flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <Eye className="w-3.5 h-3.5 text-navy-800 dark:text-blue-400 flex-shrink-0" />
          <span className="truncate">{t.hoverHint}</span>
        </div>
        {highlightedBoundingBox && (
          <span className="font-semibold text-navy-800 dark:text-blue-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 animate-pulse text-[10px] flex-shrink-0">
            {highlightedBoundingBox.label || t.highlightActive}
          </span>
        )}
      </div>

      {/* Main Canvas Container with Pan & Zoom */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center cursor-grab active:cursor-grabbing"
      >
        <div
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
          }}
          className="relative bg-white text-slate-900 w-[600px] min-h-[850px] rounded-lg shadow-xl border border-slate-300 dark:border-slate-700 p-8 text-xs font-sans select-text"
        >
          {/* Document Header Section */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6">
            <div>
              <div className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                {invoice.vendorName}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Tax ID: {invoice.vendorVatId} | Cairo Digital Park, Tower B
              </div>
              <div className="text-[11px] text-slate-500">
                finance@apex-cloud.io | +20 (2) 2849-0192
              </div>
            </div>

            <div className="text-end">
              <div className="text-sm font-black uppercase text-navy-900 tracking-wider">
                TAX INVOICE
              </div>
              <div className="font-mono font-bold text-xs mt-1">
                {invoice.invoiceNumber}
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                Date: <span className="font-mono">{invoice.invoiceDate}</span>
              </div>
              <div className="text-[11px] text-slate-600">
                Due: <span className="font-mono">{invoice.dueDate}</span>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-6 p-3 rounded bg-slate-50 border border-slate-200 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Billed To:
            </span>
            <div className="font-bold text-slate-900 mt-0.5">
              Vance &amp; Cole Financial Advisors LLP
            </div>
            <div className="text-slate-500 text-[11px]">
              100 Wall Street, Suite 1400, Financial District
            </div>
          </div>

          {/* Line Items Table Canvas */}
          <div className="border border-slate-300 rounded overflow-hidden mb-6">
            <table className="w-full text-[11px]">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 text-start">Description</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-end">Unit Price</th>
                  <th className="py-2.5 px-2 text-center">VAT</th>
                  <th className="py-2.5 px-3 text-end">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-900">
                      {item.itemDescription}
                    </td>
                    <td className="py-3 px-2 text-center font-mono">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-end font-mono">
                      ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-slate-500">
                      {(item.taxRate * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-3 text-end font-mono font-bold text-slate-900">
                      ${item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation & Summary Footer */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Value Added Tax (14%):</span>
                <span className="font-mono">${invoice.vatTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 border-t-2 border-slate-900 pt-2">
                <span>Total Due ({invoice.currency}):</span>
                <span className="font-mono">${invoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Bank details */}
          <div className="absolute bottom-8 left-8 right-8 border-t border-slate-200 pt-4 text-[10px] text-slate-400 flex justify-between">
            <div>Bank: Commercial International Bank (CIB) | IBAN: EG380010000293810293810</div>
            <div>Computer Generated Invoice • Authenticated</div>
          </div>

          {/* ========================================================= */}
          {/* DYNAMIC BOUNDING BOX OVERLAY LAYER (Hover Synchronized) */}
          {/* ========================================================= */}
          {highlightedBoundingBox && (
            <div
              style={{
                left: `${highlightedBoundingBox.x}%`,
                top: `${highlightedBoundingBox.y}%`,
                width: `${highlightedBoundingBox.width}%`,
                height: `${highlightedBoundingBox.height}%`,
              }}
              className="absolute pointer-events-none rounded transition-all duration-150 border-2 border-blue-600 bg-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.4)] z-30"
            >
              <div className="absolute -top-6 start-0 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                {highlightedBoundingBox.label || "Source Match"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
