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
    <section className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900 dark:text-white">APIキー設定（BYOK）</h2>
        {saved ? (
          <span className="rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            設定済み・無制限プレイ
          </span>
        ) : (
          <span className="rounded-full bg-gray-100 dark:bg-slate-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
            未設定・無料モード
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">
        ご自身のGemini APIキーを設定すると、回数無制限かつ入力データが学習に使われない環境でプレイできます。キーは
        <strong>このブラウザの中（localStorage）にのみ保存され、当サービスのサーバーには送信されません</strong>。
      </p>

      {saved ? (
        <div className="mt-4">
          <button
            onClick={handleClear}
            className="rounded-lg border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm text-slate-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
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
            className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-coral dark:focus:border-coral-600 focus:outline-none"
            autoComplete="off"
          />
          <div className="flex gap-2">
            <button
              onClick={handleTest}
              disabled={!keyInput.trim() || testState === "testing"}
              className="rounded-lg border border-coral px-4 py-2 text-sm font-medium text-coral hover:bg-coral-50 dark:hover:bg-coral-900/20 disabled:opacity-40 dark:border-coral-700 dark:text-coral-400"
            >
              {testState === "testing" ? "確認中…" : "キーをテスト"}
            </button>
            <button
              onClick={handleSave}
              disabled={!keyInput.trim()}
              className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-600 disabled:opacity-40 dark:bg-coral-700 dark:hover:bg-coral-600"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {testState === "ok" && (
        <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">✓ キーは有効です。保存してご利用ください。</p>
      )}
      {testState === "ng" && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          ✗ キーを確認できませんでした。入力内容をお確かめください。
        </p>
      )}
    </section>
  );
}
