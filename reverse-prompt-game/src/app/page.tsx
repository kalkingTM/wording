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
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-r from-coral-50 to-white dark:from-slate-900 dark:to-slate-800 px-6 py-10 border-l-4 border-coral">
        <h1 className="text-2xl font-bold sm:text-3xl text-slate-900 dark:text-white">
          そのプロンプト、AIに採点させてみませんか？
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-gray-400">
          お題に沿ってプロンプトを書くと、コーチAIが「明確性・具体性・構造化・目的適合」の4つの観点で採点し、
          伴走型のフィードバックとBefore/After比較で言語化能力を鍛えます。
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-gray-300">
          {!mounted ? (
            <span>読み込み中…</span>
          ) : byok ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              BYOKモード：プレイ回数無制限
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              無料モード：本日あと {remaining} 回プレイできます
            </>
          )}
        </div>
      </section>

      {mounted && (
        <>
          <ByokSettings onChange={() => setRefresh((n) => n + 1)} />
          <StageList stages={stages} />
        </>
      )}
    </div>
  );
}
