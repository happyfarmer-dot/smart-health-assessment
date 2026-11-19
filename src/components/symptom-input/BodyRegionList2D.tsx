'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CheckCircle2,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { BODY_REGIONS, BODY_GROUP_LABELS } from '@/data/bodyRegions';
import {
  DEPTH_LAYER_CONFIG,
  DISCOMFORT_CATEGORY_META,
  DISCOMFORT_QUALITIES_CATALOG,
  getSpecificSymptomsByRegion,
} from '@/data/discomfortQualities';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import {
  BodyGroupCategory,
  BodyRegionId,
  DiscomfortQualityCategory,
  SymptomDepthLayer,
} from '@/types/cdss';
import { MiniAnatomicalSvg } from './MiniAnatomicalSvg';

const GROUP_ORDER: BodyGroupCategory[] = [
  'head_neck',
  'chest_back',
  'abdomen_five',
  'lower_back_pelvis',
  'upper_limbs',
  'lower_limbs',
];

const DEPTH_KEYS: SymptomDepthLayer[] = [
  'superficial',
  'musculoskeletal',
  'deep_visceral',
];

const QUALITY_CATEGORIES: DiscomfortQualityCategory[] = [
  'pain_qualities',
  'abnormal_sensations',
  'structural_functional',
];

export function BodyRegionList2D() {
  const {
    selectedRegions,
    activeRegionId,
    setActiveRegion,
    setRegionDepthLayer,
    toggleRegionQuality,
    toggleRegionSpecificSymptom,
  } = useDiagnosisStore();

  // Patch #3：2D 列表的各大身體分區分類一開始「全部處於摺疊狀態 (Collapsed by Default)」
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    head_neck: false,
    chest_back: false,
    abdomen_five: false,
    lower_back_pelvis: false,
    upper_limbs: false,
    lower_limbs: false,
  });

  // Patch #4：修復「展開 24 項感受，按下去無效果」Bug — 為每個部位獨立維護 24 項感受展開狀態
  const [expandedSensationsByRegion, setExpandedSensationsByRegion] = useState<
    Record<string, boolean>
  >({});

  const toggleGroup = (group: BodyGroupCategory) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleAllGroups = (open: boolean) => {
    setExpandedGroups({
      head_neck: open,
      chest_back: open,
      abdomen_five: open,
      lower_back_pelvis: open,
      upper_limbs: open,
      lower_limbs: open,
    });
  };

  const toggleRegionSensationsExpand = (
    e: React.MouseEvent,
    regionId: BodyRegionId
  ) => {
    e.stopPropagation();
    setActiveRegion(regionId);
    setExpandedSensationsByRegion((prev) => ({
      ...prev,
      [regionId]: !prev[regionId],
    }));
  };

  const anyGroupOpen = Object.values(expandedGroups).some(Boolean);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold text-slate-400">
          32 處全身解剖分區（點擊分類展開，與 3D 雙向同步）
        </span>
        <button
          type="button"
          onClick={() => toggleAllGroups(!anyGroupOpen)}
          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 hover:bg-slate-800 text-[11px] font-bold shrink-0 transition-colors"
        >
          {anyGroupOpen ? '全部收合' : '全部展開'}
        </button>
      </div>

      {GROUP_ORDER.map((groupKey) => {
        const groupInfo = BODY_GROUP_LABELS[groupKey];
        const regionsInGroup = BODY_REGIONS.filter((r) => r.group === groupKey);
        const selectedInGroupCount = regionsInGroup.filter((r) =>
          Boolean(selectedRegions[r.id])
        ).length;
        const isGroupOpen = Boolean(expandedGroups[groupKey]);

        return (
          <div
            key={groupKey}
            className="bg-slate-900/95 border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
          >
            <button
              type="button"
              onClick={() => toggleGroup(groupKey)}
              className="w-full px-4 py-3.5 bg-slate-950/60 hover:bg-slate-900 flex items-center justify-between text-left transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-extrabold text-slate-100">
                    {groupInfo.title}
                  </span>
                  {selectedInGroupCount > 0 && (
                    <span className="text-xs font-bold bg-rose-600 text-white px-2.5 py-0.5 rounded-full">
                      已標記 {selectedInGroupCount} 區
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {groupInfo.subtitle}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                <span className="hidden sm:inline text-[11px]">
                  {isGroupOpen ? '收合' : `展開 (${regionsInGroup.length} 區)`}
                </span>
                {isGroupOpen ? (
                  <ChevronDown className="w-4 h-4 text-cyan-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
              </div>
            </button>

            {isGroupOpen && (
              <div className="p-3 sm:p-4 divide-y divide-slate-800/80 space-y-3">
                {regionsInGroup.map((region) => {
                  const rId = region.id as BodyRegionId;
                  const sel = selectedRegions[rId];
                  const isSelected = Boolean(sel);
                  const isActive = activeRegionId === rId;
                  const currentDepth =
                    sel?.depthLayer ||
                    (region.defaultDepthLayer as SymptomDepthLayer);
                  const specificSymptoms = getSpecificSymptomsByRegion(rId);
                  const isSensationsExpanded = Boolean(
                    expandedSensationsByRegion[rId]
                  );
                  const selectedQualitiesCount = sel?.qualityIds.length || 0;

                  return (
                    <div
                      key={rId}
                      className={`pt-3.5 first:pt-0 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-rose-950/25 p-3.5 border border-rose-500/40'
                          : isActive
                          ? 'bg-cyan-950/30 p-3.5 border border-cyan-500/40'
                          : ''
                      }`}
                    >
                      {/* 頂部：微型人體解剖 SVG 示意圖 + 部位名稱 + 對應專科 + 深度切換 */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div
                          onClick={() => setActiveRegion(rId)}
                          className="cursor-pointer text-left flex items-start gap-3 flex-1 min-w-[240px]"
                        >
                          {/* Patch #3：部位微型解剖 SVG 示意圖 */}
                          <MiniAnatomicalSvg
                            regionId={rId}
                            isSelected={isSelected}
                            isActive={isActive}
                          />

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  isSelected
                                    ? 'bg-rose-500'
                                    : isActive
                                    ? 'bg-cyan-400'
                                    : 'bg-slate-600'
                                }`}
                              />
                              <span className="text-xs sm:text-sm font-extrabold text-slate-100">
                                {region.nameZh}
                              </span>
                              <span className="text-[11px] bg-slate-800 text-cyan-300 border border-slate-700 px-2 py-0.5 rounded">
                                {region.lateralityLabelZh}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400 leading-snug">
                              鑑別重點：{region.clinicalFocusZh}
                            </div>

                            {region.primarySpecialtiesTw && (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {region.primarySpecialtiesTw.map((sp) => (
                                  <span
                                    key={sp}
                                    className="text-[10px] bg-slate-950 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold"
                                  >
                                    {sp}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 深度快速切換 */}
                        <div className="flex items-center gap-1 self-center">
                          <Layers className="w-3.5 h-3.5 text-slate-500 mr-1" />
                          {DEPTH_KEYS.map((dKey) => {
                            const cfg = DEPTH_LAYER_CONFIG[dKey];
                            const activeDepth = currentDepth === dKey;
                            return (
                              <button
                                key={dKey}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveRegion(rId);
                                  setRegionDepthLayer(rId, dKey);
                                }}
                                className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${
                                  activeDepth
                                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                {cfg.shortLabelZh}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 常用疼痛性質快捷標籤 + 展開全部 24 項感受按鈕（Patch #4 完整修復） */}
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-semibold">
                          常見性質快選：
                        </span>
                        {DISCOMFORT_QUALITIES_CATALOG.slice(0, 7).map((q) => {
                          const qChecked =
                            sel?.qualityIds.includes(q.id) || false;
                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveRegion(rId);
                                toggleRegionQuality(rId, q.id);
                              }}
                              className={`px-2.5 py-1 rounded-md text-[11px] border transition-all ${
                                qChecked
                                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 font-bold shadow-sm'
                                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              {qChecked ? '✓ ' : ''}
                              {q.labelZh}
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={(e) => toggleRegionSensationsExpand(e, rId)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ml-1 cursor-pointer ${
                            isSensationsExpanded
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                              : 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/80'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>
                            {isSensationsExpanded
                              ? '收合 24 項感受清單'
                              : '展開全部 24 項感受'}
                          </span>
                          {selectedQualitiesCount > 0 && (
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                isSensationsExpanded
                                  ? 'bg-slate-950 text-cyan-300'
                                  : 'bg-cyan-400 text-slate-950'
                              }`}
                            >
                              已選 {selectedQualitiesCount}
                            </span>
                          )}
                          {isSensationsExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Patch #4：展開後的完整 24 項不適感與疼痛性質複選面板（依 3 大類分組顯示，無 max-h 裁切） */}
                      {isSensationsExpanded && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mt-3 rounded-xl border border-cyan-500/40 bg-slate-950/95 p-3.5 space-y-3.5 shadow-inner"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                            <span className="text-xs font-extrabold text-cyan-300">
                              【{region.shortNameZh}】完整 24 項不適感與疼痛性質複選庫
                            </span>
                            <span className="text-[11px] text-slate-400">
                              已選取 {selectedQualitiesCount} / 24 項性質
                            </span>
                          </div>

                          {QUALITY_CATEGORIES.map((catKey) => {
                            const catMeta = DISCOMFORT_CATEGORY_META[catKey];
                            const catItems = DISCOMFORT_QUALITIES_CATALOG.filter(
                              (q) => q.category === catKey
                            );
                            return (
                              <div key={catKey} className="space-y-1.5">
                                <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                                  <span>{catMeta.titleZh}</span>
                                  <span className="text-[10px] text-slate-500">
                                    {catMeta.subtitleZh}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                                  {catItems.map((qItem) => {
                                    const checked =
                                      sel?.qualityIds.includes(qItem.id) ||
                                      false;
                                    return (
                                      <button
                                        key={qItem.id}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveRegion(rId);
                                          toggleRegionQuality(rId, qItem.id);
                                        }}
                                        className={`p-2 rounded-lg border text-left transition-all flex items-start gap-2 ${
                                          checked
                                            ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold shadow-sm'
                                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                                        }`}
                                      >
                                        {checked ? (
                                          <CheckSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                        ) : (
                                          <Square className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <div className="text-xs leading-snug flex items-center justify-between gap-1">
                                            <span>{qItem.labelZh}</span>
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
                      )}

                      {/* 該部位專屬症狀按鈕列 */}
                      {specificSymptoms.length > 0 && (
                        <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-1.5">
                          {specificSymptoms.map((spec) => {
                            const checked =
                              sel?.specificSymptomIds.includes(spec.id) || false;
                            return (
                              <button
                                key={spec.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveRegion(rId);
                                  toggleRegionSpecificSymptom(rId, spec.id);
                                }}
                                className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-start gap-2 ${
                                  checked
                                    ? 'bg-emerald-500/15 text-white border-emerald-400 font-semibold'
                                    : 'bg-slate-950/60 text-slate-300 border-slate-800/90 hover:border-slate-700'
                                }`}
                              >
                                <CheckCircle2
                                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                                    checked
                                      ? 'text-emerald-400'
                                      : 'text-slate-600'
                                  }`}
                                />
                                <span>{spec.labelZh}</span>
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
      })}
    </div>
  );
}
