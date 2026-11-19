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

export function RegionQualitiesPanel() {
  const {
    activeRegionId,
    selectedRegions,
    setRegionDepthLayer,
    toggleRegionQuality,
    toggleRegionSpecificSymptom,
    removeSelectedRegion,
  } = useDiagnosisStore();

  const [activeQualityTab, setActiveQualityTab] =
    useState<DiscomfortQualityCategory>('pain_qualities');

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
              請在左側 3D 人體模型或 2D 列表中點選任一解剖部位，即可展開該部位的
              <strong className="text-cyan-300">
                「皮膚表層／肌肉與關節／身體深層」
              </strong>
              深度設定、
              <strong className="text-cyan-300">
                「24 項不適感與疼痛性質複選庫」
              </strong>
              及部位專屬臨床特徵。
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
    currentRecord?.depthLayer || (regionDef.defaultDepthLayer as SymptomDepthLayer);
  const selectedQualityIds = currentRecord?.qualityIds || [];
  const selectedSpecificIds = currentRecord?.specificSymptomIds || [];
  const regionSpecificList = getSpecificSymptomsByRegion(
    activeRegionId as BodyRegionId
  );

  return (
    <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* 部位標題與側別標記 */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
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
        </div>

        {currentRecord && (
          <button
            type="button"
            onClick={() => removeSelectedRegion(activeRegionId)}
            className="text-xs text-rose-400 hover:bg-rose-950/60 px-2.5 py-1.5 rounded-lg border border-rose-800/60 flex items-center gap-1 shrink-0 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清除此部位
          </button>
        )}
      </div>

      {/* 1. 症狀深度標記：皮膚表層 / 肌肉與關節 / 身體深層（內臟或深部組織） */}
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
                    ? 'bg-cyan-600 text-slate-950 border-cyan-400 shadow-md'
                    : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-extrabold">{cfg.shortLabelZh}</span>
                  {isSel && (
                    <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded font-bold">
                      目前深度
                    </span>
                  )}
                </div>
                <p
                  className={`text-[11px] mt-1 leading-snug ${
                    isSel ? 'text-slate-900 font-medium' : 'text-slate-400'
                  }`}
                >
                  {cfg.descriptionZh}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 通用「不適感與疼痛性質」複選庫（3 大分類 24 項） */}
      <div className="space-y-2.5 pt-1">
        <label className="block text-xs font-bold text-slate-200">
          2. 勾選該部位的「不適感與疼痛性質」（可跨分類複選，共 24 項臨床特徵）：
        </label>

        {/* 3 大類切換 Tab */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          {(
            [
              { key: 'pain_qualities', label: '疼痛性質 (11)' },
              { key: 'abnormal_sensations', label: '異常感覺 (6)' },
              { key: 'structural_functional', label: '結構與功能 (7)' },
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
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  active
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {countInCat > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500 text-slate-950 font-black">
                    {countInCat}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-400">
          {DISCOMFORT_CATEGORY_META[activeQualityTab].subtitleZh}
        </p>

        {/* 該分類下之不適性質複選網格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {DISCOMFORT_QUALITIES_CATALOG.filter(
            (q) => q.category === activeQualityTab
          ).map((qItem) => {
            const checked = selectedQualityIds.includes(qItem.id);
            return (
              <button
                key={qItem.id}
                type="button"
                onClick={() => toggleRegionQuality(activeRegionId, qItem.id)}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                  checked
                    ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {checked ? (
                  <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold leading-snug flex items-center justify-between gap-1">
                    <span>{qItem.labelZh}</span>
                    {qItem.isRedFlagWeight && (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
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

      {/* 3. 該部位專屬臨床症狀特徵 */}
      {regionSpecificList.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Stethoscope className="w-4 h-4 text-emerald-400" />
            3. 「{regionDef.shortNameZh}」部位專屬臨床表現（可複選）：
          </label>
          <div className="space-y-1.5">
            {regionSpecificList.map((spec) => {
              const isChecked = selectedSpecificIds.includes(spec.id);
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() =>
                    toggleRegionSpecificSymptom(activeRegionId, spec.id)
                  }
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                    isChecked
                      ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  )}
                  <span className="text-xs font-semibold leading-snug">
                    {spec.labelZh}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
