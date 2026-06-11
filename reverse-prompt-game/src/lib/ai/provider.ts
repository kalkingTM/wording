import type { EvaluationResult, Stage } from "@/types/game";

/**
 * AIプロバイダの抽象化レイヤ（project_spec.md 3-3）。
 *
 * 実装は環境を問わない（isomorphic）こと:
 * - 無料枠モード: サーバー（Route Handler）が環境変数キーで生成する
 * - BYOKモード: ブラウザが localStorage のユーザーキーで生成し、直接AIを呼ぶ
 *
 * 将来「複数の生成AIツールを使い分けるワークフロー学習」へ拡張する際は、
 * このインターフェースの実装を追加する。
 */
export interface AIProvider {
  /** このプロバイダが使うモデルID（PlayResult.modelId に記録する） */
  readonly modelId: string;

  /** お題とユーザープロンプトを採点し、Before/After含む結果を返す */
  evaluate(input: EvaluateInput): Promise<EvaluationResult>;

  /** BYOKの「キーをテスト」用。軽量なリクエストでキーの有効性を確認する */
  validateKey(): Promise<boolean>;
}

export interface EvaluateInput {
  stage: Stage;
  userPrompt: string;
}
