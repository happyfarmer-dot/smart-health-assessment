'use client';

import React from 'react';
import { Thermometer, AlertTriangle, Check } from 'lucide-react';
import { SYSTEMIC_SYMPTOMS } from '@/data/symptomCatalog';
import { useHealthStore } from '@/store/useHealthStore';

export function SystemicSymptomPanel() {
  const { systemicSymptoms, toggleSystemicSymptom } = useHealthStore();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">
              全身性症狀快捷面板（Systemic Symptoms）
            </h3>
            <p className="text-xs text-slate-500">
              跨越單一解剖部位的全身反應，為感染、免疫或急症鑑別的重要指標
            </p>
          </div>
        </div>
        {systemicSymptoms.length > 0 && (
          <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full">
            已選 {systemicSymptoms.length} 項
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SYSTEMIC_SYMPTOMS.map((sys) => {
          const isSelected = systemicSymptoms.includes(sys.id);
          return (
            <button
              key={sys.id}
              type="button"
              onClick={() => toggleSystemicSymptom(sys.id)}
              className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                isSelected
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-50/90 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="space-y-0.5">
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>{sys.labelZh}</span>
                  {sys.isRedFlagContributor && (
                    <AlertTriangle
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected ? 'text-amber-100' : 'text-rose-500'
                      }`}
                    />
                  )}
                </div>
                <p
                  className={`text-[11px] leading-snug ${
                    isSelected ? 'text-amber-50' : 'text-slate-500'
                  }`}
                >
                  {sys.descriptionZh}
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                  isSelected
                    ? 'bg-white text-amber-600 border-white'
                    : 'bg-white border-slate-300'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
