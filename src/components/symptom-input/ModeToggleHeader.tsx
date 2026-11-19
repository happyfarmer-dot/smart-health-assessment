'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  ListChecks,
  Search,
  X,
  RotateCcw,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';
import { BODY_REGIONS } from '@/data/bodyRegions';
import { REGION_SYMPTOM_OPTIONS, SYSTEMIC_SYMPTOMS } from '@/data/symptomCatalog';
import { BodyRegionId, SystemicSymptomId } from '@/types/medical';

interface SearchResultItem {
  type: 'region_symptom' | 'region_only' | 'systemic';
  regionId?: BodyRegionId;
  regionNameZh?: string;
  lateralityZh?: string;
  symptomId?: string;
  systemicId?: SystemicSymptomId;
  matchedLabelZh: string;
  subLabelZh: string;
}

export function ModeToggleHeader() {
  const {
    inputMode,
    setInputMode,
    selectedRegions,
    systemicSymptoms,
    quickAddSymptomFromSearch,
    toggleSystemicSymptom,
    clearAllSelections,
  } = useHealthStore();

  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const selectedCount =
    Object.keys(selectedRegions).length + systemicSymptoms.length;

  // 白話文模糊搜尋引擎（支援搜尋「心口悶」、「肚子右下角痛」、「盲腸炎」、「發燒」、「皮蛇」等）
  const searchResults = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResultItem[] = [];

    // 1. 搜尋各部位具體症狀與白話同義詞
    for (const sym of REGION_SYMPTOM_OPTIONS) {
      const region = BODY_REGIONS.find((r) => r.id === sym.regionId);
      if (!region) continue;

      const matchSymptom =
        sym.labelZh.toLowerCase().includes(q) ||
        sym.colloquialAliases.some((a) => a.toLowerCase().includes(q));

      if (matchSymptom) {
        results.push({
          type: 'region_symptom',
          regionId: region.id,
          regionNameZh: region.shortNameZh,
          lateralityZh: region.lateralityLabelZh,
          symptomId: sym.id,
          matchedLabelZh: sym.labelZh,
          subLabelZh: `對應部位：${region.nameZh}`,
        });
      }
    }

    // 2. 搜尋解剖分區與其白話關鍵字
    for (const region of BODY_REGIONS) {
      const matchRegion =
        region.nameZh.toLowerCase().includes(q) ||
        region.colloquialKeywords.some((k) => k.toLowerCase().includes(q));

      if (matchRegion) {
        results.push({
          type: 'region_only',
          regionId: region.id,
          regionNameZh: region.shortNameZh,
          lateralityZh: region.lateralityLabelZh,
          matchedLabelZh: `定位部位：${region.nameZh}`,
          subLabelZh: `臨床關注：${region.clinicalFocusZh}`,
        });
      }
    }

    // 3. 搜尋全身性症狀
    for (const sys of SYSTEMIC_SYMPTOMS) {
      const matchSys =
        sys.labelZh.toLowerCase().includes(q) ||
        sys.colloquialAliases.some((a) => a.toLowerCase().includes(q));
      if (matchSys) {
        results.push({
          type: 'systemic',
          systemicId: sys.id,
          matchedLabelZh: `[全身性症狀] ${sys.labelZh}`,
          subLabelZh: sys.descriptionZh,
        });
      }
    }

    return results.slice(0, 8);
  }, [query]);

  const handleSelectResult = (item: SearchResultItem) => {
    if (item.type === 'region_symptom' && item.regionId) {
      quickAddSymptomFromSearch(item.regionId, item.symptomId);
    } else if (item.type === 'region_only' && item.regionId) {
      quickAddSymptomFromSearch(item.regionId);
    } else if (item.type === 'systemic' && item.systemicId) {
      if (!systemicSymptoms.includes(item.systemicId)) {
        toggleSystemicSymptom(item.systemicId);
      }
    }
    setQuery('');
    setIsSearchFocused(false);
  };

  const quickChips = [
    { label: '心口悶 / 左胸壓迫', q: '心口悶' },
    { label: '肚子右下角痛 (闌尾區)', q: '右下腹痛' },
    { label: '吃完油膩右上腹痛', q: '右上腹痛' },
    { label: '火燒心 / 胃酸逆流', q: '火燒心' },
    { label: '突然劇烈頭痛', q: '雷擊頭痛' },
    { label: '右手麻 (腕隧道)', q: '右手麻' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* 左側：3D / 2D 雙模式一鍵切換 */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setInputMode('3d')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                inputMode === '3d'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>3D 互動人體模型</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('2d')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                inputMode === '2d'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              <span>2D 快速列表模式</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 hidden sm:inline">
            （雙模式狀態即時同步；若您正發燒、頭暈，建議可切換至 2D 列表快速勾選）
          </span>
        </div>

        {/* 右側：已選狀態計數與清空 */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <span className="text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-sky-600" />
              已標記 {Object.keys(selectedRegions).length} 個部位 /{' '}
              {systemicSymptoms.length} 項全身症狀
            </span>
            <button
              type="button"
              onClick={clearAllSelections}
              className="text-xs text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              清空重選
            </button>
          </div>
        )}
      </div>

      {/* 常駐白話文模糊搜尋框 */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsSearchFocused(true);
            }}
            placeholder="輸入白話文快速搜尋並自動高亮 3D 部位（例如：「心口悶」、「肚子右下角痛」、「火燒心」、「右手麻」、「發燒」）..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-slate-800"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 快捷白話搜尋建議標籤 */}
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-500" />
            常見白話快選：
          </span>
          {quickChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setQuery(chip.q);
                setIsSearchFocused(true);
              }}
              className="text-[11px] bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200/80 px-2 py-0.5 rounded-full transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* 搜尋下拉結果 */}
        {isSearchFocused && query.trim().length > 0 && (
          <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-4 text-xs text-slate-500 text-center">
                找不到與「{query}」直接相符的詞彙，請嘗試點擊下方 3D 人體模型或切換至 2D 列表瀏覽。
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {searchResults.map((item, idx) => (
                  <button
                    key={`${item.type}-${item.regionId || item.systemicId}-${item.symptomId || idx}`}
                    type="button"
                    onClick={() => handleSelectResult(item)}
                    className="w-full px-4 py-2.5 text-left hover:bg-sky-50/80 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-800">
                        {item.matchedLabelZh}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.subLabelZh}
                      </div>
                    </div>
                    {item.lateralityZh && (
                      <span className="shrink-0 text-[11px] font-medium bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">
                        {item.lateralityZh}
                      </span>
                    )}
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
