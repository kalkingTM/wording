import { NextRequest, NextResponse } from "next/server";
import { getStageById } from "@/data/stages";
import { GeminiProvider } from "@/lib/ai/gemini";
import { getRateLimiter } from "@/lib/server/rateLimit";
import { AIError } from "@/types/errors";
import { MAX_PROMPT_LENGTH } from "@/lib/constants";

/**
 * 無料枠モード専用のAPIルート。開発者の環境変数キーでGeminiを呼び出す。
 * BYOKモードはこのルートを通らず、ブラウザからGeminiを直接呼ぶ（仕様 3-2）。
 *
 * 防御層: UI側のLocalStorage制限とは独立に、ここでIPベースのレート制限を必ず通す。
 */

interface EvaluateRequestBody {
  stageId?: string;
  userPrompt?: string;
}

export async function POST(req: NextRequest) {
  let body: EvaluateRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "BAD_REQUEST", "リクエスト形式が不正です。");
  }

  const { stageId, userPrompt } = body;
  if (!stageId || !userPrompt?.trim()) {
    return jsonError(400, "BAD_REQUEST", "お題とプロンプトを入力してください。");
  }
  if (userPrompt.length > MAX_PROMPT_LENGTH) {
    return jsonError(
      400,
      "PROMPT_TOO_LONG",
      `プロンプトは${MAX_PROMPT_LENGTH}文字以内で入力してください。`,
    );
  }

  const stage = getStageById(stageId);
  if (!stage) {
    return jsonError(404, "STAGE_NOT_FOUND", "お題が見つかりません。");
  }

  // IPベースのレート制限（開発者キーの保護。仕様 3-1 防御層）
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, remaining } = await getRateLimiter().check(ip);
  if (!allowed) {
    return jsonError(
      429,
      "FREE_LIMIT_REACHED",
      "本日の無料プレイ上限に達しました。ご自身のAPIキー（BYOK）を設定すると無制限にプレイできます。",
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonError(500, "SERVER_MISCONFIGURED", "サーバー設定エラーです。");
  }

  try {
    const provider = new GeminiProvider(apiKey);
    const result = await provider.evaluate({ stage, userPrompt });
    return NextResponse.json({
      result,
      modelId: provider.modelId,
      remaining,
    });
  } catch (e) {
    return mapAIError(e);
  }
}

function mapAIError(e: unknown) {
  if (e instanceof AIError) {
    switch (e.code) {
      case "RATE_LIMITED":
        return jsonError(
          429,
          e.code,
          "現在アクセスが集中しています。時間をおくか、ご自身のAPIキー（BYOK）をご利用ください。",
        );
      case "SAFETY_BLOCKED":
        return jsonError(
          422,
          e.code,
          "AIの安全フィルタにより出力できませんでした。プロンプトの表現を変えて再挑戦してください。",
        );
      case "TIMEOUT":
        return jsonError(504, e.code, "応答がタイムアウトしました。再試行してください。");
      case "PARSE_FAILED":
        return jsonError(502, e.code, "採点結果の取得に失敗しました。再試行してください。");
      case "INVALID_KEY":
        // 無料枠では開発者キーの問題＝サーバー側の問題として扱う
        return jsonError(500, "SERVER_MISCONFIGURED", "サーバー設定エラーです。");
    }
  }
  return jsonError(500, "UNKNOWN", "予期しないエラーが発生しました。");
}

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}
