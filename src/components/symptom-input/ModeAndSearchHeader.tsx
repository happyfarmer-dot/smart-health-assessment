'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  ListChecks,
  Search,
  X,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import { BODY_REGIONS } from '@/data/bodyRegions';
import {
  DISCOMFORT_QUALITIES_CATALOG,
  REGION_SPECIFIC_SYMPTOMS,
} from '@/data/discomfortQualities';
import { ALL_SYSTEMIC_SYMPTOMS } from '@/data/systemicSymptomsCatalog';
import { BodyRegionId } from '@/types/cdss';

interface SearchCandidate {
  id: string;
  regionId?: BodyRegionId;
  qualityId?: string;
  specificId?: string;
  systemicId?: string;
  titleZh: string;
  subtitleZh: string;
  badgeZh: string;
}

export function ModeAndSearchHeader() {
  const {
    inputMode,
    setInputMode,
    selectedRegions,
    systemicSymptomIds,
    quickSelectFromSearch,
    clearAllClinicalInputs,
  } = useDiagnosisStore();

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const totalCount =
    Object.keys(selectedRegions).length + systemicSymptomIds.length;

  const candidates = useMemo<SearchCandidate[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const list: SearchCandidate[] = [];

    // 1. 搜尋部位專屬臨床症狀
    for (const spec of REGION_SPECIFIC_SYMPTOMS) {
      const region = BODY_REGIONS.find((r) => r.id === spec.regionId);
      if (!region) continue;
      if (
        spec.labelZh.toLowerCase().includes(q) ||
        spec.colloquialAliases.some((a) => a.toLowerCase().includes(q))
      ) {
        list.push({
          id: `spec-${spec.id}`,
          regionId: region.id as BodyRegionId,
          specificId: spec.id,
          titleZh: spec.labelZh,
          subtitleZh: `解剖部位：${region.nameZh}`,
          badgeZh: region.lateralityLabelZh,
        });
      }
    }

    // 2. 搜尋 24 個解剖部位
    for (const region of BODY_REGIONS) {
      if (
        region.nameZh.toLowerCase().includes(q) ||
        region.colloquialKeywords.some((k) => k.toLowerCase().includes(q))
      ) {
        list.push({
          id: `reg-${region.id}`,
          regionId: region.id as BodyRegionId,
          titleZh: `定位解剖分區：${region.nameZh}`,
          subtitleZh: `鑑別重點：${region.clinicalFocusZh}`,
          badgeZh: region.lateralityLabelZh,
        });
      }
    }

    // 3. 搜尋 44 項全身性症狀
    for (const sys of ALL_SYSTEMIC_SYMPTOMS) {
      if (
        sys.labelZh.toLowerCase().includes(q) ||
        sys.colloquialAliases.some((a) => a.toLowerCase().includes(q))
      ) {
        list.push({
          id: `sys-${sys.id}`,
          systemicId: sys.id,
          titleZh: `[全身性症狀] ${sys.labelZh}`,
          subtitleZh: `對應 MeSH: ${sys.meshEn}`,
          badgeZh: '全身系統',
        });
      }
    }

    // 4. 搜尋 24 項通用不適性質（若當前已選取某部位，可直接套用至該部位；否則套用至預設匹配部位）
    for (const qual of DISCOMFORT_QUALITIES_CATALOG) {
      if (
        qual.labelZh.toLowerCase().includes(q) ||
        qual.colloquialAliases.some((a) => a.toLowerCase().includes(q))
      ) {
        list.push({
          id: `qual-${qual.id}`,
          qualityId: qual.id,
          regionId: 'abd_epigastric',
          titleZh: `[疼痛與不適性質] ${qual.labelZh} (${qual.clinicalTermEn})`,
          subtitleZh: '點選後可標記於當前關注之解剖部位',
          badgeZh: '感受性質',
        });
      }
    }

    return list.slice(0, 9);
  }, [query]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* 3D / 2D 一鍵雙向同步切換 */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setInputMode('3d')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                inputMode === '3d'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>3D 模型模式</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('2d')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                inputMode === '2d'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              <span>2D 快速列表模式</span>
            </button>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            3D 解剖曲面與 2D 列表狀態完全雙向同步
          </span>
        </div>

        {/* 已選計數與重置 */}
        {totalCount > 0 && (
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <span className="text-xs font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
              已標記 {Object.keys(selectedRegions).length} 處解剖部位 /{' '}
              {systemicSymptomIds.length} 項全身症狀
            </span>
            <button
              type="button"
              onClick={clearAllClinicalInputs}
              className="text-xs text-slate-400 hover:text-rose-400 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-rose-800 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              清空重選
            </button>
          </div>
        )}
      </div>

      {/* 頂部即時白話搜尋框 */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onFocus={() => setFocused(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setFocused(true);
            }}
            placeholder="搜尋部位、疼痛性質或全身症狀（如：右上腹、右下腹、絞痛、反彈痛、心悸、黃疸、高燒）..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-100 placeholder:text-slate-500 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {focused && query.trim().length > 0 && (
          <div className="absolute z-40 left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
            {candidates.length === 0 ? (
              <div className="p-4 text-xs text-slate-400 text-center">
                找不到相符項目，請直接點擊下方 3D 人體模型或展開全身性症狀分類面板勾選。
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {candidates.map((cand) => (
                  <button
                    key={cand.id}
                    type="button"
                    onClick={() => {
                      quickSelectFromSearch({
                        regionId: cand.regionId,
                        qualityId: cand.qualityId,
                        specificId: cand.specificId,
                        systemicId: cand.systemicId,
                      });
                      setQuery('');
                      setFocused(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-800/90 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-100">
                        {cand.titleZh}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {cand.subtitleZh}
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                      {cand.badgeZh}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
