import { create } from "zustand";
import { Locale, Theme } from "@/types";

interface UIState {
  locale: Locale;
  theme: Theme;
  commandPaletteOpen: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  locale: "en",
  theme: "light",
  commandPaletteOpen: false,
  setLocale: (locale) => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      document.documentElement.setAttribute("lang", locale);
    }
    set({ locale });
  },
  toggleLocale: () => {
    set((state) => {
      const nextLocale = state.locale === "en" ? "ar" : "en";
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("dir", nextLocale === "ar" ? "rtl" : "ltr");
        document.documentElement.setAttribute("lang", nextLocale);
      }
      return { locale: nextLocale };
    });
  },
  setTheme: (theme) => {
    if (typeof document !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        if (nextTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      return { theme: nextTheme };
    });
  },
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));
