/**
 * サーバー側レート制限（防御層）。project_spec.md 3-1。
 *
 * LocalStorageの回数表示はUX用であり、開発者キーの保護は本モジュールが担う。
 * APIルートはcurl等で直接叩けるため、ここを通らない無料枠呼び出しは存在させないこと。
 *
 * 実装の切替:
 * - UPSTASH_REDIS_REST_URL / TOKEN が設定されていれば Upstash Redis（本番用）
 * - 未設定ならインメモリ（ローカル開発用。サーバーレスでは永続しない）
 */

import { FREE_EVALUATIONS_PER_DAY } from "@/lib/constants";

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

    if (count >= FREE_EVALUATIONS_PER_DAY) {
      return { allowed: false, remaining: 0 };
    }
    this.counts.set(identifier, { day: today(), count: count + 1 });
    return { allowed: true, remaining: FREE_EVALUATIONS_PER_DAY - count - 1 };
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

/**
 * 本番用: Upstash Redis のREST APIを直接叩く実装（依存パッケージ不要）。
 * キーは `rl:{日付}:{IP}` の固定ウィンドウ方式。日付がキーに含まれるため
 * 日替わりで自動的にリセットされ、EXPIRE は掃除用に25時間で設定する。
 */
class UpstashRateLimiter implements RateLimiter {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  async check(identifier: string): Promise<RateLimitResult> {
    const key = this.key(identifier);
    try {
      const count = Number(await this.command("INCR", key));
      if (count === 1) {
        await this.command("EXPIRE", key, 60 * 60 * 25);
      }
      if (count > FREE_EVALUATIONS_PER_DAY) {
        return { allowed: false, remaining: 0 };
      }
      return { allowed: true, remaining: FREE_EVALUATIONS_PER_DAY - count };
    } catch (e) {
      // Upstash障害時はフェイルオープン（ゲームを止めない）。露出時間は短い前提
      console.error("[rateLimit] Upstash unavailable, failing open:", e);
      return { allowed: true, remaining: 0 };
    }
  }

  async refund(identifier: string): Promise<void> {
    try {
      await this.command("DECR", this.key(identifier));
    } catch (e) {
      console.error("[rateLimit] refund failed:", e);
    }
  }

  private key(identifier: string): string {
    return `rl:${today()}:${identifier}`;
  }

  private async command(...args: (string | number)[]): Promise<unknown> {
    const path = args.map((a) => encodeURIComponent(String(a))).join("/");
    const res = await fetch(`${this.url}/${path}`, {
      headers: { Authorization: `Bearer ${this.token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Upstash HTTP ${res.status}`);
    }
    const data = (await res.json()) as { result: unknown };
    return data.result;
  }
}

let limiter: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!limiter) {
    // Vercel Marketplace経由のUpstash連携は KV_ プレフィックスで注入されるため両対応する
    const url =
      process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
    limiter =
      url && token
        ? new UpstashRateLimiter(url, token)
        : new InMemoryRateLimiter();
  }
  return limiter;
}
