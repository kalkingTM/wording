# アーキテクチャ概要（フェーズ1時点）

Wording（プロンプト力を磨く AI コーチングアプリ）のハイブリッドAPI方式の骨組み。詳細仕様は [`../project_spec.md`](../project_spec.md) を参照。

## 2つの呼び出し経路

```
【無料枠モード】
ブラウザ ──POST /api/evaluate──▶ Route Handler ──▶ Gemini API
                                  │ ① IPレート制限 (lib/server/rateLimit)
                                  │ ② 環境変数 GEMINI_API_KEY
                                  └ ③ GeminiProvider.evaluate()

【BYOKモード】
ブラウザ ────────────────────────────────────▶ Gemini API
  │ ① localStorage のユーザーキー (lib/client/storage)
  └ ② GeminiProvider.evaluate()  ※キーはサーバーへ一切送らない
```

両経路とも同一の `GeminiProvider`（fetchのみで構成、isomorphic）を使うため、
採点ロジック・スキーマ・エラー分類は1箇所で保守できる。

## ディレクトリ構成

```
src/
├── app/
│   └── api/evaluate/route.ts   # 無料枠モード専用ルート（レート制限＋エラーマッピング）
├── data/
│   └── stages/index.ts         # お題定義（コードから分離されたデータ。仕様5-1）
├── lib/
│   ├── ai/
│   │   ├── provider.ts         # AIProvider インターフェース（将来の複数モデル対応の基盤）
│   │   ├── gemini.ts           # Gemini実装（structured output / 自動リトライ / タイムアウト）
│   │   ├── schema.ts           # responseSchema（EvaluationResultと一致させる）
│   │   └── promptTemplates.ts  # 採点プロンプト（フェーズ3で本実装）
│   ├── client/
│   │   └── storage.ts          # localStorage窓口（BYOKキー・残回数・プレイ履歴）
│   └── server/
│       └── rateLimit.ts        # 防御層（本番: Upstash Redis / ローカル: インメモリ自動切替）
└── types/
    ├── game.ts                 # Stage / SubScores / EvaluationResult / PlayResult
    └── errors.ts               # AIError と HTTPステータスのマッピング
```

## 設計上の決定事項

- **BYOKキーはサーバーに送らない**: 代償として採点プロンプトはBYOKユーザーに閲覧可能（仕様3-2で許容）。
- **レート制限は二層**: LocalStorageは表示用、サーバー側IP制限が防御の本体（仕様3-1）。
- **structured output 必須**: `responseMimeType: application/json` + `responseSchema` でJSONを強制。
- **PlayResult に schemaVersion**: 将来のDB移行・ダッシュボードでの後方互換のため。

## フェーズ進捗

- フェーズ1〜4: 完了（2026-06-11）。エラー分類・スコア正規化・レート制限返金・
  503自動リトライまでQA済み
- 残: Vercelデプロイ（手順は README.md 参照）
