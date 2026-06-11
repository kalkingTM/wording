/**
 * サーバー側レート制限（防御層）。project_spec.md 3-1。
 *
 * LocalStorageの回数表示はUX用であり、開発者キーの保護は本モジュールが担う。
 * APIルートはcurl等で直接叩けるため、ここを通らない無料枠呼び出しは存在させないこと。
 *
 * 【フェーズ3で本実装】Upstash Redis（@upstash/ratelimit）によるIPベースの
 * 固定ウィンドウ制限（1日3回）に差し替える。フェーズ1〜2のローカル開発では
 * インメモリ実装で代用する（サーバーレスでは永続しない点に注意）。
 */

import { FREE_PLAYS_PER_DAY } from "@/lib/constants";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export interface RateLimiter {
  /** 1回分を消費する。並行リクエストの突破を防ぐため「先取り」方式 */
  check(identifier: string): Promise<RateLimitResult>;
  /** AI呼び出しが失敗した場合に1回分を返金する（失敗でプレイ回数を減らさない） */
  refund(identifier: string): Promise<void>;
}

/** ローカル開発用のインメモリ実装。本番では Upstash 実装に置き換える */
class InMemoryRateLimiter implements RateLimiter {
  private counts = new Map<string, { day: string; count: number }>();

  async check(identifier: string): Promise<RateLimitResult> {
    const entry = this.counts.get(identifier);
    const count = entry?.day === today() ? entry.count : 0;

    if (count >= FREE_PLAYS_PER_DAY) {
      return { allowed: false, remaining: 0 };
    }
    this.counts.set(identifier, { day: today(), count: count + 1 });
    return { allowed: true, remaining: FREE_PLAYS_PER_DAY - count - 1 };
  }

  async refund(identifier: string): Promise<void> {
    const entry = this.counts.get(identifier);
    if (entry?.day === today() && entry.count > 0) {
      entry.count -= 1;
    }
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

let limiter: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!limiter) {
    // TODO(フェーズ3): UPSTASH_REDIS_REST_URL が設定されていれば Upstash 実装を返す
    limiter = new InMemoryRateLimiter();
  }
  return limiter;
}
