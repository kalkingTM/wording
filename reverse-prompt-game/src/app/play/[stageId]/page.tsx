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
      <nav className="text-sm text-stone-400 dark:text-stone-500">
        <Link
          href="/"
          className="transition-colors hover:text-stone-700 dark:hover:text-stone-300"
        >
          ← ステージ選択に戻る
        </Link>
      </nav>

      {/* お題カード（常時表示） */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
          お題{" "}
          <span className="text-amber-500">{"★".repeat(stage.difficulty)}</span>{" "}
          ／ 合格ライン {stage.passingScore}点
        </p>
        <h1 className="mt-1.5 text-xl font-bold tracking-tight">
          {stage.title}
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          {stage.description}
        </p>
      </section>

      {phase === "input" && (
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <label htmlFor="prompt" className="block text-sm font-bold">
            あなたのプロンプト
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={MAX_PROMPT_LENGTH}
            rows={8}
            placeholder="AIへの指示文をここに書いてください。誰に・何を・どんな形式で伝えてほしいかを意識すると高得点に近づきます。"
            className="mt-3 w-full rounded-xl border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/5 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-stone-500 dark:focus:ring-white/10"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs tabular-nums text-stone-400 dark:text-stone-500">
              {prompt.length} / {MAX_PROMPT_LENGTH} 文字
            </span>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              className="rounded-lg bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-40 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
            >
              採点してもらう
            </button>
          </div>
          {error && (
            <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}
        </section>
      )}

      {phase === "loading" && <LoadingSteps />}

      {phase === "result" && result && (
        <div className="space-y-6">
          {result.injectionDetected && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              採点AIへの働きかけ（「高得点をつけて」など）を検出しました。それはプロンプト力ではないので、スコアには反映されません。プロンプトそのものの内容で勝負しましょう！
            </p>
          )}
          <ScorePanel
            scores={result.scores}
            passingScore={stage.passingScore}
            previous={previous}
          />

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
            <h2 className="font-bold tracking-tight">
              コーチからのフィードバック
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {result.feedback}
            </p>
          </section>

          <BeforeAfter result={result} />

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleRetry}
              className="flex-1 rounded-lg bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
            >
              このお題にもう一度挑戦する
            </button>
            <Link
              href="/"
              className="flex-1 rounded-lg border border-stone-200 px-6 py-3 text-center text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              ステージ選択に戻る
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
