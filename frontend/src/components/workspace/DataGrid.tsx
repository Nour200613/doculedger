"use client";

import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useUIStore } from "@/store/uiStore";
import { translations } from "@/lib/translations";
import { LineItem } from "@/types";
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
} from "lucide-react";

export function DataGrid() {
  const { locale } = useUIStore();
  const {
    invoice,
    updateLineItem,
    addLineItem,
    deleteLineItem,
    setHighlightedBoundingBox,
  } = useWorkspaceStore();

  const t = translations[locale].workspace.table;

  // Editing state tracker: { rowId, field }
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof LineItem } | null>(null);

  const columns = useMemo<ColumnDef<LineItem>[]>(
    () => [
      {
        accessorKey: "itemDescription",
        header: () => <span>{t.columns.item}</span>,
        cell: ({ row }) => {
          const item = row.original;
          const isEditing = editingCell?.id === item.id && editingCell?.field === "itemDescription";
          const confidence = item.confidenceScores.itemDescription;
          const isLowConfidence = confidence < 0.85;

          return (
            <div
              onMouseEnter={() =>
                setHighlightedBoundingBox(
                  item.boundingBoxes.itemDescription || null,
                  `${item.id}-itemDescription`
                )
              }
              onMouseLeave={() => setHighlightedBoundingBox(null)}
              onClick={() => setEditingCell({ id: item.id, field: "itemDescription" })}
              className={`p-2 rounded cursor-pointer transition-all flex items-center justify-between group ${
                isLowConfidence
                  ? "bg-amber-100/70 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {isEditing ? (
                <input
                  type="text"
                  autoFocus
                  defaultValue={item.itemDescription}
                  onBlur={(e) => {
                    updateLineItem(item.id, "itemDescription", e.target.value);
                    setEditingCell(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateLineItem(item.id, "itemDescription", (e.target as HTMLInputElement).value);
                      setEditingCell(null);
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-blue-500 rounded px-1.5 py-0.5 text-xs focus:outline-none"
                />
              ) : (
                <div className="flex items-center gap-2 truncate">
                  {isLowConfidence && (
                    <span
                      title={t.lowConfidenceTooltip}
                      className="inline-flex items-center text-amber-600 dark:text-amber-400 flex-shrink-0"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <span className="font-medium truncate">{item.itemDescription}</span>
                  <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: () => <div className="text-center">{t.columns.qty}</div>,
        cell: ({ row }) => {
          const item = row.original;
          const isEditing = editingCell?.id === item.id && editingCell?.field === "quantity";
          const confidence = item.confidenceScores.quantity;
          const isLowConfidence = confidence < 0.85;

          return (
            <div
              onMouseEnter={() =>
                setHighlightedBoundingBox(
                  item.boundingBoxes.quantity || null,
                  `${item.id}-quantity`
                )
              }
              onMouseLeave={() => setHighlightedBoundingBox(null)}
              onClick={() => setEditingCell({ id: item.id, field: "quantity" })}
              className={`p-2 rounded text-center cursor-pointer font-mono transition-all ${
                isLowConfidence
                  ? "bg-amber-100/70 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {isEditing ? (
                <input
                  type="number"
                  autoFocus
                  defaultValue={item.quantity}
                  onBlur={(e) => {
                    updateLineItem(item.id, "quantity", Number(e.target.value) || 1);
                    setEditingCell(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateLineItem(item.id, "quantity", Number((e.target as HTMLInputElement).value) || 1);
                      setEditingCell(null);
                    }
                  }}
                  className="w-16 mx-auto text-center bg-white dark:bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-xs focus:outline-none"
                />
              ) : (
                <span>{item.quantity}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "unitPrice",
        header: () => <div className="text-end">{t.columns.unitPrice}</div>,
        cell: ({ row }) => {
          const item = row.original;
          const isEditing = editingCell?.id === item.id && editingCell?.field === "unitPrice";
          const confidence = item.confidenceScores.unitPrice;
          const isLowConfidence = confidence < 0.85;

          return (
            <div
              onMouseEnter={() =>
                setHighlightedBoundingBox(
                  item.boundingBoxes.unitPrice || null,
                  `${item.id}-unitPrice`
                )
              }
              onMouseLeave={() => setHighlightedBoundingBox(null)}
              onClick={() => setEditingCell({ id: item.id, field: "unitPrice" })}
              className={`p-2 rounded text-end cursor-pointer font-mono transition-all group ${
                isLowConfidence
                  ? "bg-amber-100/70 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  defaultValue={item.unitPrice}
                  onBlur={(e) => {
                    updateLineItem(item.id, "unitPrice", parseFloat(e.target.value) || 0);
                    setEditingCell(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateLineItem(item.id, "unitPrice", parseFloat((e.target as HTMLInputElement).value) || 0);
                      setEditingCell(null);
                    }
                  }}
                  className="w-24 ms-auto text-end bg-white dark:bg-slate-900 border border-blue-500 rounded px-1.5 py-0.5 text-xs focus:outline-none"
                />
              ) : (
                <div className="flex items-center justify-end gap-1.5">
                  {isLowConfidence && (
                    <span
                      title={t.lowConfidenceTooltip}
                      className="inline-flex items-center text-amber-600 dark:text-amber-400"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <span>${item.unitPrice.toFixed(2)}</span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "taxRate",
        header: () => <div className="text-center">{t.columns.taxRate}</div>,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div
              onMouseEnter={() =>
                setHighlightedBoundingBox(
                  item.boundingBoxes.taxRate || null,
                  `${item.id}-taxRate`
                )
              }
              onMouseLeave={() => setHighlightedBoundingBox(null)}
              className="p-2 text-center font-mono text-slate-500 text-xs"
            >
              {(item.taxRate * 100).toFixed(0)}%
            </div>
          );
        },
      },
      {
        accessorKey: "total",
        header: () => <div className="text-end">{t.columns.total}</div>,
        cell: ({ row }) => {
          const item = row.original;
          const isLowConfidence = item.confidenceScores.total < 0.85;

          return (
            <div
              onMouseEnter={() =>
                setHighlightedBoundingBox(
                  item.boundingBoxes.total || null,
                  `${item.id}-total`
                )
              }
              onMouseLeave={() => setHighlightedBoundingBox(null)}
              className={`p-2 text-end font-mono font-bold transition-all ${
                isLowConfidence
                  ? "bg-amber-100/70 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              <div className="flex items-center justify-end gap-1">
                {isLowConfidence && (
                  <span
                    title={t.lowConfidenceTooltip}
                    className="inline-flex items-center text-amber-600 dark:text-amber-400"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </span>
                )}
                <span>${item.total.toFixed(2)}</span>
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center"></div>,
        cell: ({ row }) => (
          <div className="text-center p-2">
            <button
              onClick={() => deleteLineItem(row.original.id)}
              className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Delete row"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [editingCell, t, updateLineItem, deleteLineItem, setHighlightedBoundingBox]
  );

  const table = useReactTable({
    data: invoice.lineItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 text-xs select-none">
      {/* Table Helper Notification */}
      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between text-slate-500 text-[11px]">
        <span className="flex items-center gap-1.5">
          <Edit2 className="w-3.5 h-3.5 text-navy-800 dark:text-blue-400" />
          {t.inlineEditingHint}
        </span>
        <button
          onClick={addLineItem}
          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-navy-800 dark:text-blue-400" />
          <span>{t.actions.addRow}</span>
        </button>
      </div>

      {/* Main Table Scroll Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-start">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800/90 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="py-2.5 px-3">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-1">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mathematical Reconciliation Summary Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
        {/* Math Audit Status Banner */}
        <div
          className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
            invoice.mathAuditPassed
              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300"
              : "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {invoice.mathAuditPassed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
            <span>
              {invoice.mathAuditPassed
                ? t.summary.mathMatch
                : t.summary.mathMismatch}
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>
              {t.summary.statedTotal}{" "}
              <strong className="underline">${invoice.totalAmount.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Calculated Breakdown */}
        <div className="flex flex-wrap justify-between items-center text-xs text-slate-600 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-6">
            <div>
              <span>{t.summary.subtotal} </span>
              <strong className="font-mono text-slate-900 dark:text-white">
                ${invoice.subtotal.toFixed(2)}
              </strong>
            </div>
            <div>
              <span>{t.summary.vat} </span>
              <strong className="font-mono text-slate-900 dark:text-white">
                ${invoice.vatTotal.toFixed(2)}
              </strong>
            </div>
          </div>

          <div className="text-end">
            <span className="text-slate-500 font-medium">
              {t.summary.grandTotal}{" "}
            </span>
            <span className="text-base font-extrabold font-mono text-navy-800 dark:text-blue-400">
              ${invoice.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
