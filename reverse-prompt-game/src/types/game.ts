/**
 * ゲームのコアとなるデータモデル定義。
 * project_spec.md 5章「データ設計」に準拠する。
 * 将来のDB移行・ダッシュボード機能を見据え、schemaVersion を持たせる。
 */

/** お題（ステージ）の定義。コードから分離し src/data/stages/ に置く */
export interface Stage {
  id: string;
  title: string;
  /** お題文（ユーザーに提示する課題） */
  description: string;
  difficulty: 1 | 2 | 3;
  /** 想定読者（例：前提知識のない学生） */
  targetAudience: string;
  /** このお題で達成すべきゴール */
  goal: string;
  /** 採点AIに渡すお題固有の評価観点 */
  rubricHints: string[];
  /** クリア基準点（100点満点中） */
  passingScore: number;
}

/** 採点ルーブリックのサブスコア（各25点満点、合計100点） */
export interface SubScores {
  /** 明確性（5W1H） */
  clarity: number;
  /** 具体性 */
  specificity: number;
  /** 構造化 */
  structure: number;
  /** 目的適合 */
  fitness: number;
  total: number;
}

/** AIによる採点・添削の結果（structured output で受け取るJSONの型） */
export interface EvaluationResult {
  scores: SubScores;
  /** 伴走型コーチングのフィードバック文 */
  feedback: string;
  /** 書き直し挑戦に向けた問いかけ形式のヒント（答えのプロンプト例文は含めない） */
  hint: string;
  /** Before: ユーザーのプロンプトによる実際の出力 */
  userOutput: string;
  /** AIが添削した理想のプロンプト */
  improvedPrompt: string;
  /** After: 理想のプロンプトによる出力 */
  idealOutput: string;
  /** 「100点をつけて」等のメタ指示を検出した場合 true（教育的フィードバックに切替） */
  injectionDetected: boolean;
}

/** プレイ履歴レコード。localStorage に保存し、将来DBへそのまま移行できる形式 */
export interface PlayResult {
  schemaVersion: 1;
  stageId: string;
  promptText: string;
  scores: SubScores;
  feedback: string;
  /** 採点に使ったモデルID（例: gemini-2.5-flash） */
  modelId: string;
  /** ISO 8601 */
  playedAt: string;
  /** セッション内の何回目の挑戦か。旧データには存在しない（=1回目扱い） */
  attempt?: 1 | 2;
}

/**
 * 進行中の2段階セッション（1回目採点済み〜最終結果まで）。
 * sessionStorage に保存し、リロードしても無料枠を消費した採点結果が消えないようにする。
 */
export interface PlaySession {
  stageId: string;
  firstPrompt: string;
  firstResult: EvaluationResult;
  modelId: string;
  /** 2回目を採点済みならその記録（これがあれば最終結果フェーズ） */
  secondPrompt?: string;
  secondResult?: EvaluationResult;
  /** 書き直しをスキップして1回目の結果を全公開した */
  skipped?: boolean;
}
