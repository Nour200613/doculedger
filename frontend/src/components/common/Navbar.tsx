"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { translations } from "@/lib/translations";
import {
  FileSpreadsheet,
  Moon,
  Sun,
  Globe,
  Command,
  LayoutDashboard,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { locale, toggleLocale, theme, toggleTheme, setCommandPaletteOpen } = useUIStore();
  const t = translations[locale];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-navy-800 dark:bg-blue-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                {t.nav.brand}
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                {t.nav.badge}
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link
              href="/app/workspace"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                pathname.includes("workspace")
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-navy-800 dark:text-blue-400" />
                {t.nav.workspace}
              </span>
            </Link>

            <Link
              href="/app/dashboard"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                pathname.includes("dashboard")
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <LayoutDashboard className="w-4 h-4 text-navy-800 dark:text-blue-400" />
                {t.nav.dashboard}
              </span>
            </Link>

            <Link
              href="/#pricing"
              className="px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {t.nav.pricing}
            </Link>

            <Link
              href="/#faq"
              className="px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {t.nav.faq}
            </Link>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* Command Palette Trigger Button */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            title="Command Palette"
          >
            <Command className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px] bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              Ctrl+K
            </span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={locale === "en" ? "التبديل إلى العربية" : "Switch to English"}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{locale === "en" ? "العربية" : "English"}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* CTA / Auth link */}
          <Link
            href="/login"
            className="hidden lg:inline-flex text-xs font-semibold px-3 py-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white"
          >
            {t.nav.signIn}
          </Link>

          <Link
            href="/app/workspace"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-md bg-navy-800 hover:bg-navy-900 text-white shadow-sm transition-all hover:shadow"
          >
            <span>{t.nav.getStarted}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
