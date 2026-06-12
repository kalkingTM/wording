"use client";

import type { EvaluationResult } from "@/types/game";

/** Before/After比較。「実際の出力」と「理想の出力」を並べてアハ体験を生む（仕様 4-2） */
export default function BeforeAfter({ result }: { result: EvaluationResult }) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <h3 className="flex items-center gap-2 text-sm font-bold text-stone-400 dark:text-stone-500">
            <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs dark:bg-stone-800">
              Before
            </span>
            あなたのプロンプトによる出力
          </h3>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            {result.userOutput}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm dark:border-emerald-500/25 dark:bg-emerald-500/5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
            <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs text-white">
              After
            </span>
            添削後のプロンプトによる出力
          </h3>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {result.idealOutput}
          </p>
        </div>
      </div>

      <details className="group rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <summary className="cursor-pointer list-none text-sm font-bold">
          <span className="mr-2 inline-block text-stone-400 transition-transform group-open:rotate-90 dark:text-stone-500">
            ›
          </span>
          コーチが添削したプロンプトを見る
        </summary>
        <p className="mt-4 whitespace-pre-wrap rounded-xl bg-stone-50 p-4 text-sm leading-relaxed text-stone-700 dark:bg-stone-950 dark:text-stone-300">
          {result.improvedPrompt}
        </p>
      </details>
    </section>
  );
}
