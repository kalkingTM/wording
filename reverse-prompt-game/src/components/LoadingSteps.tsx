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
    <div className="rounded-xl border border-slate-200 bg-white p-8">
      <ul className="space-y-3">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-3 text-sm">
            {i < current ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                ✓
              </span>
            ) : i === current ? (
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-navy-200 border-t-navy-600" />
            ) : (
              <span className="h-6 w-6 rounded-full border-2 border-slate-200" />
            )}
            <span
              className={
                i < current
                  ? "text-slate-400"
                  : i === current
                    ? "font-medium text-navy-900"
                    : "text-slate-300"
              }
            >
              {step}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-slate-400">
        AIが採点しています。10秒ほどお待ちください…
      </p>
    </div>
  );
}
