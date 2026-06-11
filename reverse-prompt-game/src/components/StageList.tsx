"use client";

import Link from "next/link";
import type { Stage } from "@/types/game";
import { getPlayResults } from "@/lib/client/storage";

/** ステージ選択。プレイ履歴からベストスコアとクリア状況を表示する */
export default function StageList({ stages }: { stages: Stage[] }) {
  const results = getPlayResults();

  return (
    <section>
      <h2 className="font-bold text-navy-900">ステージを選ぶ</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
              className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-navy-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-amber-500">
                  {"★".repeat(stage.difficulty)}
                  <span className="text-slate-200">
                    {"★".repeat(3 - stage.difficulty)}
                  </span>
                </span>
                {cleared ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    クリア済み
                  </span>
                ) : best > 0 ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    挑戦中
                  </span>
                ) : null}
              </div>
              <h3 className="mt-2 font-bold text-navy-900 group-hover:text-navy-600">
                {stage.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                {stage.description}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>合格ライン {stage.passingScore}点</span>
                {best > 0 && <span>ベスト {best}点</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
