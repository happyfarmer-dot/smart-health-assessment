'use client';

import React, { useState } from 'react';
import {
  Activity,
  ChevronDown,
  ChevronRight,
  Check,
  AlertCircle,
} from 'lucide-react';
import { SYSTEMIC_SYMPTOMS_BY_CATEGORY } from '@/data/systemicSymptomsCatalog';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import { SystemicCategoryKey } from '@/types/cdss';

export function SystemicSymptomsAccordion() {
  const { systemicSymptomIds, toggleSystemicSymptom } = useDiagnosisStore();

  const [expandedCats, setExpandedCats] = useState<
    Record<SystemicCategoryKey, boolean>
  >({
    temp_metabolic: true,
    neuro_psychiatric: false,
    cardio_respiratory: false,
    gi_excretory: false,
    skin_mucosa_appearance: false,
    immune_lymphatic: false,
  });

  const toggleCat = (key: SystemicCategoryKey) => {
    setExpandedCats((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-100">
              全身性症狀分類面板（6 大系統・44 項臨床指標）
            </h3>
            <p className="text-xs text-slate-400">
              獨立於單一解剖部位之外的全身性生理表現，供跨系統疾病鑑別交叉比對
            </p>
          </div>
        </div>
        {systemicSymptomIds.length > 0 && (
          <span className="text-xs font-bold bg-amber-500 text-slate-950 px-2.5 py-1 rounded-full shrink-0">
            已選 {systemicSymptomIds.length} 項
          </span>
        )}
      </div>

      <div className="space-y-2">
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-200">
                      {cat.categoryNameZh}
                    </span>
                    {selectedInCat > 0 && (
                      <span className="text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 rounded-full">
                        已勾選 {selectedInCat}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {cat.subtitleZh}
                  </p>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
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
                          <span className="text-xs font-semibold truncate">
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
    </div>
  );
}
