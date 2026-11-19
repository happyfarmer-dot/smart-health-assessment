'use client';

import React from 'react';
import {
  Layers,
  CheckSquare,
  Square,
  AlertCircle,
  Trash2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';
import { BODY_REGION_MAP } from '@/data/bodyRegions';
import {
  DEPTH_LAYER_META,
  getSymptomsByRegion,
} from '@/data/symptomCatalog';
import { SymptomDepthLayer } from '@/types/medical';

const DEPTH_ORDER: SymptomDepthLayer[] = [
  'superficial',
  'musculoskeletal',
  'deep_visceral',
];

export function RegionSymptomPopover() {
  const {
    activeRegionId,
    selectedRegions,
    setRegionDepthLayer,
    toggleRegionSymptom,
    removeSelectedRegion,
    setActiveRegion,
  } = useHealthStore();

  if (!activeRegionId) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              步驟 1：請點選 3D 模型或 2D 列表中的不適部位
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              點選任一部位（如「左胸」、「右上腹」、「右下腹」）後，可在此選擇
              <strong className="text-slate-700">
                「皮膚表層 / 肌肉與關節 / 身體深層悶痛」
              </strong>
              深度層級與具體症狀，系統將據此精準路由至對應的台灣醫院專科。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const regionDef = BODY_REGION_MAP[activeRegionId];
  if (!regionDef) return null;

  const currentSelection = selectedRegions[activeRegionId];
  const currentDepth: SymptomDepthLayer =
    currentSelection?.depthLayer || regionDef.defaultDepthLayer;
  const selectedIds = currentSelection?.symptomIds || [];
  const availableSymptoms = getSymptomsByRegion(activeRegionId);

  return (
    <div className="bg-white border-2 border-sky-500/80 rounded-2xl p-4 sm:p-5 shadow-md space-y-4 transition-all">
      {/* 頂部部位標題與側別防呆標籤 */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full">
              {regionDef.lateralityLabelZh}
            </span>
            <span className="text-xs text-slate-500">
              {regionDef.groupNameZh}
            </span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 mt-1">
            {regionDef.nameZh}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            臨床定位重點：{regionDef.clinicalFocusZh}
          </p>
        </div>

        {currentSelection && (
          <button
            type="button"
            onClick={() => removeSelectedRegion(activeRegionId)}
            className="text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1 shrink-0 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            移除此部位
          </button>
        )}
      </div>

      {/* 核心規格：症狀深度與性質標記 (皮膚表層 / 肌肉與關節 / 身體深層悶痛) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Layers className="w-4 h-4 text-sky-600" />
            選擇不適的「深度層級」（決定後端多專科分流權重）：
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DEPTH_ORDER.map((depthKey) => {
            const meta = DEPTH_LAYER_META[depthKey];
            const isSelectedDepth = currentDepth === depthKey;
            return (
              <button
                key={depthKey}
                type="button"
                onClick={() => setRegionDepthLayer(activeRegionId, depthKey)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelectedDepth
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm ring-2 ring-sky-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-extrabold">{meta.labelZh}</span>
                  {isSelectedDepth && (
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-semibold">
                      已選深度
                    </span>
                  )}
                </div>
                <p
                  className={`text-[11px] mt-1 leading-snug ${
                    isSelectedDepth ? 'text-sky-100' : 'text-slate-500'
                  }`}
                >
                  {meta.descriptionZh}
                </p>
              </button>
            );
          })}
        </div>

        {/* 顯示當前深度對應之專科路由提示 */}
        <div className="text-[11px] text-sky-800 bg-sky-50/90 border border-sky-200/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>{DEPTH_LAYER_META[currentDepth].specialtyHintZh}</span>
        </div>
      </div>

      {/* 該部位常見具體症狀複選清單 */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800">
          勾選「{regionDef.shortNameZh}」的具體症狀特徵（可複選）：
        </label>
        <div className="space-y-2">
          {availableSymptoms.map((sym) => {
            const isChecked = selectedIds.includes(sym.id);
            const depthBadge = DEPTH_LAYER_META[sym.recommendedDepth];

            return (
              <button
                key={sym.id}
                type="button"
                onClick={() => toggleRegionSymptom(activeRegionId, sym.id)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  isChecked
                    ? 'bg-sky-50/90 border-sky-500 text-slate-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold leading-snug">
                    {sym.labelZh}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${depthBadge.badgeColor}`}
                    >
                      典型層級：{depthBadge.shortLabelZh}
                    </span>
                    {sym.isHighRiskIndicator && (
                      <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-0.5">
                        <AlertCircle className="w-3 h-3" />
                        重點評估特徵
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
