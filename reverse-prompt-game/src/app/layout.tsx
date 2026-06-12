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

/** 起動スプラッシュの表示判定（セッション中1回だけ）。表示後に印を付けて閉じる */
const splashInitScript = `(function(){var r=document.documentElement;try{if(sessionStorage.getItem("splashShown"))return;sessionStorage.setItem("splashShown","1")}catch(e){}r.classList.add("show-splash");setTimeout(function(){r.classList.remove("show-splash")},2400)})()`;

/**
 * 背景透かしのタイル（W モノグラム大小2つを斜めに千鳥配置、168px で無限リピート）。
 * CSS マスクとして使うため色は任意（アルファのみ参照される）。
 * 実際の色と濃度は要素側の bg-* クラスが決める。
 */
const watermarkTile = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='168' height='168'%3E%3Cdefs%3E%3Cg id='w' fill='none' stroke='%23000'%3E%3Crect x='2' y='2' width='48' height='48' rx='12' stroke-width='3'/%3E%3Cpolyline points='10 17 16.5 35 23.5 21 30.5 35 37 17' stroke-width='4.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='41.5' cy='35' r='3.5' fill='%23000' stroke='none'/%3E%3C/g%3E%3C/defs%3E%3Cuse href='%23w' transform='translate(20,20) rotate(-12 20 20) scale(0.78)'/%3E%3Cuse href='%23w' transform='translate(112,110) rotate(-12 16 16) scale(0.6)'/%3E%3C/svg%3E")`;

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
        <script dangerouslySetInnerHTML={{ __html: splashInitScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-stone-50 text-stone-900 transition-colors dark:bg-stone-950 dark:text-stone-100">
        {/* 起動スプラッシュ: ロゴとキャッチコピーを約2秒表示してフェードアウト */}
        <div
          id="splash"
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 items-center justify-center bg-stone-50 dark:bg-stone-950"
        >
          <div className="flex flex-col items-center gap-5 px-6">
            <LogoMark className="h-16 w-16" />
            <p className="text-center text-lg font-bold tracking-tight sm:text-xl">
              Wording ひとつで、AIの答えは変わる。
            </p>
          </div>
        </div>
        {/* 背景透かし: 小さなロゴを斜めに敷き詰めたパターン。カードの背面に隠れる超低不透明度 */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 bg-stone-900/[0.045] dark:bg-white/[0.055]"
          style={{
            WebkitMaskImage: watermarkTile,
            maskImage: watermarkTile,
            WebkitMaskSize: "168px 168px",
            maskSize: "168px 168px",
            WebkitMaskRepeat: "repeat",
            maskRepeat: "repeat",
          }}
        />
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
