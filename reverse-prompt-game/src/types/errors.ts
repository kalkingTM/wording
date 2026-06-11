/**
 * AI呼び出しのエラー分類。project_spec.md 3-4 に準拠。
 * 無料枠（サーバー経由）とBYOK（クライアント直）の両経路で共通に使う。
 */

export type AIErrorCode =
  /** 無効なAPIキー（401/403） */
  | "INVALID_KEY"
  /** レート超過（429）。無料枠ならBYOK誘導、BYOKならGemini側制限の案内 */
  | "RATE_LIMITED"
  /** Gemini側の一時的な過負荷・障害（500/502/503）。再試行で回復することが多い */
  | "OVERLOADED"
  /** Geminiのセーフティフィルタで出力がブロックされた */
  | "SAFETY_BLOCKED"
  /** タイムアウト・ネットワーク障害 */
  | "TIMEOUT"
  /** structured output のJSONがスキーマ不一致（1回自動リトライ後に投げる） */
  | "PARSE_FAILED"
  | "UNKNOWN";

export class AIError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "AIError";
  }
}

/** HTTPステータス → AIErrorCode の対応（両経路で共通利用） */
export function errorCodeFromStatus(status: number): AIErrorCode {
  if (status === 401 || status === 403) return "INVALID_KEY";
  if (status === 429) return "RATE_LIMITED";
  if (status === 408 || status === 504) return "TIMEOUT";
  if (status === 500 || status === 502 || status === 503) return "OVERLOADED";
  return "UNKNOWN";
}
