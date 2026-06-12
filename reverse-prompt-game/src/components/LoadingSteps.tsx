"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "プロンプトを送信中…",
  "あなたのプロンプトで出力を生成中…",
  "ルーブリックで採点中…",
  "コーチがフィードバックを作成中…",
];

/** 採点には5〜15秒かかるため、ステップ表示で体感待ち時間を下げる（仕様 4-2） */
export default function LoadingSteps() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => Math.min(c + 1, STEPS.length - 1));
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <ul className="space-y-4">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-3 text-sm">
            {i < current ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                ✓
              </span>
            ) : i === current ? (
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-stone-200 border-t-stone-900 dark:border-stone-700 dark:border-t-stone-100" />
            ) : (
              <span className="h-6 w-6 rounded-full border-2 border-stone-100 dark:border-stone-800" />
            )}
            <span
              className={
                i < current
                  ? "text-stone-400 dark:text-stone-500"
                  : i === current
                    ? "font-medium"
                    : "text-stone-300 dark:text-stone-600"
              }
            >
              {step}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-stone-400 dark:text-stone-500">
        AIが採点しています。10秒ほどお待ちください…
      </p>
    </div>
  );
}
