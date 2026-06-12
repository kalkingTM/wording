"use client";

import type { PlayResult, SubScores } from "@/types/game";

const AXES: { key: keyof Omit<SubScores, "total">; label: string }[] = [
  { key: "clarity", label: "明確性（5W1H）" },
  { key: "specificity", label: "具体性" },
  { key: "structure", label: "構造化" },
  { key: "fitness", label: "目的適合" },
];

/** 総合スコア＋サブスコア内訳。再挑戦時は前回スコアとの差分を表示する（仕様 4-1, 4-2） */
export default function ScorePanel({
  scores,
  passingScore,
  previous,
}: {
  scores: SubScores;
  passingScore: number;
  previous?: PlayResult;
}) {
  const passed = scores.total >= passingScore;
  const diff = previous ? scores.total - previous.scores.total : null;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-stone-400 dark:text-stone-500">
            総合スコア
          </p>
          <p className="mt-1">
            <span className="text-6xl font-bold tabular-nums tracking-tight">
              {scores.total}
            </span>
            <span className="ml-1.5 text-stone-400 dark:text-stone-500">
              / 100
            </span>
          </p>
          {diff !== null && (
            <p
              className={`mt-1.5 text-sm font-medium tabular-nums ${
                diff > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : diff < 0
                    ? "text-red-500 dark:text-red-400"
                    : "text-stone-400 dark:text-stone-500"
              }`}
            >
              前回から {diff > 0 ? `+${diff}` : diff} 点
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-4 py-1.5 text-sm font-bold ${
            passed
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400"
          }`}
        >
          {passed
            ? "クリア！"
            : `合格ラインまであと${passingScore - scores.total}点`}
        </span>
      </div>

      <div className="mt-8 space-y-4">
        {AXES.map(({ key, label }) => {
          const value = scores[key];
          const prev = previous?.scores[key];
          return (
            <div key={key}>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500 dark:text-stone-400">
                  {label}
                </span>
                <span className="font-medium tabular-nums">
                  {value}
                  <span className="text-stone-400 dark:text-stone-500">
                    {" "}
                    / 25
                  </span>
                  {prev !== undefined && value !== prev && (
                    <span
                      className={`ml-2 text-xs ${
                        value > prev
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500 dark:text-red-400"
                      }`}
                    >
                      ({value > prev ? "+" : ""}
                      {value - prev})
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-stone-100 dark:bg-stone-800">
                <div
                  className="h-1.5 rounded-full bg-stone-900 transition-all duration-700 dark:bg-stone-100"
                  style={{ width: `${Math.min(100, (value / 25) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
