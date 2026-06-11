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
    // スキーマ不一致は1回だけ自動リトライ（仕様 3-4）
    try {
      return await this.evaluateOnce(input);
    } catch (e) {
      if (e instanceof AIError && e.code === "PARSE_FAILED") {
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

    try {
      return JSON.parse(text) as EvaluationResult;
    } catch {
      throw new AIError("PARSE_FAILED", "invalid JSON");
    }
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
    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}?key=${this.apiKey}`, {
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
      throw new AIError(errorCodeFromStatus(res.status), `HTTP ${res.status}`);
    }
    return res.json();
  }
}
