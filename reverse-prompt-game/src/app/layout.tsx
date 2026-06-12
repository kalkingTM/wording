"use client";

import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import Link from "next/link";
import { useEffect, useState } from "react";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wording | プロンプト力を磨く AI コーチングアプリ",
  description:
    "あなたのプロンプトをAIが採点し、伴走型コーチングでフィードバック。プロンプト力を磨く学習ツール。",
};

function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = stored ? stored === "true" : prefersDark;
    setIsDark(shouldBeDark);
    applyDarkMode(shouldBeDark);
  }, []);

  const applyDarkMode = (dark: boolean) => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  };

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem("darkMode", String(newDark));
    applyDarkMode(newDark);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
      title="ダークモード切り替え"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors">
        <header className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <div className="flex-1">
              <Link href="/" className="font-bold text-lg tracking-wide text-slate-900 dark:text-white">
                Wording
              </Link>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                プロンプト力を磨く AI コーチングアプリ
              </p>
            </div>
            <DarkModeToggle />
          </div>
        </header>
        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
        </main>
        <footer className="border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-gray-500 dark:text-gray-400">
            無料モードでは入力内容がAIの学習に利用される可能性があります。業務上の機密情報は入力しないでください。
          </div>
        </footer>
      </body>
    </html>
  );
}
