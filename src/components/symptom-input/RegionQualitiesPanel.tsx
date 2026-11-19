'use client';

import React, { useState } from 'react';
import {
  Layers,
  CheckSquare,
  Square,
  Trash2,
  MapPin,
  AlertCircle,
  Stethoscope,
  Check,
} from 'lucide-react';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import { BODY_REGION_MAP } from '@/data/bodyRegions';
import {
  DEPTH_LAYER_CONFIG,
  DISCOMFORT_CATEGORY_META,
  DISCOMFORT_QUALITIES_CATALOG,
  getSpecificSymptomsByRegion,
} from '@/data/discomfortQualities';
import {
  BodyRegionId,
  DiscomfortQualityCategory,
  SymptomDepthLayer,
} from '@/types/cdss';
import { MiniAnatomicalSvg } from './MiniAnatomicalSvg';

const DEPTH_ORDER: SymptomDepthLayer[] = [
  'superficial',
  'musculoskeletal',
  'deep_visceral',
];

const QUALITY_CATEGORIES: DiscomfortQualityCategory[] = [
  'pain_qualities',
  'abnormal_sensations',
  'structural_functional',
];

interface RegionQualitiesPanelProps {
  onDone?: () => void;
}

export function RegionQualitiesPanel({ onDone }: RegionQualitiesPanelProps) {
  const {
    activeRegionId,
    selectedRegions,
    setActiveRegion,
    setRegionDepthLayer,
    toggleRegionQuality,
    toggleRegionSpecificSymptom,
    removeSelectedRegion,
  } = useDiagnosisStore();

  const [activeQualityTab, setActiveQualityTab] =
    useState<DiscomfortQualityCategory>('pain_qualities');
  const [isAllSensationsExpanded, setIsAllSensationsExpanded] = useState(false);

  const handleDone = () => {
    if (onDone) {
      onDone();
    } else {
      setActiveRegion(null);
    }
  };

  if (!activeRegionId) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              局部解剖部位定位與感受性質標記
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              請在左側 2D 快速列表或 3D 人體模型中點選任一解剖部位（共 32 區），即可標記病灶深度、部位專屬臨床徵象及 24 項通用不適感受。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const regionDef = BODY_REGION_MAP[activeRegionId];
  if (!regionDef) return null;

  const currentRecord = selectedRegions[activeRegionId];
  const currentDepth: SymptomDepthLayer =
    currentRecord?.depthLayer ||
    (regionDef.defaultDepthLayer as SymptomDepthLayer);
  const selectedQualityIds = currentRecord?.qualityIds || [];
  const selectedSpecificIds = currentRecord?.specificSymptomIds || [];
  const regionSpecificList = getSpecificSymptomsByRegion(
    activeRegionId as BodyRegionId
  );

  return (
    <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* 部位標題、微型解剖 SVG 縮圖與側別標記 */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-start gap-3 min-w-0">
          <MiniAnatomicalSvg
            regionId={activeRegionId}
            isSelected={Boolean(currentRecord)}
            isActive={true}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                {regionDef.lateralityLabelZh}
              </span>
              <span className="text-xs text-slate-400">
                {regionDef.groupNameZh}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-1">
              {regionDef.nameZh}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              解剖器官與鑑別重點：{regionDef.clinicalFocusZh}
            </p>
            {regionDef.primarySpecialtiesTw && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {regionDef.primarySpecialtiesTw.map((sp) => (
                  <span
                    key={sp}
                    className="text-[10px] bg-slate-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-semibold"
                  >
                    對應專科：{sp}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {currentRecord && (
            <button
              type="button"
              onClick={() => removeSelectedRegion(activeRegionId)}
              className="text-xs text-rose-400 hover:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-800/60 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              清除
            </button>
          )}
        </div>
      </div>

      {/* 步驟 1：標記病灶深度層級（高對比深青底 + 亮青邊框 + 純白文字） */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          <Layers className="w-4 h-4 text-cyan-400" />
          1. 標記病灶深度層級（決定解剖組織與跨專科鑑別權重）：
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DEPTH_ORDER.map((depthKey) => {
            const cfg = DEPTH_LAYER_CONFIG[depthKey];
            const isSel = currentDepth === depthKey;
            return (
              <button
                key={depthKey}
                type="button"
                onClick={() => setRegionDepthLayer(activeRegionId, depthKey)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSel
                    ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-md shadow-cyan-950/60'
                    : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-xs font-extrabold ${
                      isSel ? 'text-white' : 'text-slate-200'
                    }`}
                  >
                    {cfg.shortLabelZh}
                  </span>
                  {isSel && (
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 px-1.5 py-0.5 rounded font-bold">
                      目前深度
                    </span>
                  )}
                </div>
                <p
                  className={`text-[11px] mt-1 leading-snug ${
                    isSel ? 'text-cyan-100/90 font-medium' : 'text-slate-400'
                  }`}
                >
                  {cfg.descriptionZh}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 步驟 2：該部位專屬臨床症狀與徵象（高臨床價值優先顯示） */}
      {regionSpecificList.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Stethoscope className="w-4 h-4 text-emerald-400" />
            2. 【{regionDef.shortNameZh}】專屬臨床症狀與徵象（高鑑別價值，可複選）：
          </label>
          <div className="space-y-1.5">
            {regionSpecificList.map((spec) => {
              const checked = selectedSpecificIds.includes(spec.id);
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() =>
                    toggleRegionSpecificSymptom(activeRegionId, spec.id)
                  }
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                    checked
                      ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-sm'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 text-xs font-semibold leading-relaxed">
                    {spec.labelZh}
                    {spec.isRedFlagWeight && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded font-bold">
                        高優先鑑別特徵
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 步驟 3：24 項通用「不適感與疼痛性質」複選庫（2 欄緊湊網格 + 微型圖例 + 分頁右側檢視全部文字鍵） */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-200">
            {regionSpecificList.length > 0 ? '3.' : '2.'} 24 項通用不適感與疼痛性質（已選{' '}
            <span className="text-cyan-300">{selectedQualityIds.length}</span>{' '}
            項）
          </label>

          {/* 微型圖例說明紅色驚嘆號 */}
          <span className="inline-flex items-center gap-1 text-[10px] text-rose-300/90 bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
            臨床高優先鑑別特徵
          </span>
        </div>

        {/* 分頁標籤 + 右側小型「檢視全部」切換文字鍵 */}
        <div className="flex items-center gap-2">
          {!isAllSensationsExpanded ? (
            <div className="flex-1 grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
              {(
                [
                  { key: 'pain_qualities', label: '疼痛 (11)' },
                  { key: 'abnormal_sensations', label: '異常感 (6)' },
                  { key: 'structural_functional', label: '結構/功能 (7)' },
                ] as const
              ).map((tab) => {
                const countInCat = DISCOMFORT_QUALITIES_CATALOG.filter(
                  (q) =>
                    q.category === tab.key && selectedQualityIds.includes(q.id)
                ).length;
                const active = activeQualityTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveQualityTab(tab.key)}
                    className={`py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                      active
                        ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{tab.label}</span>
                    {countInCat > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500 text-slate-950 font-black">
                        {countInCat}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 text-[11px] font-semibold text-cyan-300 px-1">
              已展開全部 24 項感受（依 3 大類分組）
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAllSensationsExpanded((prev) => !prev);
            }}
            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 shrink-0 px-1.5 py-1 cursor-pointer"
          >
            {isAllSensationsExpanded ? '頁籤檢視' : '檢視全部'}
          </button>
        </div>

        {isAllSensationsExpanded ? (
          <div className="space-y-3 rounded-xl border border-cyan-500/30 bg-slate-950/80 p-2.5">
            {QUALITY_CATEGORIES.map((catKey) => {
              const catMeta = DISCOMFORT_CATEGORY_META[catKey];
              const catItems = DISCOMFORT_QUALITIES_CATALOG.filter(
                (q) => q.category === catKey
              );
              return (
                <div key={catKey} className="space-y-1.5">
                  <div className="text-[11px] font-extrabold text-cyan-300 border-b border-slate-800 pb-1">
                    {catMeta.titleZh}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {catItems.map((qItem) => {
                      const checked = selectedQualityIds.includes(qItem.id);
                      return (
                        <button
                          key={qItem.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRegionQuality(activeRegionId, qItem.id);
                          }}
                          className={`p-2 rounded-xl border text-left transition-all flex items-start gap-1.5 ${
                            checked
                              ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-sm'
                              : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {checked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-bold leading-snug flex items-center justify-between gap-1">
                              <span className="truncate">{qItem.labelZh}</span>
                              {qItem.isRedFlagWeight && (
                                <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">
                              {qItem.clinicalTermEn}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <p className="text-[11px] text-slate-400">
              {DISCOMFORT_CATEGORY_META[activeQualityTab].subtitleZh}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {DISCOMFORT_QUALITIES_CATALOG.filter(
                (q) => q.category === activeQualityTab
              ).map((qItem) => {
                const checked = selectedQualityIds.includes(qItem.id);
                return (
                  <button
                    key={qItem.id}
                    type="button"
                    onClick={() =>
                      toggleRegionQuality(activeRegionId, qItem.id)
                    }
                    className={`p-2 rounded-xl border text-left transition-all flex items-start gap-1.5 ${
                      checked
                        ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold leading-snug flex items-center justify-between gap-1">
                        <span className="truncate">{qItem.labelZh}</span>
                        {qItem.isRedFlagWeight && (
                          <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        {qItem.clinicalTermEn}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 明確的「完成此部位」確認鍵 */}
      <div className="pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={handleDone}
          className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/50 transition-colors"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>完成此部位</span>
        </button>
      </div>
    </div>
  );
}
