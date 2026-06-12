"use client";

import { useState } from "react";
import { GeminiProvider } from "@/lib/ai/gemini";
import { clearByokKey, getByokKey, setByokKey } from "@/lib/client/storage";

type TestState = "idle" | "testing" | "ok" | "ng";

/**
 * BYOK（APIキー持ち込み）設定フォーム。
 * キーは localStorage のみに保存し、サーバーへは一切送らない（仕様 3-2）。
 * 「キーをテスト」はブラウザからGeminiへ直接軽量リクエストを送って検証する。
 */
export default function ByokSettings({
  onChange,
}: {
  onChange?: () => void;
}) {
  const [keyInput, setKeyInput] = useState("");
  const [saved, setSaved] = useState(() => Boolean(getByokKey()));
  const [testState, setTestState] = useState<TestState>("idle");

  const handleTest = async () => {
    if (!keyInput.trim()) return;
    setTestState("testing");
    const ok = await new GeminiProvider(keyInput.trim()).validateKey();
    setTestState(ok ? "ok" : "ng");
  };

  const handleSave = () => {
    if (!keyInput.trim()) return;
    setByokKey(keyInput.trim());
    setKeyInput("");
    setSaved(true);
    setTestState("idle");
    onChange?.();
  };

  const handleClear = () => {
    clearByokKey();
    setSaved(false);
    setTestState("idle");
    onChange?.();
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold tracking-tight">APIキー設定（BYOK）</h2>
        {saved ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            設定済み・無制限プレイ
          </span>
        ) : (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            未設定・無料モード
          </span>
        )}
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
        ご自身のGemini APIキーを設定すると、回数無制限かつ入力データが学習に使われない環境でプレイできます。キーは
        <strong className="text-stone-700 dark:text-stone-300">
          このブラウザの中（localStorage）にのみ保存され、当サービスのサーバーには送信されません
        </strong>
        。
      </p>

      {saved ? (
        <div className="mt-4">
          <button
            onClick={handleClear}
            className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-600 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            キーを削除して無料モードに戻す
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="password"
            value={keyInput}
            onChange={(e) => {
              setKeyInput(e.target.value);
              setTestState("idle");
            }}
            placeholder="Gemini APIキーを入力（AIza... / AQ....）"
            className="flex-1 rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/5 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-stone-500 dark:focus:ring-white/10"
            autoComplete="off"
          />
          <div className="flex gap-2">
            <button
              onClick={handleTest}
              disabled={!keyInput.trim() || testState === "testing"}
              className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-40 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              {testState === "testing" ? "確認中…" : "キーをテスト"}
            </button>
            <button
              onClick={handleSave}
              disabled={!keyInput.trim()}
              className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-40 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {testState === "ok" && (
        <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
          ✓ キーは有効です。保存してご利用ください。
        </p>
      )}
      {testState === "ng" && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          ✗ キーを確認できませんでした。入力内容をお確かめください。
        </p>
      )}
    </section>
  );
}
