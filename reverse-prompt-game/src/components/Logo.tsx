/**
 * Wording のロゴマーク（案2: 角丸スクエア + 幾何学W + 金色ドット）。
 * フォント依存を避けるため W はポリラインで描画し、全環境で同一の形状を保証する。
 *
 * - solid:   ヘッダー等の通常表示。ライト=黒地/白W、ダーク=白地/黒W、ドットは常にアンバー
 * - outline: 背景透かし用。全要素を currentColor で描き、text-* クラスの色と不透明度に従う
 */
export default function LogoMark({
  variant = "solid",
  className,
}: {
  variant?: "solid" | "outline";
  className?: string;
}) {
  if (variant === "outline") {
    return (
      <svg viewBox="0 0 52 52" fill="none" className={className} aria-hidden="true">
        <rect x="2" y="2" width="48" height="48" rx="12" stroke="currentColor" strokeWidth="3" />
        <polyline
          points="10 17 16.5 35 23.5 21 30.5 35 37 17"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="41.5" cy="35" r="3.5" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 52 52" className={className} aria-hidden="true">
      <rect width="52" height="52" rx="13" className="fill-stone-900 dark:fill-stone-100" />
      <polyline
        points="10 17 16.5 35 23.5 21 30.5 35 37 17"
        fill="none"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-stone-50 dark:stroke-stone-900"
      />
      <circle cx="41.5" cy="35" r="3.5" className="fill-amber-500" />
    </svg>
  );
}
