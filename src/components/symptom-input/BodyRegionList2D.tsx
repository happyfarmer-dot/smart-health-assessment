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
  DEPTH_LAYER_META,
  getSymptomsByRegion,
} from '@/data/symptomCatalog';
import { useHealthStore } from '@/store/useHealthStore';
import { BodyGroupCategory, SymptomDepthLayer } from '@/types/medical';

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
    toggleRegionSymptom,
  } = useHealthStore();

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
      <div className="bg-sky-50/90 border border-sky-200 rounded-xl p-3 text-xs text-sky-900 flex items-center justify-between">
        <span>
          <strong>2D 快速列表模式：</strong>
          所有勾選狀態與 3D 人體模型<strong>完全雙向同步</strong>。點擊任一解剖分區即可展開勾選症狀並調整表層／深層。
        </span>
      </div>

      {GROUP_ORDER.map((groupKey) => {
        const groupInfo = BODY_GROUP_LABELS[groupKey];
        const regionsInGroup = BODY_REGIONS.filter((r) => r.group === groupKey);
        const selectedInGroupCount = regionsInGroup.filter(
          (r) => Boolean(selectedRegions[r.id])
        ).length;
        const isGroupOpen = Boolean(expandedGroups[groupKey]);

        return (
          <div
            key={groupKey}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
          >
            {/* 分區群組標題 */}
            <button
              type="button"
              onClick={() => toggleGroup(groupKey)}
              className="w-full px-4 py-3 bg-slate-50/80 hover:bg-slate-100/70 flex items-center justify-between text-left transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-800">
                    {groupInfo.title}
                  </span>
                  {selectedInGroupCount > 0 && (
                    <span className="text-xs font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                      已選 {selectedInGroupCount} 區
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {groupInfo.subtitle}
                </p>
              </div>
              {isGroupOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* 群組內的解剖區域列表 */}
            {isGroupOpen && (
              <div className="p-3 sm:p-4 divide-y divide-slate-100 space-y-3">
                {regionsInGroup.map((region) => {
                  const sel = selectedRegions[region.id];
                  const isSelected = Boolean(sel);
                  const isActive = activeRegionId === region.id;
                  const currentDepth = sel?.depthLayer || region.defaultDepthLayer;
                  const symptoms = getSymptomsByRegion(region.id);

                  return (
                    <div
                      key={region.id}
                      className={`pt-3 first:pt-0 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-rose-50/30 p-3 border border-rose-200'
                          : isActive
                          ? 'bg-sky-50/40 p-3 border border-sky-200'
                          : ''
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveRegion(isActive ? null : region.id)
                          }
                          className="text-left flex items-center gap-2"
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              isSelected
                                ? 'bg-rose-600'
                                : isActive
                                ? 'bg-sky-600'
                                : 'bg-slate-300'
                            }`}
                          />
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {region.nameZh}
                          </span>
                          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {region.lateralityLabelZh}
                          </span>
                        </button>

                        {/* 2D 列表內嵌深度層級快速切換器 */}
                        <div className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400 mr-1" />
                          {DEPTH_KEYS.map((dKey) => {
                            const meta = DEPTH_LAYER_META[dKey];
                            const activeDepth = currentDepth === dKey;
                            return (
                              <button
                                key={dKey}
                                type="button"
                                onClick={() =>
                                  setRegionDepthLayer(region.id, dKey)
                                }
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                                  activeDepth
                                    ? 'bg-sky-600 text-white border-sky-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {meta.shortLabelZh}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 該部位症狀按鈕列 */}
                      <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {symptoms.map((sym) => {
                          const checked =
                            sel?.symptomIds.includes(sym.id) || false;
                          return (
                            <button
                              key={sym.id}
                              type="button"
                              onClick={() => {
                                setActiveRegion(region.id);
                                toggleRegionSymptom(region.id, sym.id);
                              }}
                              className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-start gap-2 ${
                                checked
                                  ? 'bg-sky-600 text-white border-sky-600 font-semibold shadow-sm'
                                  : 'bg-slate-50/80 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <CheckCircle2
                                className={`w-4 h-4 shrink-0 mt-0.5 ${
                                  checked ? 'text-white' : 'text-slate-300'
                                }`}
                              />
                              <span>{sym.labelZh}</span>
                            </button>
                          );
                        })}
                      </div>
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
