import type { EvaluationResult, Stage } from "@/types/game";
import { AIError } from "@/types/errors";
import { GeminiProvider } from "@/lib/ai/gemini";
import { getByokKey, incrementTodayPlayCount } from "./storage";

/**
 * 採点実行のオーケストレータ。BYOKキーの有無で経路を自動で切り替える:
 * - BYOK: ブラウザから GeminiProvider で直接呼び出す（キーはサーバーへ送らない）
 * - 無料枠: /api/evaluate へPOST（サーバー側レート制限を通る）
 */

export type PlayMode = "free" | "byok";

export interface EvaluationOutcome {
  result: EvaluationResult;
  modelId: string;
  mode: PlayMode;
}

/** ユーザーにそのまま表示できるメッセージを持つエラー */
export class EvaluationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "EvaluationError";
  }
}

export function getCurrentMode(): PlayMode {
  return getByokKey() ? "byok" : "free";
}

export async function runEvaluation(
  stage: Stage,
  userPrompt: string,
): Promise<EvaluationOutcome> {
  const byokKey = getByokKey();
  return byokKey
    ? evaluateWithByok(byokKey, stage, userPrompt)
    : evaluateWithFreeTier(stage, userPrompt);
}

async function evaluateWithByok(
  apiKey: string,
  stage: Stage,
  userPrompt: string,
): Promise<EvaluationOutcome> {
  const provider = new GeminiProvider(apiKey);
  try {
    const result = await provider.evaluate({ stage, userPrompt });
    return { result, modelId: provider.modelId, mode: "byok" };
  } catch (e) {
    throw toEvaluationError(e, "byok");
  }
}

async function evaluateWithFreeTier(
  stage: Stage,
  userPrompt: string,
): Promise<EvaluationOutcome> {
  let res: Response;
  try {
    res = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId: stage.id, userPrompt }),
    });
  } catch {
    throw new EvaluationError(
      "NETWORK",
      "通信に失敗しました。接続を確認して再試行してください。",
    );
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const code = data?.error?.code ?? "UNKNOWN";
    const message =
      data?.error?.message ?? "予期しないエラーが発生しました。再試行してください。";
    throw new EvaluationError(code, message);
  }

  // UX層のカウント（表示用）。防御はサーバー側レート制限が担う
  incrementTodayPlayCount();
  return { result: data.result, modelId: data.modelId, mode: "free" };
}

/** BYOK経路の AIError をユーザー向けメッセージに変換（仕様 3-4） */
function toEvaluationError(e: unknown, mode: PlayMode): EvaluationError {
  if (e instanceof AIError) {
    switch (e.code) {
      case "INVALID_KEY":
        return new EvaluationError(
          e.code,
          "APIキーが無効です。トップ画面のBYOK設定でキーを確認してください。",
        );
      case "RATE_LIMITED":
        return new EvaluationError(
          e.code,
          mode === "byok"
            ? "Gemini側のレート制限に達しました。しばらく待ってから再試行してください。"
            : "アクセスが集中しています。時間をおいて再試行してください。",
        );
      case "OVERLOADED":
        return new EvaluationError(
          e.code,
          "AIが混み合っています。少し時間をおいて再試行してください。",
        );
      case "SAFETY_BLOCKED":
        return new EvaluationError(
          e.code,
          "AIの安全フィルタにより出力できませんでした。プロンプトの表現を変えて再挑戦してください。",
        );
      case "TIMEOUT":
        return new EvaluationError(
          e.code,
          "応答がタイムアウトしました。再試行してください。",
        );
      case "PARSE_FAILED":
        return new EvaluationError(
          e.code,
          "採点結果の取得に失敗しました。再試行してください。",
        );
    }
  }
  return new EvaluationError("UNKNOWN", "予期しないエラーが発生しました。");
}
