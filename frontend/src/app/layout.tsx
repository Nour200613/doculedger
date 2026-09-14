import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeLanguageProvider } from "@/components/common/ThemeLanguageProvider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "DocuLedger AI | B2B Financial Document & Invoice Parser",
  description:
    "Convert any PDF invoice or bank statement into a clean Excel sheet in seconds without manual errors. Zero AI slop, deterministic mathematical audits, and sub-second OCR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-blue-100 selection:text-navy-900`}>
        <ThemeLanguageProvider>{children}</ThemeLanguageProvider>
      </body>
    </html>
  );
}
