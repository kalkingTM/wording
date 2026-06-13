import type { PlayResult, PlaySession } from "@/types/game";

/**
 * クライアント専用の localStorage ヘルパー。
 * BYOKキーはここ以外で読み書きしないこと（サーバーへは一切送らない。仕様 3-2）。
 *
 * 【フェーズ2で本格利用】UI実装時にここを唯一のストレージ窓口とする。
 */

const KEYS = {
  byokApiKey: "rpg.byokApiKey",
  dailyPlays: "rpg.dailyPlays",
  results: "rpg.results",
} as const;

/** SSR/プリレンダリング時は localStorage が存在しないため必ずガードする */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// ---- BYOK ----

export function getByokKey(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEYS.byokApiKey);
}

export function setByokKey(key: string): void {
  localStorage.setItem(KEYS.byokApiKey, key);
}

export function clearByokKey(): void {
  localStorage.removeItem(KEYS.byokApiKey);
}

// ---- 無料枠の残回数表示（UX層。防御はサーバー側レート制限が担う） ----

interface DailyPlays {
  day: string; // YYYY-MM-DD
  count: number;
}

export function getTodayPlayCount(): number {
  if (!isBrowser()) return 0;
  const raw = localStorage.getItem(KEYS.dailyPlays);
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw) as DailyPlays;
    return parsed.day === today() ? parsed.count : 0;
  } catch {
    return 0;
  }
}

export function incrementTodayPlayCount(): void {
  const next: DailyPlays = { day: today(), count: getTodayPlayCount() + 1 };
  localStorage.setItem(KEYS.dailyPlays, JSON.stringify(next));
}

// ---- プレイ履歴（将来の成長ダッシュボード・DB移行の基盤。仕様 5-2） ----

export function getPlayResults(): PlayResult[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(KEYS.results);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PlayResult[];
  } catch {
    return [];
  }
}

export function appendPlayResult(result: PlayResult): void {
  const all = [...getPlayResults(), result];
  localStorage.setItem(KEYS.results, JSON.stringify(all));
}

/** 同一ステージの直近スコア（再挑戦ループの前回比表示に使う。仕様 4-2） */
export function getLastResultForStage(stageId: string): PlayResult | undefined {
  return getPlayResults()
    .filter((r) => r.stageId === stageId)
    .at(-1);
}

// ---- 進行中の2段階セッション（sessionStorage。リロードで無料枠を無駄にしない） ----

const SESSION_KEY_PREFIX = "rpg.session.";

export function getPlaySession(stageId: string): PlaySession | null {
  if (!isBrowser()) return null;
  const raw = sessionStorage.getItem(SESSION_KEY_PREFIX + stageId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlaySession;
  } catch {
    return null;
  }
}

export function savePlaySession(session: PlaySession): void {
  try {
    sessionStorage.setItem(
      SESSION_KEY_PREFIX + session.stageId,
      JSON.stringify(session),
    );
  } catch {
    // 容量超過等で保存できなくても進行は止めない（復元できないだけ）
  }
}

export function clearPlaySession(stageId: string): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(SESSION_KEY_PREFIX + stageId);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
