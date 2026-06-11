import type { Stage } from "@/types/game";

/**
 * ステージ（お題）定義。コードから分離されたデータとして管理する（仕様 5-1）。
 * 新しいお題はこの配列に追加するだけで反映される。
 *
 * 【フェーズ3で拡充】初期は構成検証用の1ステージのみ。
 */
export const stages: Stage[] = [
  {
    id: "tax-for-students",
    title: "税金のしくみを、はじめての人に",
    description:
      "「所得税と住民税の違い」を、税金について学んだことのない大学1年生に説明する文章を、AIに書かせるためのプロンプトを作成してください。",
    difficulty: 1,
    targetAudience: "前提知識のない大学1年生",
    goal: "専門性（正確さ）と平易さ（わかりやすさ）を両立した解説文を引き出す",
    rubricHints: [
      "読者のレベル（前提知識なし）が指定されているか",
      "出力の形式・分量・トーンが指定されているか",
      "専門用語の扱い方（例え話・用語解説）への指示があるか",
    ],
    passingScore: 80,
  },
];

export function getStageById(id: string): Stage | undefined {
  return stages.find((s) => s.id === id);
}
