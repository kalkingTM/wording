"use client";

import Link from "next/link";
import type { Stage } from "@/types/game";
import { getPlayResults } from "@/lib/client/storage";

/** ステージ選択。プレイ履歴からベストスコアとクリア状況を表示する */
export default function StageList({ stages }: { stages: Stage[] }) {
  const results = getPlayResults();

  return (
    <section>
      <h2 className="text-lg font-bold tracking-tight">ステージを選ぶ</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {stages.map((stage) => {
          const best = Math.max(
            0,
            ...results
              .filter((r) => r.stageId === stage.id)
              .map((r) => r.scores.total),
          );
          const cleared = best >= stage.passingScore;

          return (
            <Link
              key={stage.id}
              href={`/play/${stage.id}`}
              className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-amber-500">
                  {"★".repeat(stage.difficulty)}
                  <span className="text-stone-200 dark:text-stone-700">
                    {"★".repeat(3 - stage.difficulty)}
                  </span>
                </span>
                {cleared ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    クリア済み
                  </span>
                ) : best > 0 ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    挑戦中
                  </span>
                ) : null}
              </div>
              <h3 className="mt-2.5 font-bold tracking-tight">{stage.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                {stage.description}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs text-stone-400 dark:border-stone-800 dark:text-stone-500">
                <span>合格ライン {stage.passingScore}点</span>
                <span className="flex items-center gap-2">
                  {best > 0 && (
                    <span className="font-medium tabular-nums text-stone-600 dark:text-stone-300">
                      ベスト {best}点
                    </span>
                  )}
                  <span className="text-stone-300 transition-transform group-hover:translate-x-0.5 dark:text-stone-600">
                    →
                  </span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
