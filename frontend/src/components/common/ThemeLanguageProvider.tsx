"use client";

import React, { useEffect } from "react";
import { useUIStore } from "@/store/uiStore";

export function ThemeLanguageProvider({ children }: { children: React.ReactNode }) {
  const { locale, theme, setLocale, setTheme } = useUIStore();

  useEffect(() => {
    // Check stored preferences
    const savedTheme = (localStorage.getItem("docu_theme") as "light" | "dark") || "light";
    const savedLocale = (localStorage.getItem("docu_locale") as "en" | "ar") || "en";

    setTheme(savedTheme);
    setLocale(savedLocale);
  }, [setTheme, setLocale]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      document.documentElement.setAttribute("lang", locale);
      localStorage.setItem("docu_locale", locale);
    }
  }, [locale]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("docu_theme", theme);
    }
  }, [theme]);

  return <>{children}</>;
}
