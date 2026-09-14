"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { translations } from "@/lib/translations";
import { FileSpreadsheet, Lock, Mail, ArrowRight } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const { locale } = useUIStore();
  const t = translations[locale].auth;

  const [email, setEmail] = useState("accountant@finance-corp.com");
  const [password, setPassword] = useState("••••••••••••");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/app/workspace");
    }, 600);
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl">
      {/* Brand icon */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-11 h-11 rounded-xl bg-navy-800 dark:bg-blue-600 flex items-center justify-center text-white mb-3 shadow-sm">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {t.loginTitle}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t.loginSubtitle}
        </p>
      </div>

      {/* Google OAuth Button */}
      <button
        onClick={() => router.push("/app/workspace")}
        type="button"
        className="w-full py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-3 transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{t.googleBtn}</span>
      </button>

      {/* Separator */}
      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <span className="relative px-3 bg-white dark:bg-slate-900 text-[10px] font-semibold text-slate-400 tracking-wider">
          {t.orSeparator}
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {t.emailLabel}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="w-full ps-9 pe-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:border-navy-800 dark:focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block font-medium text-slate-700 dark:text-slate-300">
              {t.passwordLabel}
            </label>
            <a href="#" className="text-[11px] text-navy-800 dark:text-blue-400 hover:underline">
              {t.forgotPassword}
            </a>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              className="w-full ps-9 pe-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:border-navy-800 dark:focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="remember"
            defaultChecked
            className="w-3.5 h-3.5 rounded border-slate-300 text-navy-800 focus:ring-navy-800"
          />
          <label htmlFor="remember" className="text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
            {t.rememberMe}
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-lg bg-navy-800 hover:bg-navy-900 text-white font-semibold flex items-center justify-center gap-2 shadow-md transition-all mt-2"
        >
          <span>{isLoading ? "Signing in..." : t.signInBtn}</span>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </form>

      {/* Switch to Signup */}
      <div className="text-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        <span>{t.noAccount} </span>
        <Link href="/signup" className="font-semibold text-navy-800 dark:text-blue-400 hover:underline">
          {t.signUpBtn}
        </Link>
      </div>
    </div>
  );
}
