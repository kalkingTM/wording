import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import Link from "next/link";
import LogoMark from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
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

/** ハイドレーション前にテーマを適用してチラつきを防ぐ（localStorage > OS設定の順） */
const themeInitScript = `(function(){try{var s=localStorage.getItem("theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJp.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-stone-50 text-stone-900 transition-colors dark:bg-stone-950 dark:text-stone-100">
        {/* 背景透かし: ロゴを斜めに大小2つ配置。カードの背面に隠れる超低不透明度 */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <LogoMark
            variant="outline"
            className="absolute -right-16 -top-20 h-[26rem] w-[26rem] -rotate-12 text-stone-900/[0.05] dark:text-white/[0.06]"
          />
          <LogoMark
            variant="outline"
            className="absolute -bottom-16 -left-20 h-72 w-72 -rotate-12 text-stone-900/[0.04] dark:text-white/[0.05]"
          />
        </div>
        <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-stone-50/80 backdrop-blur dark:border-stone-800 dark:bg-stone-950/80">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
            <Link href="/" className="flex items-center gap-2.5">
              <LogoMark className="h-7 w-7" />
              <span className="text-lg font-bold tracking-tight">Wording</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="hidden text-xs text-stone-500 sm:block dark:text-stone-400">
                プロンプト力を磨く AI コーチング
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-4 py-10">{children}</div>
        </main>
        <footer className="border-t border-stone-200/80 dark:border-stone-800">
          <div className="mx-auto max-w-5xl px-4 py-5 text-xs leading-relaxed text-stone-400 dark:text-stone-500">
            無料モードでは入力内容がAIの学習に利用される可能性があります。業務上の機密情報は入力しないでください。
          </div>
        </footer>
      </body>
    </html>
  );
}
