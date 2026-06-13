import type { EvaluationResult } from "@/types/game";
import { AIError, errorCodeFromStatus } from "@/types/errors";
import type { AIProvider, EvaluateInput } from "./provider";
import { buildEvaluationPrompt } from "./promptTemplates";
import { evaluationResponseSchema } from "./schema";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
export const DEFAULT_MODEL_ID = "gemini-2.5-flash";

/** 採点の再現性を高めるため低めに固定（仕様 4-1） */
const EVALUATION_TEMPERATURE = 0.2;
const REQUEST_TIMEOUT_MS = 60_000;

/**
 * Gemini実装。fetch のみで構成し、サーバー（無料枠）とブラウザ（BYOK）の
 * 両方から同一コードで動くようにしている（SDKに依存しない）。
 */
export class GeminiProvider implements AIProvider {
  constructor(
    private readonly apiKey: string,
    public readonly modelId: string = DEFAULT_MODEL_ID,
  ) {}

  async evaluate(input: EvaluateInput): Promise<EvaluationResult> {
    // スキーマ不一致と一時的過負荷（Gemini 503等）は1回だけ自動リトライ（仕様 3-4）
    try {
      return await this.evaluateOnce(input);
    } catch (e) {
      if (
        e instanceof AIError &&
        (e.code === "PARSE_FAILED" || e.code === "OVERLOADED")
      ) {
        if (e.code === "OVERLOADED") {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        return await this.evaluateOnce(input);
      }
      throw e;
    }
  }

  private async evaluateOnce(input: EvaluateInput): Promise<EvaluationResult> {
    const body = {
      contents: [
        { role: "user", parts: [{ text: buildEvaluationPrompt(input) }] },
      ],
      generationConfig: {
        temperature: EVALUATION_TEMPERATURE,
        responseMimeType: "application/json",
        responseSchema: evaluationResponseSchema,
      },
    };

    const data = await this.request(
      `/models/${this.modelId}:generateContent`,
      body,
    );

    const candidate = data?.candidates?.[0];
    if (!candidate || candidate.finishReason === "SAFETY") {
      throw new AIError("SAFETY_BLOCKED");
    }
    const text = candidate?.content?.parts?.[0]?.text;
    if (!text) throw new AIError("PARSE_FAILED", "empty response");

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new AIError("PARSE_FAILED", "invalid JSON");
    }
    return normalizeResult(parsed);
  }

  async validateKey(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/models?key=${this.apiKey}`, {
        signal: AbortSignal.timeout(10_000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async request(path: string, body: unknown): Promise<any> {
    return requestJson(`${API_BASE}${path}?key=${this.apiKey}`, body);
  }
}

/**
 * スキーマ検証と正規化。JSONとしてパースできても欠損・範囲外の可能性があるため、
 * サブスコアを0〜25にクランプし、合計は必ずクライアント側で再計算する
 * （モデルに「total=100にしろ」と指示するインジェクションへのデータレベル防御を兼ねる）。
 */
function normalizeResult(raw: unknown): EvaluationResult {
  const r = raw as Partial<EvaluationResult> | null;
  const s = r?.scores as Partial<EvaluationResult["scores"]> | undefined;

  const requiredStrings = [
    r?.feedback,
    r?.hint,
    r?.userOutput,
    r?.improvedPrompt,
    r?.idealOutput,
  ];
  if (!r || !s || requiredStrings.some((v) => typeof v !== "string" || !v.trim())) {
    throw new AIError("PARSE_FAILED", "missing fields");
  }

  const clamp = (v: unknown): number =>
    Math.max(0, Math.min(25, Math.round(typeof v === "number" ? v : 0)));

  const clarity = clamp(s.clarity);
  const specificity = clamp(s.specificity);
  const structure = clamp(s.structure);
  const fitness = clamp(s.fitness);

  return {
    scores: {
      clarity,
      specificity,
      structure,
      fitness,
      total: clarity + specificity + structure + fitness,
    },
    feedback: r.feedback as string,
    hint: r.hint as string,
    userOutput: r.userOutput as string,
    improvedPrompt: r.improvedPrompt as string,
    idealOutput: r.idealOutput as string,
    injectionDetected: Boolean(r.injectionDetected),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requestJson(url: string, body: unknown): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      throw new AIError("TIMEOUT");
    }
    throw new AIError("TIMEOUT", "network error");
  }

  if (!res.ok) {
    // Geminiは無効キーを 401/403 ではなく 400 (API_KEY_INVALID) で返すことがある
    const errBody = await res.text().catch(() => "");
    if (res.status === 400 && errBody.includes("API_KEY_INVALID")) {
      throw new AIError("INVALID_KEY", "API key invalid");
    }
    throw new AIError(errorCodeFromStatus(res.status), `HTTP ${res.status}`);
  }
  return res.json();
}
