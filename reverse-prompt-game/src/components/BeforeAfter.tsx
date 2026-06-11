"use client";

import type { EvaluationResult } from "@/types/game";

/** Before/After比較。「実際の出力」と「理想の出力」を並べてアハ体験を生む（仕様 4-2） */
export default function BeforeAfter({ result }: { result: EvaluationResult }) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">Before</span>
            あなたのプロンプトによる出力
          </h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {result.userOutput}
          </p>
        </div>
        <div className="rounded-xl border-2 border-navy-200 bg-navy-50/50 p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-navy-700">
            <span className="rounded bg-navy-700 px-2 py-0.5 text-xs text-white">After</span>
            添削後のプロンプトによる出力
          </h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {result.idealOutput}
          </p>
        </div>
      </div>

      <details className="rounded-xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer text-sm font-bold text-navy-900">
          コーチが添削したプロンプトを見る
        </summary>
        <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
          {result.improvedPrompt}
        </p>
      </details>
    </section>
  );
}
