'use client';

import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import { GeminiModelOption } from '@/types/cdss';

const MODEL_OPTIONS: Array<{ value: GeminiModelOption; label: string }> = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (推薦・極速臨床推理)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (深度跨科病生理推理)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (相容輕量模型)' },
];

export function TopApiControlBar() {
  const { apiSettings, updateApiSettings } = useDiagnosisStore();
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

  const hasValidKey = apiSettings.apiKey.trim().length >= 12;

  const statusConfig = !apiSettings.enabled
    ? {
        dotClass: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
        badgeClass:
          'bg-emerald-950/70 text-emerald-300 border-emerald-500/40',
        label: '使用環境預設（內建西醫確定性引擎 ＋ 真實 PubMed API）',
      }
    : hasValidKey
    ? {
        dotClass: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
        badgeClass: 'bg-cyan-950/80 text-cyan-200 border-cyan-400/50',
        label: `已啟用自訂 API Key（${apiSettings.modelId}）`,
      }
    : {
        dotClass: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
        badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
        label: '未完成設定（請輸入 Gemini API Key，否則自動使用內建引擎）',
      };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/95 px-4 py-2.5 shadow-lg">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* 左側：連線狀態燈號 + 開關 Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-cyan-400 shrink-0" />
            <span className="text-xs font-extrabold text-slate-100">
              AI 鑑別引擎連線設定
            </span>
          </div>

          {/* 連線狀態燈號 */}
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold ${statusConfig.badgeClass}`}
          >
            <span className={`h-2 w-2 rounded-full ${statusConfig.dotClass}`} />
            <span>{statusConfig.label}</span>
          </div>

          {/* 啟用自訂 API Key Toggle */}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={apiSettings.enabled}
              onChange={(e) =>
                updateApiSettings({ enabled: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="relative w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950" />
            <span className="text-xs font-semibold text-slate-300">
              啟用自訂 Gemini API Key
            </span>
          </label>
        </div>

        {/* 右側：API Key 遮罩輸入框 + 模型選擇 + Session/LocalStorage 記憶選項 */}
        {apiSettings.enabled ? (
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 模型選擇 */}
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <select
                value={apiSettings.modelId}
                onChange={(e) =>
                  updateApiSettings({
                    modelId: e.target.value as GeminiModelOption,
                  })
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 密碼遮罩輸入框 */}
            <div className="relative flex-1 min-w-[210px] sm:min-w-[250px]">
              <input
                type={showKeyPlain ? 'text' : 'password'}
                value={apiSettings.apiKey}
                onChange={(e) =>
                  updateApiSettings({ apiKey: e.target.value })
                }
                placeholder="輸入 Gemini API Key (AIza...)"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-3 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKeyPlain((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                title={showKeyPlain ? '隱藏金鑰' : '顯示金鑰'}
              >
                {showKeyPlain ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* SessionStorage 預設 + 可勾選記住於 LocalStorage */}
            <label
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-lg"
              title="預設暫存於 sessionStorage（重新整理不遺失，關閉分頁即清除）；勾選後可長期保存於瀏覽器 localStorage，絕不傳送至第三方伺服器資料庫"
            >
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
              <Lock className="h-3 w-3 text-cyan-400 shrink-0" />
              <span>
                {apiSettings.rememberInLocalStorage
                  ? '已記住於 localStorage'
                  : '僅暫存於 sessionStorage'}
              </span>
            </label>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>
              免金鑰即可完整執行多專科疾病鑑別與 NCBI PubMed 檢索；如需 AI 深度病生理白話生成，可隨時開啟上方開關填入個人金鑰。
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
