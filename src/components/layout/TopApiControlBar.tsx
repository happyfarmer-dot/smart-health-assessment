'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Settings2,
  Sparkles,
  Wifi,
  X,
  XCircle,
} from 'lucide-react';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import { GeminiModelOption } from '@/types/cdss';

const PRESET_MODEL_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (推薦・極速多模態臨床推理)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (深度跨科病生理推理)' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (輕量高速)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (相容模型)' },
];

export function TopApiControlBar() {
  const {
    apiSettings,
    isApiModalOpen,
    apiTestState,
    updateApiSettings,
    setApiModalOpen,
    setApiTestState,
  } = useDiagnosisStore();
  const [showKeyPlain, setShowKeyPlain] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');
  const [useCustomModelInput, setUseCustomModelInput] = useState(false);

  // 初始化時同步 sessionStorage（若為僅本次工作階段記憶模式）與自訂模型狀態
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const sessionRaw = sessionStorage.getItem('cdss-api-session-v4');
      const localRaw = localStorage.getItem('cdss-api-local-v4');
      const raw = sessionRaw || localRaw;
      if (raw && !apiSettings.apiKey) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.apiKey) {
          updateApiSettings({
            enabled: Boolean(parsed.enabled),
            apiKey: String(parsed.apiKey || ''),
            modelId: (parsed.modelId as GeminiModelOption) || 'gemini-2.5-flash',
            rememberInLocalStorage:
              parsed.rememberInLocalStorage === undefined
                ? true
                : Boolean(parsed.rememberInLocalStorage),
          });
        }
      }
    } catch {
      // ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const isPreset = PRESET_MODEL_OPTIONS.some(
      (m) => m.value === apiSettings.modelId
    );
    if (!isPreset && apiSettings.modelId) {
      setUseCustomModelInput(true);
      setCustomModelInput(apiSettings.modelId);
    }
  }, [apiSettings.modelId]);

  // 支援 ESC 鍵關閉 API 設定彈窗
  useEffect(() => {
    if (!isApiModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setApiModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isApiModalOpen, setApiModalOpen]);

  const handleSaveAndTestConnection = async () => {
    const trimmedKey = apiSettings.apiKey.trim();
    const targetModel = (
      useCustomModelInput ? customModelInput : apiSettings.modelId
    ).trim() || 'gemini-2.5-flash';

    if (!trimmedKey || trimmedKey.length < 12) {
      setApiTestState({
        status: 'error',
        messageZh: '請先輸入有效的 Gemini API Key（通常以 AIza 開頭）再進行測試。',
      });
      return;
    }

    updateApiSettings({
      apiKey: trimmedKey,
      modelId: targetModel,
    });

    setApiTestState({
      status: 'testing',
      messageZh: `正在驗證金鑰與模型 (${targetModel})...`,
    });
    const start = performance.now();
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          targetModel
        )}:generateContent?key=${encodeURIComponent(trimmedKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'ping' }] }],
            generationConfig: { maxOutputTokens: 4 },
          }),
        }
      );
      const latencyMs = Math.round(performance.now() - start);

      if (!res.ok) {
        let errReason = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          const msg = errJson?.error?.message || '';
          if (
            res.status === 400 ||
            res.status === 401 ||
            msg.toLowerCase().includes('api key')
          ) {
            errReason = `HTTP ${res.status}：API Key 無效或格式錯誤 (${msg})`;
          } else if (res.status === 404) {
            errReason = `HTTP 404：找不到模型「${targetModel}」，請切換或手動輸入有效模型 ID`;
          } else if (res.status === 403) {
            errReason = `HTTP 403：權限不足或 Generative Language API 未啟用`;
          } else if (res.status === 429) {
            errReason = `HTTP 429：API 額度或速率已達上限 (${msg})`;
          } else if (msg) {
            errReason = `HTTP ${res.status}：${msg}`;
          }
        } catch {
          // keep status code
        }
        setApiTestState({
          status: 'error',
          latencyMs,
          messageZh: `連線失敗（${errReason}）`,
        });
        return;
      }

      // 連線測試通過：自動強制啟用 Gemini AI 深度模式
      updateApiSettings({
        enabled: true,
        apiKey: trimmedKey,
        modelId: targetModel,
      });

      setApiTestState({
        status: 'success',
        latencyMs,
        messageZh: `驗證成功（${latencyMs} ms・已自動啟用 ${targetModel} 深度臨床推理）`,
      });
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      const errMsg = err instanceof Error ? err.message : '網路連線異常';
      setApiTestState({
        status: 'error',
        latencyMs,
        messageZh: `網路異常或 CORS 阻擋（${errMsg}）`,
      });
    }
  };

  const hasValidKey = apiSettings.apiKey.trim().length >= 12;
  const isGeminiActive = apiSettings.enabled && hasValidKey;

  const statusConfig =
    isGeminiActive && apiTestState.status === 'success'
      ? {
          dotClass: 'bg-emerald-400 shadow-[0_0_10px_#34d399]',
          textClass: 'text-emerald-300',
          barClass: 'border-emerald-500/40 bg-emerald-950/35',
          label: `Gemini AI 深度模式（${apiSettings.modelId}・已驗證 ${apiTestState.latencyMs ?? ''}ms）`,
        }
      : isGeminiActive && apiTestState.status === 'error'
      ? {
          dotClass: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]',
          textClass: 'text-rose-300',
          barClass: 'border-rose-500/40 bg-rose-950/30',
          label: `Gemini AI 連線異常（${apiSettings.modelId}・點擊右側檢查）`,
        }
      : isGeminiActive
      ? {
          dotClass: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
          textClass: 'text-emerald-300',
          barClass: 'border-emerald-500/35 bg-slate-900/90',
          label: `Gemini AI 深度模式（${apiSettings.modelId}・建議按測試驗證）`,
        }
      : {
          dotClass: 'bg-slate-400',
          textClass: 'text-slate-300',
          barClass: 'border-slate-800/90 bg-slate-900/90',
          label: '基礎規則模式（內建西醫引擎＋PubMed）',
        };

  return (
    <>
      {/* 單行精簡狀態列 */}
      <div
        className={`w-full rounded-xl border px-3 sm:px-4 py-2 shadow-md flex items-center justify-between gap-2 transition-colors ${statusConfig.barClass}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusConfig.dotClass}`}
          />
          {isGeminiActive && (
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          )}
          <span
            className={`text-[11px] sm:text-xs font-bold truncate ${statusConfig.textClass}`}
          >
            {statusConfig.label}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setApiModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950/90 hover:bg-slate-800 hover:border-cyan-500/50 px-2.5 py-1 text-[11px] font-bold text-slate-200 shrink-0 transition-colors cursor-pointer"
        >
          <Settings2 className="h-3.5 w-3.5 text-cyan-400" />
          <span>{isGeminiActive ? 'AI 模型與金鑰設定' : '設定 Gemini API'}</span>
        </button>
      </div>

      {/* API Key 設定 Modal 彈窗 */}
      {isApiModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={() => setApiModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-extrabold text-white">
                  Gemini AI 鑑別引擎連線設定
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApiModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
                aria-label="關閉設定視窗"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 狀態提示 */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${statusConfig.dotClass}`}
              />
              <span className={`font-semibold ${statusConfig.textClass}`}>
                目前狀態：{statusConfig.label}
              </span>
            </div>

            {/* 啟用 Toggle */}
            <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3 cursor-pointer select-none">
              <div>
                <div className="text-xs font-bold text-slate-100">
                  使用 Gemini AI 深度推理模式
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  填入有效金鑰並測試通過後將自動開啟；關閉則使用離線基礎規則模式
                </div>
              </div>
              <input
                type="checkbox"
                checked={apiSettings.enabled}
                onChange={(e) =>
                  updateApiSettings({ enabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="relative w-10 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-slate-950 shrink-0" />
            </label>

            <div className="space-y-3">
              {/* 模型選擇 + 手動輸入自訂模型 ID */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                    選擇或指定 Gemini 模型 ID
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomModelInput((p) => !p)}
                    className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    {useCustomModelInput ? '切回預設清單' : '手動輸入模型 ID'}
                  </button>
                </div>

                {useCustomModelInput ? (
                  <input
                    type="text"
                    value={customModelInput}
                    onChange={(e) => {
                      setCustomModelInput(e.target.value);
                      updateApiSettings({ modelId: e.target.value.trim() });
                    }}
                    placeholder="例如：gemini-2.5-flash 或 gemini-2.5-pro"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                ) : (
                  <select
                    value={apiSettings.modelId}
                    onChange={(e) =>
                      updateApiSettings({
                        modelId: e.target.value as GeminiModelOption,
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  >
                    {PRESET_MODEL_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 密碼遮罩輸入框 + 儲存並測試連線按鈕 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Gemini API Key
                </label>
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKeyPlain ? 'text' : 'password'}
                      value={apiSettings.apiKey}
                      onChange={(e) =>
                        updateApiSettings({ apiKey: e.target.value })
                      }
                      placeholder="輸入 Gemini API Key (AIza...)"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-3 pr-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyPlain((p) => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      title={showKeyPlain ? '隱藏金鑰' : '顯示金鑰'}
                    >
                      {showKeyPlain ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={apiTestState.status === 'testing'}
                    onClick={handleSaveAndTestConnection}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/60 bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-extrabold text-slate-950 shrink-0 disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {apiTestState.status === 'testing' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Wifi className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {apiTestState.status === 'testing'
                        ? '驗證中...'
                        : '儲存並測試連線'}
                    </span>
                  </button>
                </div>

                {/* 連線測試即時結果回饋 */}
                {apiTestState.status !== 'idle' && (
                  <div
                    className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
                      apiTestState.status === 'success'
                        ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
                        : apiTestState.status === 'error'
                        ? 'border-rose-500/40 bg-rose-950/40 text-rose-200'
                        : 'border-cyan-500/30 bg-cyan-950/30 text-cyan-200'
                    }`}
                  >
                    {apiTestState.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : apiTestState.status === 'error' ? (
                      <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <Loader2 className="h-4 w-4 text-cyan-400 animate-spin shrink-0 mt-0.5" />
                    )}
                    <span className="leading-snug font-medium">
                      {apiTestState.messageZh}
                    </span>
                  </div>
                )}
              </div>

              {/* 持久化策略選項（預設記住於 localStorage，可切換僅本次工作階段） */}
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-950/70 border border-slate-800 px-3 py-2 rounded-xl">
                <input
                  type="checkbox"
                  checked={!apiSettings.rememberInLocalStorage}
                  onChange={(e) =>
                    updateApiSettings({
                      rememberInLocalStorage: !e.target.checked,
                    })
                  }
                  className="rounded border-slate-700 bg-slate-900 accent-cyan-400"
                />
                <Lock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>
                  {apiSettings.rememberInLocalStorage
                    ? '僅本次工作階段記住（目前：預設保存於瀏覽器 localStorage，僅直連 Google API）'
                    : '已開啟僅本次工作階段記住（關閉分頁即自動清除金鑰）'}
                </span>
              </label>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setApiModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer"
              >
                完成並關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
