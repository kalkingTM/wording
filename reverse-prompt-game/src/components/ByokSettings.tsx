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
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-navy-900">APIキー設定（BYOK）</h2>
        {saved ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            設定済み・無制限プレイ
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            未設定・無料モード
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-600">
        ご自身のGemini APIキーを設定すると、回数無制限かつ入力データが学習に使われない環境でプレイできます。キーは
        <strong>このブラウザの中（localStorage）にのみ保存され、当サービスのサーバーには送信されません</strong>。
      </p>

      {saved ? (
        <div className="mt-4">
          <button
            onClick={handleClear}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
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
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
            autoComplete="off"
          />
          <div className="flex gap-2">
            <button
              onClick={handleTest}
              disabled={!keyInput.trim() || testState === "testing"}
              className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50 disabled:opacity-40"
            >
              {testState === "testing" ? "確認中…" : "キーをテスト"}
            </button>
            <button
              onClick={handleSave}
              disabled={!keyInput.trim()}
              className="rounded-lg bg-navy-700 px-4 py-2 text-sm font-medium text-white hover:bg-navy-600 disabled:opacity-40"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {testState === "ok" && (
        <p className="mt-2 text-sm text-emerald-600">✓ キーは有効です。保存してご利用ください。</p>
      )}
      {testState === "ng" && (
        <p className="mt-2 text-sm text-red-600">
          ✗ キーを確認できませんでした。入力内容をお確かめください。
        </p>
      )}
    </section>
  );
}
