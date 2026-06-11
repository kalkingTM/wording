import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "逆プロンプトゲーム | プロンプト力を鍛える学習アプリ",
  description:
    "あなたのプロンプトをAIが採点し、伴走型コーチングでフィードバック。言語化能力を鍛えるゲーミフィケーション学習ツール。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="bg-navy-900 text-white">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg tracking-wide">
              逆プロンプトゲーム
            </Link>
            <span className="text-xs text-navy-200">
              プロンプト力を鍛える学習アプリ
            </span>
          </div>
        </header>
        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-slate-500">
            無料モードでは入力内容がAIの学習に利用される可能性があります。業務上の機密情報は入力しないでください。
          </div>
        </footer>
      </body>
    </html>
  );
}
