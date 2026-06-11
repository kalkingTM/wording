"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import BeforeAfter from "@/components/BeforeAfter";
import LoadingSteps from "@/components/LoadingSteps";
import ScorePanel from "@/components/ScorePanel";
import { getStageById } from "@/data/stages";
import { MAX_PROMPT_LENGTH } from "@/lib/constants";
import {
  EvaluationError,
  runEvaluation,
} from "@/lib/client/evaluate";
import {
  appendPlayResult,
  getLastResultForStage,
} from "@/lib/client/storage";
import type { EvaluationResult, PlayResult } from "@/types/game";

type Phase = "input" | "loading" | "result";

/**
 * プレイ画面（仕様 4-3）。入力 → ローディング → 結果 を1画面の状態遷移で表現する。
 * 結果表示時は前回スコア（再挑戦ループ）との比較を行う。
 */
export default function PlayPage({
  params,
}: {
  params: Promise<{ stageId: string }>;
}) {
  const { stageId } = use(params);
  const stage = getStageById(stageId);

  const [phase, setPhase] = useState<Phase>("input");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [previous, setPrevious] = useState<PlayResult | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  if (!stage) notFound();

  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setError(null);
    setPhase("loading");
    // 保存前に前回記録を取得しておく（再挑戦の前回比表示用）
    const prev = getLastResultForStage(stage.id);

    try {
      const outcome = await runEvaluation(stage, trimmed);
      appendPlayResult({
        schemaVersion: 1,
        stageId: stage.id,
        promptText: trimmed,
        scores: outcome.result.scores,
        feedback: outcome.result.feedback,
        modelId: outcome.modelId,
        playedAt: new Date().toISOString(),
      });
      setPrevious(prev);
      setResult(outcome.result);
      setPhase("result");
    } catch (e) {
      setError(
        e instanceof EvaluationError
          ? e.message
          : "予期しないエラーが発生しました。",
      );
      setPhase("input");
    }
  };

  const handleRetry = () => {
    setResult(null);
    setPhase("input");
  };

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-navy-700">
          ← ステージ選択に戻る
        </Link>
      </nav>

      {/* お題カード（常時表示） */}
      <section className="rounded-xl border-l-4 border-navy-600 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium text-navy-500">
          お題 {"★".repeat(stage.difficulty)} ／ 合格ライン {stage.passingScore}点
        </p>
        <h1 className="mt-1 text-xl font-bold text-navy-900">{stage.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {stage.description}
        </p>
      </section>

      {phase === "input" && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <label
            htmlFor="prompt"
            className="block text-sm font-bold text-navy-900"
          >
            あなたのプロンプト
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={MAX_PROMPT_LENGTH}
            rows={8}
            placeholder="AIへの指示文をここに書いてください。誰に・何を・どんな形式で伝えてほしいかを意識すると高得点に近づきます。"
            className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm leading-relaxed focus:border-navy-500 focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {prompt.length} / {MAX_PROMPT_LENGTH} 文字
            </span>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              className="rounded-lg bg-navy-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-navy-600 disabled:opacity-40"
            >
              採点してもらう
            </button>
          </div>
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </section>
      )}

      {phase === "loading" && <LoadingSteps />}

      {phase === "result" && result && (
        <div className="space-y-6">
          <ScorePanel
            scores={result.scores}
            passingScore={stage.passingScore}
            previous={previous}
          />

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="flex items-center gap-2 font-bold text-navy-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-base">
                🎓
              </span>
              コーチからのフィードバック
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {result.feedback}
            </p>
          </section>

          <BeforeAfter result={result} />

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleRetry}
              className="flex-1 rounded-lg bg-navy-700 px-6 py-3 text-sm font-bold text-white hover:bg-navy-600"
            >
              このお題にもう一度挑戦する
            </button>
            <Link
              href="/"
              className="flex-1 rounded-lg border border-slate-300 px-6 py-3 text-center text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              ステージ選択に戻る
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
