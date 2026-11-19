'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { BODY_REGIONS, BODY_GROUP_LABELS } from '@/data/bodyRegions';
import {
  DEPTH_LAYER_CONFIG,
  DISCOMFORT_QUALITIES_CATALOG,
  getSpecificSymptomsByRegion,
} from '@/data/discomfortQualities';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import {
  BodyGroupCategory,
  BodyRegionId,
  SymptomDepthLayer,
} from '@/types/cdss';

const GROUP_ORDER: BodyGroupCategory[] = [
  'abdomen_five',
  'chest_back',
  'head_neck',
  'lower_back_pelvis',
  'upper_limbs',
  'lower_limbs',
];

const DEPTH_KEYS: SymptomDepthLayer[] = [
  'superficial',
  'musculoskeletal',
  'deep_visceral',
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

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    abdomen_five: true,
    chest_back: true,
    head_neck: true,
    lower_back_pelvis: false,
    upper_limbs: false,
    lower_limbs: false,
  });

  const toggleGroup = (group: BodyGroupCategory) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <div className="space-y-3">
      <div className="bg-cyan-950/50 border border-cyan-500/30 rounded-xl p-3 text-xs text-cyan-200 flex items-center justify-between">
        <span>
          <strong>2D 快速列表模式：</strong>
          所有部位勾選狀態與 3D 透明感應熱區<strong>完全雙向同步</strong>。點擊任一部位即可在右側開啟完整 24 項不適感受庫。
        </span>
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
              className="w-full px-4 py-3 bg-slate-950/60 hover:bg-slate-900 flex items-center justify-between text-left transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-100">
                    {groupInfo.title}
                  </span>
                  {selectedInGroupCount > 0 && (
                    <span className="text-xs font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                      已標記 {selectedInGroupCount} 區
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {groupInfo.subtitle}
                </p>
              </div>
              {isGroupOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {isGroupOpen && (
              <div className="p-3 sm:p-4 divide-y divide-slate-800/80 space-y-3">
                {regionsInGroup.map((region) => {
                  const rId = region.id as BodyRegionId;
                  const sel = selectedRegions[rId];
                  const isSelected = Boolean(sel);
                  const isActive = activeRegionId === rId;
                  const currentDepth =
                    sel?.depthLayer || (region.defaultDepthLayer as SymptomDepthLayer);
                  const specificSymptoms = getSpecificSymptomsByRegion(rId);

                  return (
                    <div
                      key={rId}
                      className={`pt-3 first:pt-0 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-rose-950/25 p-3 border border-rose-500/40'
                          : isActive
                          ? 'bg-cyan-950/30 p-3 border border-cyan-500/40'
                          : ''
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveRegion(rId)}
                          className="text-left flex items-center gap-2"
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              isSelected
                                ? 'bg-rose-500'
                                : isActive
                                ? 'bg-cyan-400'
                                : 'bg-slate-600'
                            }`}
                          />
                          <span className="text-xs sm:text-sm font-bold text-slate-100">
                            {region.nameZh}
                          </span>
                          <span className="text-[11px] bg-slate-800 text-cyan-300 border border-slate-700 px-2 py-0.5 rounded">
                            {region.lateralityLabelZh}
                          </span>
                        </button>

                        {/* 深度快速切換 */}
                        <div className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-500 mr-1" />
                          {DEPTH_KEYS.map((dKey) => {
                            const cfg = DEPTH_LAYER_CONFIG[dKey];
                            const activeDepth = currentDepth === dKey;
                            return (
                              <button
                                key={dKey}
                                type="button"
                                onClick={() => setRegionDepthLayer(rId, dKey)}
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
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

                      {/* 常用疼痛性質快捷標籤 */}
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-slate-500">
                          常見性質快選：
                        </span>
                        {DISCOMFORT_QUALITIES_CATALOG.slice(0, 7).map((q) => {
                          const qChecked =
                            sel?.qualityIds.includes(q.id) || false;
                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => {
                                setActiveRegion(rId);
                                toggleRegionQuality(rId, q.id);
                              }}
                              className={`px-2 py-0.5 rounded-md text-[11px] border transition-all ${
                                qChecked
                                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 font-bold'
                                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              {q.labelZh}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setActiveRegion(rId)}
                          className="text-[11px] text-cyan-400 hover:underline ml-1"
                        >
                          展開全部 24 項感受 →
                        </button>
                      </div>

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
                                onClick={() => {
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
