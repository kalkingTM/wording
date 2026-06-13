"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import BeforeAfter from "@/components/BeforeAfter";
import LoadingSteps from "@/components/LoadingSteps";
import ScorePanel from "@/components/ScorePanel";
import { getStageById } from "@/data/stages";
import { FREE_EVALUATIONS_PER_DAY, MAX_PROMPT_LENGTH } from "@/lib/constants";
import {
  EvaluationError,
  runEvaluation,
} from "@/lib/client/evaluate";
import {
  appendPlayResult,
  clearPlaySession,
  getByokKey,
  getPlaySession,
  getTodayPlayCount,
  savePlaySession,
} from "@/lib/client/storage";
import type { PlayResult, PlaySession } from "@/types/game";

type Phase = "input1" | "loading1" | "hint" | "input2" | "loading2" | "final";

/**
 * プレイ画面（2段階コーチングフロー）。
 * 1回目: 採点 → スコアとヒントのみ公開（模範プロンプトは隠す）
 * 2回目: 1回目の文を書き直して再採点 → 1回目との比較・総評・模範プロンプトを公開
 * スキップ時は1回目の結果をそのまま全公開する。
 * 進行状態は sessionStorage に保存し、リロードしても消費した採点が無駄にならない。
 */
export default function PlayPage({
  params,
}: {
  params: Promise<{ stageId: string }>;
}) {
  const { stageId } = use(params);
  const stage = getStageById(stageId);

  const [phase, setPhase] = useState<Phase>("input1");
  const [prompt, setPrompt] = useState("");
  const [session, setSession] = useState<PlaySession | null>(null);
  const [error, setError] = useState<string | null>(null);

  // リロード・再訪時に進行中セッションを復元する（SSRとの不一致を避けるため effect で行う）
  useEffect(() => {
    const saved = getPlaySession(stageId);
    if (!saved) return;
    setSession(saved);
    setPhase(saved.secondResult || saved.skipped ? "final" : "hint");
  }, [stageId]);

  if (!stage) notFound();

  const isSecondRound = Boolean(session?.secondResult);
  const finalResult = session?.secondResult ?? (session?.skipped ? session.firstResult : null);
  const canRewrite =
    Boolean(getByokKey()) || getTodayPlayCount() < FREE_EVALUATIONS_PER_DAY;

  const handleFirstSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setError(null);
    setPhase("loading1");
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
        attempt: 1,
      });
      const next: PlaySession = {
        stageId: stage.id,
        firstPrompt: trimmed,
        firstResult: outcome.result,
        modelId: outcome.modelId,
      };
      savePlaySession(next);
      setSession(next);
      setPhase("hint");
    } catch (e) {
      setError(
        e instanceof EvaluationError
          ? e.message
          : "予期しないエラーが発生しました。",
      );
      setPhase("input1");
    }
  };

  const handleStartRewrite = () => {
    if (!session) return;
    setError(null);
    setPrompt(session.firstPrompt);
    setPhase("input2");
  };

  const handleSecondSubmit = async () => {
    if (!session) return;
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setError(null);
    setPhase("loading2");
    try {
      const outcome = await runEvaluation(stage, trimmed, {
        userPrompt: session.firstPrompt,
        scores: session.firstResult.scores,
      });
      appendPlayResult({
        schemaVersion: 1,
        stageId: stage.id,
        promptText: trimmed,
        scores: outcome.result.scores,
        feedback: outcome.result.feedback,
        modelId: outcome.modelId,
        playedAt: new Date().toISOString(),
        attempt: 2,
      });
      const next: PlaySession = {
        ...session,
        secondPrompt: trimmed,
        secondResult: outcome.result,
      };
      savePlaySession(next);
      setSession(next);
      setPhase("final");
    } catch (e) {
      setError(
        e instanceof EvaluationError
          ? e.message
          : "予期しないエラーが発生しました。",
      );
      setPhase("input2");
    }
  };

  const handleSkip = () => {
    if (!session) return;
    const next: PlaySession = { ...session, skipped: true };
    savePlaySession(next);
    setSession(next);
    setPhase("final");
  };

  const handleRetry = () => {
    clearPlaySession(stage.id);
    setSession(null);
    setPrompt("");
    setError(null);
    setPhase("input1");
  };

  // 最終結果（2回目あり）の比較対象として、1回目の記録を ScorePanel の形式に変換する
  const firstAsPlayResult: PlayResult | undefined = session
    ? {
        schemaVersion: 1,
        stageId: stage.id,
        promptText: session.firstPrompt,
        scores: session.firstResult.scores,
        feedback: session.firstResult.feedback,
        modelId: session.modelId,
        playedAt: "",
        attempt: 1,
      }
    : undefined;

  const isInput = phase === "input1" || phase === "input2";

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

      {isInput && (
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <label htmlFor="prompt" className="block text-sm font-bold">
            {phase === "input2"
              ? "あなたのプロンプト（書き直し）"
              : "あなたのプロンプト"}
          </label>
          {phase === "input2" && session && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
              <span className="font-bold">ヒント：</span>
              {session.firstResult.hint}
            </p>
          )}
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
              onClick={phase === "input2" ? handleSecondSubmit : handleFirstSubmit}
              disabled={!prompt.trim()}
              className="rounded-lg bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-40 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
            >
              {phase === "input2" ? "もう一度採点してもらう" : "採点してもらう"}
            </button>
          </div>
          {phase === "input2" && (
            <button
              onClick={handleSkip}
              className="mt-3 text-xs text-stone-400 underline-offset-2 transition-colors hover:text-stone-600 hover:underline dark:text-stone-500 dark:hover:text-stone-300"
            >
              書き直さずに1回目の結果を見る
            </button>
          )}
          {error && (
            <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}
        </section>
      )}

      {(phase === "loading1" || phase === "loading2") && <LoadingSteps />}

      {phase === "hint" && session && (
        <div className="space-y-6">
          {session.firstResult.injectionDetected && <InjectionNotice />}
          <ScorePanel
            scores={session.firstResult.scores}
            passingScore={stage.passingScore}
          />

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-500/25 dark:bg-amber-500/10">
            <h2 className="text-sm font-bold tracking-tight text-amber-800 dark:text-amber-300">
              コーチからのヒント
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-amber-900 dark:text-amber-200">
              {session.firstResult.hint}
            </p>
          </section>

          <p className="text-xs leading-relaxed text-stone-400 dark:text-stone-500">
            コーチのフィードバック・模範プロンプト・Before/After
            は最終結果で公開されます。ヒントをもとに書き直すと、1回目とのスコア比較も表示されます。
          </p>

          {!canRewrite && (
            <p className="rounded-xl border border-stone-200 bg-stone-100 p-3.5 text-sm leading-relaxed text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
              本日の無料採点を使い切ったため、書き直しの採点はできません。このまま結果を見るか、BYOK設定（ご自身のAPIキー）で無制限にプレイできます。無料枠は毎朝9時にリセットされます。
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleStartRewrite}
              disabled={!canRewrite}
              className="flex-1 rounded-lg bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-40 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
            >
              ヒントを活かして書き直す
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 rounded-lg border border-stone-200 px-6 py-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              このまま結果を見る
            </button>
          </div>
        </div>
      )}

      {phase === "final" && session && finalResult && (
        <div className="space-y-6">
          {finalResult.injectionDetected && <InjectionNotice />}
          <ScorePanel
            scores={finalResult.scores}
            passingScore={stage.passingScore}
            previous={isSecondRound ? firstAsPlayResult : undefined}
            previousLabel="1回目から"
          />

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
            <h2 className="font-bold tracking-tight">
              {isSecondRound ? "コーチの総評" : "コーチからのフィードバック"}
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {finalResult.feedback}
            </p>
          </section>

          <BeforeAfter result={finalResult} />

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

/** 採点AIへの働きかけを検出した際の注意書き（1回目・最終のどちらでも表示しうる） */
function InjectionNotice() {
  return (
    <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
      採点AIへの働きかけ（「高得点をつけて」など）を検出しました。それはプロンプト力ではないので、スコアには反映されません。プロンプトそのものの内容で勝負しましょう！
    </p>
  );
}
