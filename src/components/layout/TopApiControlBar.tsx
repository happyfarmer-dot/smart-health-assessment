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
  ShieldCheck,
  Wifi,
  X,
  XCircle,
} from 'lucide-react';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import { GeminiModelOption } from '@/types/cdss';

const MODEL_OPTIONS: Array<{ value: GeminiModelOption; label: string }> = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (推薦・極速臨床推理)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (深度跨科病生理推理)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (相容輕量模型)' },
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

  // 初始化時從 sessionStorage 或 localStorage 載入已保存的 API 設定
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const sessionRaw = sessionStorage.getItem('cdss-api-session-v4');
      const localRaw = localStorage.getItem('cdss-api-local-v4');
      const raw = sessionRaw || localRaw;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          updateApiSettings({
            enabled: Boolean(parsed.enabled),
            apiKey: String(parsed.apiKey || ''),
            modelId: (parsed.modelId as GeminiModelOption) || 'gemini-2.5-flash',
            rememberInLocalStorage: Boolean(parsed.rememberInLocalStorage),
          });
        }
      }
    } catch {
      // ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleTestConnection = async () => {
    const trimmedKey = apiSettings.apiKey.trim();
    if (!trimmedKey) {
      setApiTestState({
        status: 'error',
        messageZh: '請先輸入 Gemini API Key 再進行連線測試。',
      });
      return;
    }

    setApiTestState({ status: 'testing', messageZh: '正在測試 Gemini API 連線...' });
    const start = performance.now();
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
          trimmedKey
        )}`,
        { method: 'GET' }
      );
      const latencyMs = Math.round(performance.now() - start);

      if (!res.ok) {
        let errReason = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          const msg = errJson?.error?.message || '';
          if (res.status === 400 || res.status === 401 || msg.toLowerCase().includes('api key')) {
            errReason = 'API Key 無效或格式錯誤';
          } else if (res.status === 403) {
            errReason = '權限不足或 Generative Language API 未啟用';
          } else if (res.status === 429) {
            errReason = 'API 額度已達上限 (Quota Exceeded / 429)';
          } else if (msg) {
            errReason = msg;
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

      const data = await res.json();
      const models: Array<{ name?: string }> = Array.isArray(data?.models)
        ? data.models
        : [];
      const geminiModels = models
        .map((m) => (m.name || '').replace(/^models\//, ''))
        .filter((n) => n.startsWith('gemini'));

      const selectedAvailable = geminiModels.includes(apiSettings.modelId)
        ? apiSettings.modelId
        : geminiModels[0] || apiSettings.modelId;

      setApiTestState({
        status: 'success',
        latencyMs,
        verifiedModelsCount: geminiModels.length,
        messageZh: `連線成功（${latencyMs} ms・可用模型 ${selectedAvailable} 等共 ${geminiModels.length} 項）`,
      });
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      const errMsg = err instanceof Error ? err.message : '網路連線異常';
      setApiTestState({
        status: 'error',
        latencyMs,
        messageZh: `網路異常或無法連線（${errMsg}）`,
      });
    }
  };

  const hasValidKey = apiSettings.apiKey.trim().length >= 12;

  const statusConfig = !apiSettings.enabled
    ? {
        dotClass: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
        textClass: 'text-emerald-300',
        label: '基礎規則模式（內建西醫引擎＋PubMed）',
      }
    : apiTestState.status === 'success'
    ? {
        dotClass: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
        textClass: 'text-emerald-300',
        label: `已連線 Gemini API（${apiSettings.modelId}・驗證通過 ${apiTestState.latencyMs ?? ''}ms）`,
      }
    : apiTestState.status === 'error'
    ? {
        dotClass: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]',
        textClass: 'text-rose-300',
        label: `Gemini API 驗證失敗（點擊右側檢查金鑰）`,
      }
    : hasValidKey
    ? {
        dotClass: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
        textClass: 'text-cyan-200',
        label: `已填入 Gemini API Key（${apiSettings.modelId}・尚未測試）`,
      }
    : {
        dotClass: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
        textClass: 'text-amber-300',
        label: '未輸入 API Key（將自動降級基礎規則模式）',
      };

  return (
    <>
      {/* 單行精簡狀態列 */}
      <div className="w-full rounded-xl border border-slate-800/90 bg-slate-900/90 px-3 sm:px-4 py-2 shadow-md flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${statusConfig.dotClass}`}
          />
          <span
            className={`text-[11px] sm:text-xs font-bold truncate ${statusConfig.textClass}`}
          >
            {statusConfig.label}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setApiModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950/90 hover:bg-slate-800 hover:border-cyan-500/50 px-2.5 py-1 text-[11px] font-bold text-slate-200 shrink-0 transition-colors"
        >
          <Settings2 className="h-3.5 w-3.5 text-cyan-400" />
          <span>設定 API Key</span>
        </button>
      </div>

      {/* API Key 設定 Modal 彈窗 */}
      {isApiModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={() => setApiModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-extrabold text-white">
                  AI 鑑別引擎連線設定
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
                  啟用自訂 Gemini API Key
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  開啟後可搭配 AI 進行深度病生理白話生成與動態追問
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
              <div className="relative w-10 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950 shrink-0" />
            </label>

            {apiSettings.enabled ? (
              <div className="space-y-3">
                {/* 模型選擇 */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                    選擇推理模型
                  </label>
                  <select
                    value={apiSettings.modelId}
                    onChange={(e) =>
                      updateApiSettings({
                        modelId: e.target.value as GeminiModelOption,
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  >
                    {MODEL_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 密碼遮罩輸入框 + 測試連線按鈕 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Gemini API Key
                  </label>
                  <div className="flex items-stretch gap-2">
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
                      onClick={handleTestConnection}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/50 bg-cyan-950/70 hover:bg-cyan-900/80 px-3 py-2 text-xs font-extrabold text-cyan-200 shrink-0 disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      {apiTestState.status === 'testing' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" />
                      ) : (
                        <Wifi className="h-3.5 w-3.5 text-cyan-300" />
                      )}
                      <span>
                        {apiTestState.status === 'testing'
                          ? '測試中...'
                          : '測試連線'}
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

                {/* SessionStorage / LocalStorage 記憶選項 */}
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-950/70 border border-slate-800 px-3 py-2 rounded-xl">
                  <input
                    type="checkbox"
                    checked={apiSettings.rememberInLocalStorage}
                    onChange={(e) =>
                      updateApiSettings({
                        rememberInLocalStorage: e.target.checked,
                      })
                    }
                    className="rounded border-slate-700 bg-slate-900 accent-cyan-400"
                  />
                  <Lock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>
                    {apiSettings.rememberInLocalStorage
                      ? '已勾選：長期記住於瀏覽器 localStorage（不傳送至伺服器）'
                      : '預設：僅暫存於 sessionStorage（關閉分頁即清除）'}
                  </span>
                </label>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-200 leading-relaxed">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  免金鑰即可完整執行現代實證西醫多專科疾病鑑別與 NCBI PubMed 真實文獻檢索。
                </span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setApiModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold transition-colors"
              >
                完成設定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
