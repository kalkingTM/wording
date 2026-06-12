"use client";

import { useState, useSyncExternalStore } from "react";
import ByokSettings from "@/components/ByokSettings";
import StageList from "@/components/StageList";
import { stages } from "@/data/stages";
import { FREE_PLAYS_PER_DAY } from "@/lib/constants";
import { getByokKey, getTodayPlayCount } from "@/lib/client/storage";

/**
 * トップ画面: ステータス表示・BYOK設定・ステージ選択（仕様 4-3）。
 * localStorage を参照するため、ハイドレーション不一致を避けて mounted 後に描画する。
 */
const emptySubscribe = () => () => {};

export default function Home() {
  // SSRでは false、クライアントでは true を返すハイドレーション安全な判定
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [, setRefresh] = useState(0);

  const byok = mounted && Boolean(getByokKey());
  const remaining = mounted
    ? Math.max(0, FREE_PLAYS_PER_DAY - getTodayPlayCount())
    : null;

  return (
    <div className="space-y-12">
      <section className="pt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500">
          AI Prompt Coaching
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-snug tracking-tight sm:text-4xl">
          そのプロンプト、
          <br className="sm:hidden" />
          AIに採点させてみませんか？
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-stone-600 dark:text-stone-400">
          お題に沿ってプロンプトを書くと、コーチAIが「明確性・具体性・構造化・目的適合」の4つの観点で採点。
          伴走型のフィードバックとBefore/After比較で、言語化能力を鍛えます。
        </p>
        <div className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
          {!mounted ? (
            <span className="text-stone-400">読み込み中…</span>
          ) : byok ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              BYOKモード：プレイ回数無制限
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              無料モード：本日あと {remaining} 回プレイできます
            </>
          )}
        </div>
      </section>

      {mounted && (
        <>
          <StageList stages={stages} />
          <ByokSettings onChange={() => setRefresh((n) => n + 1)} />
        </>
      )}
    </div>
  );
}
