'use client';

import React, { useState } from 'react';
import {
  Clock,
  Activity,
  Zap,
  Share2,
  X,
  ArrowRight,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';
import { SymptomDuration } from '@/types/medical';

interface FollowUpModalProps {
  onConfirmStartAssessment: (geminiApiKey?: string) => void;
}

const DURATION_OPTIONS: { value: SymptomDuration; label: string; desc: string }[] = [
  { value: 'hours', label: '數小時內', desc: '今天剛發生的急性不適' },
  { value: 'days_1_3', label: '1 ～ 3 天', desc: '近幾日出現的短期病程' },
  { value: 'weeks_1_2', label: '1 ～ 2 週', desc: '持續一週以上的亞急性狀況' },
  { value: 'over_1_month', label: '超過 1 個月', desc: '反覆發作或慢性持續症狀' },
];

export function FollowUpModal({
  onConfirmStartAssessment,
}: FollowUpModalProps) {
  const {
    isFollowUpModalOpen,
    setFollowUpModalOpen,
    followUpAnswers,
    updateFollowUpAnswers,
  } = useHealthStore();

  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  if (!isFollowUpModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-8">
        {/* 頂部標題 */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-700 to-indigo-800 text-white flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded font-bold">
              模組 C：輕量化動態追問
            </span>
            <h2 className="text-base sm:text-lg font-extrabold mt-1">
              補足 4 項關鍵臨床特徵（僅需 15 秒）
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setFollowUpModalOpen(false)}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 題精簡臨床追問表單 */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Q1: 症狀持續時間 */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-slate-800">
              <Clock className="w-4 h-4 text-sky-600" />
              1. 這次的主要症狀已經持續多久了？
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map((opt) => {
                const active = followUpAnswers.duration === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateFollowUpAnswers({ duration: opt.value })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      active
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold">{opt.label}</div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        active ? 'text-sky-100' : 'text-slate-500'
                      }`}
                    >
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q2: 整體不適或疼痛程度 (1~10 分 VAS) */}
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-slate-800">
                <Activity className="w-4 h-4 text-rose-600" />
                2. 整體疼痛或不適程度（1～10 分）：
              </label>
              <span
                className={`text-sm font-black px-2.5 py-0.5 rounded-full ${
                  followUpAnswers.severityScore >= 7
                    ? 'bg-rose-600 text-white'
                    : followUpAnswers.severityScore >= 4
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {followUpAnswers.severityScore} / 10 分
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={10}
              value={followUpAnswers.severityScore}
              onChange={(e) =>
                updateFollowUpAnswers({ severityScore: Number(e.target.value) })
              }
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>1-3 分：輕微不適，不影響日常活動</span>
              <span>4-6 分：中度不適，干擾專注與睡眠</span>
              <span>7-10 分：劇烈疼痛，難以忍受</span>
            </div>
          </div>

          {/* Q3: 是否突發劇痛 */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-slate-800">
              <Zap className="w-4 h-4 text-amber-500" />
              3. 是否為「突然在幾秒或幾分鐘內」瞬間爆發的劇烈症狀？
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateFollowUpAnswers({ isSuddenOnset: false })}
                className={`p-3 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                  !followUpAnswers.isSuddenOnset
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                否，是慢慢出現或漸進加重的
              </button>
              <button
                type="button"
                onClick={() => updateFollowUpAnswers({ isSuddenOnset: true })}
                className={`p-3 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                  followUpAnswers.isSuddenOnset
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                是，突然瞬間爆發至最高點
              </button>
            </div>
          </div>

          {/* Q4: 疼痛是否會放射至其他部位 */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-slate-800">
              <Share2 className="w-4 h-4 text-indigo-600" />
              4. 疼痛或酸麻感是否會「延伸／放射」到其他部位？
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateFollowUpAnswers({ hasRadiation: false })}
                className={`p-3 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                  !followUpAnswers.hasRadiation
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                否，僅固定在勾選的部位
              </button>
              <button
                type="button"
                onClick={() => updateFollowUpAnswers({ hasRadiation: true })}
                className={`p-3 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                  followUpAnswers.hasRadiation
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                是，會延伸放射到其他部位
              </button>
            </div>

            {followUpAnswers.hasRadiation && (
              <div className="pt-1">
                <input
                  type="text"
                  value={followUpAnswers.radiationTargetNote || ''}
                  onChange={(e) =>
                    updateFollowUpAnswers({ radiationTargetNote: e.target.value })
                  }
                  placeholder="選填放射延伸部位（例如：左肩、左上臂內側、下巴、後背、右肩胛、小腿）..."
                  className="w-full px-3.5 py-2 text-xs bg-indigo-50/50 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* 選填 Gemini API Key 雙引擎切換區 */}
          <div className="border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="text-xs text-slate-500 hover:text-sky-700 flex items-center gap-1.5 font-medium"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>
                {showApiKeyInput
                  ? '隱藏進階 AI 設定'
                  : '進階選填：使用自訂 Gemini API Key 增強跨專科白話潤飾（免填即可 100% 獨立運作）'}
              </span>
            </button>
            {showApiKeyInput && (
              <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="選填：輸入您的 Google Gemini API Key (AIzaSy...)"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[11px] text-slate-500">
                  註：急症紅旗攔截、台灣醫院專科路由與 PubMed 真實文獻檢索皆由確定性程式碼執行；Gemini Key 僅用於潤飾跨系統白話摘要，且僅存於本次記憶體中。
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 底部確認啟動按鈕 */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>第 1 秒優先執行確定性急症紅旗攔截</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setFollowUpModalOpen(false);
              onConfirmStartAssessment(geminiApiKey);
            }}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-extrabold shadow-md flex items-center gap-2 transition-all"
          >
            <span>立即產生 4 階段臨床評估報告</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
