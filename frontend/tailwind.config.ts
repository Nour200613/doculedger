import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          50: "#f0f4fd",
          100: "#e0eafb",
          200: "#c7daf7",
          300: "#9fc1f1",
          400: "#71a1e9",
          500: "#4f80e0",
          600: "#3865d4",
          700: "#2d50bf",
          800: "#1e3a8a",
          900: "#1e3470",
          950: "#142147",
        },
        audit: {
          warning: {
            bg: "#FEF3C7",
            border: "#FDE047",
            text: "#92400E",
          },
          verified: {
            bg: "#ECFDF5",
            border: "#A7F3D0",
            text: "#065F46",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-cairo)", "system-ui", "sans-serif"],
        cairo: ["var(--font-cairo)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
