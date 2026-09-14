"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { translations } from "@/lib/translations";
import { exportToExcel, exportToCSV } from "@/lib/exportUtils";
import {
  Search,
  FileSpreadsheet,
  FileText,
  Moon,
  Sun,
  Globe,
  LayoutDashboard,
  Layers,
  ZoomIn,
  X,
} from "lucide-react";

export function CommandPalette() {
  const router = useRouter();
  const { locale, toggleLocale, theme, toggleTheme, commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const { invoice, setZoom } = useWorkspaceStore();
  const t = translations[locale].commandPalette;

  const [search, setSearch] = useState("");

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === "Escape" && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const handleAction = (callback: () => void) => {
    callback();
    setCommandPaletteOpen(false);
    setSearch("");
  };

  const actionItems = [
    {
      id: "workspace",
      icon: <Layers className="w-4 h-4 text-navy-700 dark:text-blue-400" />,
      title: t.openWorkspace,
      category: t.groups.navigation,
      onSelect: () => router.push("/app/workspace"),
    },
    {
      id: "dashboard",
      icon: <LayoutDashboard className="w-4 h-4 text-navy-700 dark:text-blue-400" />,
      title: t.openDashboard,
      category: t.groups.navigation,
      onSelect: () => router.push("/app/dashboard"),
    },
    {
      id: "export-xlsx",
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      title: t.exportExcel,
      category: t.groups.actions,
      onSelect: () => exportToExcel(invoice),
    },
    {
      id: "export-csv",
      icon: <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      title: t.exportCsv,
      category: t.groups.actions,
      onSelect: () => exportToCSV(invoice),
    },
    {
      id: "reset-zoom",
      icon: <ZoomIn className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      title: t.resetZoom,
      category: t.groups.actions,
      onSelect: () => setZoom(1.0),
    },
    {
      id: "toggle-theme",
      icon:
        theme === "light" ? (
          <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
        ) : (
          <Sun className="w-4 h-4 text-amber-400" />
        ),
      title: t.toggleTheme,
      category: t.groups.preferences,
      onSelect: () => toggleTheme(),
    },
    {
      id: "switch-lang",
      icon: <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
      title: t.switchLang,
      category: t.groups.preferences,
      onSelect: () => toggleLocale(),
    },
  ];

  const filteredItems = actionItems.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={t.placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/40">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No matching commands found.
            </div>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleAction(item.onSelect)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-start text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 group-hover:bg-white dark:group-hover:bg-slate-700">
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.title}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {item.category}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Navigate with shortcuts</span>
          <div className="flex items-center gap-2">
            <span className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              ESC
            </span>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
