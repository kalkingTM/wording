# Wording

プロンプト力を磨く AI コーチングアプリ。ユーザーの言語化能力（5W1H・具体と抽象・構造化）を鍛えるWebアプリ。お題に沿ってプロンプトを書くと、コーチAIが4軸ルーブリック（明確性・具体性・構造化・目的適合、各25点）で採点し、伴走型フィードバックとBefore/After比較を返します。

仕様は [`../project_spec.md`](../project_spec.md)、設計は [`ARCHITECTURE.md`](ARCHITECTURE.md) を参照。

## 技術スタック

- Next.js (App Router) / React / TypeScript / Tailwind CSS
- Google Gemini API（gemini-2.5-flash、structured output）
- Upstash Redis（サーバー側レート制限）/ Vercel

## ローカル開発

```bash
npm install
cp .env.example .env.local   # GEMINI_API_KEY を設定
npm run dev                  # http://localhost:3000
```

| 環境変数 | 必須 | 説明 |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | 無料枠モードで使う開発者キー（[Google AI Studio](https://aistudio.google.com/apikey)で取得） |
| `UPSTASH_REDIS_REST_URL` | 本番のみ | レート制限ストア。未設定時はインメモリにフォールバック |
| `UPSTASH_REDIS_REST_TOKEN` | 本番のみ | 同上 |

> Vercel Marketplace経由でUpstashを接続した場合は `KV_REST_API_URL` / `KV_REST_API_TOKEN` が自動注入されます。コードはどちらの変数名にも対応しています。

## 検証コマンド

```bash
npm run build   # 型チェック込みの本番ビルド
npm run lint    # ESLint
```

## Vercelへのデプロイ手順

1. **GitHubリポジトリを作成**してこのプロジェクトをpushする
2. [Vercel](https://vercel.com) で **Add New → Project** → リポジトリをインポート
   - リポジトリのルートが `Appkaihatsu` の場合、**Root Directory に `reverse-prompt-game` を指定**する
3. **Environment Variables** に `GEMINI_API_KEY` を設定する
4. **Storage → Marketplace → Upstash (Redis)** を無料プランで追加する
   - `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` が自動で環境変数に注入される
5. Deploy を実行する

> **注意:** Upstash未設定のままデプロイするとレート制限がインスタンス毎のインメモリになり、
> サーバーレス環境では実質無効化されます（開発者キーが保護されません）。本番では必ず手順4を行うこと。

## セキュリティ上の前提

- BYOKモードのAPIキーはブラウザの `localStorage` のみに保存され、サーバーへは送信されない
- 無料枠モードはサーバー側でIPベースの1日6回採点制限（1セッション=最大2回採点。LocalStorageの残回数表示はUX用）
- AI応答のサブスコアはサーバー/クライアント側で0〜25にクランプし、合計は再計算する
