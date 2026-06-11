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
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-slate-500">総合スコア</p>
          <p className="mt-1">
            <span className="text-5xl font-bold text-navy-900">
              {scores.total}
            </span>
            <span className="ml-1 text-slate-400">/ 100</span>
          </p>
          {diff !== null && (
            <p
              className={`mt-1 text-sm font-medium ${
                diff > 0
                  ? "text-emerald-600"
                  : diff < 0
                    ? "text-red-500"
                    : "text-slate-500"
              }`}
            >
              前回から {diff > 0 ? `+${diff}` : diff} 点
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-4 py-1.5 text-sm font-bold ${
            passed
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {passed ? "クリア！" : `合格ラインまであと${passingScore - scores.total}点`}
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {AXES.map(({ key, label }) => {
          const value = scores[key];
          const prev = previous?.scores[key];
          return (
            <div key={key}>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{label}</span>
                <span className="font-medium text-navy-900">
                  {value}
                  <span className="text-slate-400"> / 25</span>
                  {prev !== undefined && value !== prev && (
                    <span
                      className={`ml-2 text-xs ${
                        value > prev ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      ({value > prev ? "+" : ""}
                      {value - prev})
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-navy-500 transition-all"
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
