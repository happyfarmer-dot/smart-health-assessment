'use client';

import React, { useState } from 'react';
import {
  Activity,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Check,
  AlertCircle,
  HeartHandshake,
  PhoneCall,
} from 'lucide-react';
import { SYSTEMIC_SYMPTOMS_BY_CATEGORY } from '@/data/systemicSymptomsCatalog';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import { SystemicCategoryKey } from '@/types/cdss';

export function SystemicSymptomsAccordion() {
  const { systemicSymptomIds, toggleSystemicSymptom } = useDiagnosisStore();

  // Patch #5：全身性症狀面板外層及其內部的各子分類（7 大分類）全部改為「預設摺疊狀態」
  const [isOuterPanelOpen, setIsOuterPanelOpen] = useState(false);

  const [expandedCats, setExpandedCats] = useState<
    Record<SystemicCategoryKey, boolean>
  >({
    temp_metabolic: false,
    psychiatry_sleep: false,
    neuro_psychiatric: false,
    cardio_respiratory: false,
    gi_excretory: false,
    skin_mucosa_appearance: false,
    immune_lymphatic: false,
  });

  const toggleCat = (key: SystemicCategoryKey) => {
    setExpandedCats((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasSelfHarmIdeation = systemicSymptomIds.includes(
    'sys_psych_self_harm_ideation'
  );

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
      {/* 外層面板摺疊按鈕（預設摺疊，顯示已勾選幾項徽章） */}
      <button
        type="button"
        onClick={() => setIsOuterPanelOpen((prev) => !prev)}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-2 text-left hover:bg-slate-900 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-slate-100">
                全身性症狀分類面板（7 大系統・含精神科／身心科與睡眠共 53 項）
              </h3>
              {systemicSymptomIds.length > 0 && (
                <span className="text-xs font-extrabold bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full">
                  已勾選 {systemicSymptomIds.length} 項
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              預設全部摺疊・點擊展開選擇體溫代謝、精神身心、神經平衡、心血管、消化排泄、皮膚黏膜與免疫淋巴症狀
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-3 py-1.5 rounded-xl shrink-0">
          <span>{isOuterPanelOpen ? '收合面板' : '展開全身症狀'}</span>
          {isOuterPanelOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* 若使用者勾選「自我傷害或輕生念頭」，立即顯示溫暖關懷與緊急心理協助資源提示 */}
      {hasSelfHarmIdeation && (
        <div className="mx-4 mb-3 rounded-xl border-2 border-rose-500/70 bg-rose-950/60 p-3.5 text-xs text-rose-100 space-y-1.5">
          <div className="flex items-center gap-2 font-extrabold text-rose-200 text-sm">
            <HeartHandshake className="w-5 h-5 text-rose-400 shrink-0" />
            <span>我們非常關心您的身心安全與感受（緊急心理支持與關懷資源）</span>
          </div>
          <p className="text-rose-200/90 leading-relaxed">
            當您感到極度痛苦或出現自我傷害念頭時，請不要獨自承受。台灣提供 24 小時免費且保密的專業心理支持專線，以及各大醫院精神科／身心科急診與門診團隊隨時願意陪伴並協助您：
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950/90 border border-rose-400/50 px-2.5 py-1 font-bold text-rose-200">
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
              衛福部安心專線：1925（依舊愛我，24 小時免費）
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950/90 border border-rose-400/50 px-2.5 py-1 font-bold text-rose-200">
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
              生命線協談專線：1995 ／ 張老師專線：1980
            </span>
          </div>
        </div>
      )}

      {/* 展開後的 7 大系統子分類（每個子分類預設亦為摺疊狀態） */}
      {isOuterPanelOpen && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-slate-800/80 space-y-2">
          {SYSTEMIC_SYMPTOMS_BY_CATEGORY.map((cat) => {
            const isOpen = Boolean(expandedCats[cat.categoryId]);
            const selectedInCat = cat.items.filter((it) =>
              systemicSymptomIds.includes(it.id)
            ).length;

            return (
              <div
                key={cat.categoryId}
                className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60"
              >
                <button
                  type="button"
                  onClick={() => toggleCat(cat.categoryId)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-900/80 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-200">
                        {cat.categoryNameZh}
                      </span>
                      {selectedInCat > 0 && (
                        <span className="text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                          已勾選 {selectedInCat} 項
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {cat.subtitleZh}
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-slate-900/40">
                    {cat.items.map((item) => {
                      const isSelected = systemicSymptomIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleSystemicSymptom(item.id)}
                          className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-400 text-white shadow-sm'
                              : 'bg-slate-950/80 border-slate-800/90 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-semibold leading-snug">
                              {item.labelZh}
                            </span>
                            {item.isRedFlagWeight && (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            )}
                          </div>
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 border-amber-300'
                                : 'border-slate-700 bg-slate-900'
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 stroke-[3]" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
