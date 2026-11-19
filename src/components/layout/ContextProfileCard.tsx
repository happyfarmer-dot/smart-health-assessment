'use client';

import React from 'react';
import {
  UserCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  HeartPulse,
  Pill,
  Baby,
  CheckCircle2,
} from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';
import {
  AgeGroup,
  BiologicalSex,
  ChronicConditionId,
  HighRiskMedicationId,
  PregnancyPossibility,
} from '@/types/medical';

const AGE_GROUPS: { value: AgeGroup; label: string }[] = [
  { value: '0-12', label: '0–12 歲 (兒童)' },
  { value: '13-17', label: '13–17 歲 (青少年)' },
  { value: '18-39', label: '18–39 歲 (青壯年)' },
  { value: '40-64', label: '40–64 歲 (中壯年)' },
  { value: '65+', label: '65 歲以上 (長者)' },
];

const SEX_OPTIONS: { value: BiologicalSex; label: string }[] = [
  { value: 'male', label: '生理男性' },
  { value: 'female', label: '生理女性' },
  { value: 'intersex_or_other', label: '其他 / 不便透露' },
];

const CHRONIC_CONDITIONS: { id: ChronicConditionId; label: string }[] = [
  { id: 'hypertension', label: '高血壓' },
  { id: 'diabetes', label: '糖尿病' },
  { id: 'hyperlipidemia', label: '高血脂' },
  { id: 'coronary_heart_dis', label: '冠心病 / 心律不整' },
  { id: 'asthma_copd', label: '氣喘 / 慢性肺病' },
  { id: 'peptic_ulcer_gerd', label: '胃潰瘍 / 胃食道逆流' },
  { id: 'chronic_kidney_dis', label: '慢性腎臟病' },
  { id: 'liver_disease', label: '慢性肝病' },
  { id: 'autoimmune_disease', label: '自體免疫疾病' },
  { id: 'cancer_history', label: '惡性腫瘤病史' },
];

const HIGH_RISK_MEDS: { id: HighRiskMedicationId; label: string; warningTag?: string }[] = [
  {
    id: 'anticoagulants',
    label: '抗凝血劑 / 抗血小板藥（如阿斯匹靈、保栓通、Warfarin、NOAC）',
    warningTag: '出血高風險權重',
  },
  {
    id: 'immunosuppressants',
    label: '免疫抑制劑 / 長期口服類固醇',
    warningTag: '典型發燒可能被掩蓋',
  },
  {
    id: 'nsaids_regular',
    label: '近期頻繁服用消炎止痛藥 (NSAIDs)',
    warningTag: '胃黏膜與腎功能考量',
  },
  {
    id: 'insulin_oral_hypo',
    label: '胰島素或口服降血糖藥',
  },
  {
    id: 'antihypertensives',
    label: '固定服用降血壓藥',
  },
];

export function ContextProfileCard() {
  const {
    contextProfile,
    isProfileDrawerOpen,
    updateContextProfile,
    setProfileDrawerOpen,
  } = useHealthStore();

  const toggleCondition = (id: ChronicConditionId) => {
    const exists = contextProfile.chronicConditions.includes(id);
    const next = exists
      ? contextProfile.chronicConditions.filter((c) => c !== id)
      : [...contextProfile.chronicConditions, id];
    updateContextProfile({ chronicConditions: next });
  };

  const toggleMedication = (id: HighRiskMedicationId) => {
    const exists = contextProfile.highRiskMedications.includes(id);
    const next = exists
      ? contextProfile.highRiskMedications.filter((m) => m !== id)
      : [...contextProfile.highRiskMedications, id];
    updateContextProfile({ highRiskMedications: next });
  };

  const sexLabel =
    SEX_OPTIONS.find((s) => s.value === contextProfile.biologicalSex)?.label || '未設定';
  const ageLabel =
    AGE_GROUPS.find((a) => a.value === contextProfile.ageGroup)?.label || '未設定';

  const hasHighRiskMeds =
    contextProfile.highRiskMedications.includes('anticoagulants') ||
    contextProfile.highRiskMedications.includes('immunosuppressants');

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all">
      {/* 常駐頂部摘要列 (可一鍵展開/收合) */}
      <button
        type="button"
        onClick={() => setProfileDrawerOpen(!isProfileDrawerOpen)}
        className="w-full px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-sky-50/90 via-white to-slate-50 hover:bg-sky-50/60 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-sm">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-800">
                個人生理情境卡（Context Profile）
              </span>
              <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                地端自動儲存・評估自動帶入
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-2 flex-wrap">
              <span className="font-medium text-slate-800">{ageLabel}</span>
              <span>•</span>
              <span className="font-medium text-slate-800">{sexLabel}</span>
              {contextProfile.biologicalSex === 'female' &&
                contextProfile.pregnancyStatus === 'possible_or_confirmed' && (
                  <>
                    <span>•</span>
                    <span className="text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.2 rounded">
                      可能或已懷孕
                    </span>
                  </>
                )}
              <span>•</span>
              <span>
                慢性病史：
                {contextProfile.chronicConditions.length > 0
                  ? `${contextProfile.chronicConditions.length} 項`
                  : '無'}
              </span>
              <span>•</span>
              <span>
                固定用藥：
                {contextProfile.highRiskMedications.length > 0
                  ? `${contextProfile.highRiskMedications.length} 項`
                  : '無'}
              </span>
              {hasHighRiskMeds && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  含高風險用藥權重
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-sky-700 bg-sky-100/80 px-3 py-1.5 rounded-lg">
          <span>{isProfileDrawerOpen ? '收合情境卡' : '展開編輯情境'}</span>
          {isProfileDrawerOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* 展開後的編輯面板 */}
      {isProfileDrawerOpen && (
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/50 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. 年齡區間 */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                1. 年齡區間（選填）
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5">
                {AGE_GROUPS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => updateContextProfile({ ageGroup: g.value })}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium text-left transition-all border ${
                      contextProfile.ageGroup === g.value
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 生理性別與懷孕可能性 */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  2. 生理性別（影響解剖與婦科／泌尿鑑別）
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SEX_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => updateContextProfile({ biologicalSex: s.value })}
                      className={`px-2.5 py-2 rounded-md text-xs font-medium text-center transition-all border ${
                        contextProfile.biologicalSex === s.value
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 僅在選擇「生理女性」時顯示懷孕狀態 */}
              {contextProfile.biologicalSex === 'female' && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-rose-700 mb-2">
                    <Baby className="w-3.5 h-3.5" />
                    目前是否可能懷孕或正處於孕期？
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'no', label: '無懷孕可能' },
                      { value: 'possible_or_confirmed', label: '可能懷孕 / 已懷孕' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          updateContextProfile({
                            pregnancyStatus: opt.value as PregnancyPossibility,
                          })
                        }
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                          contextProfile.pregnancyStatus === opt.value
                            ? opt.value === 'possible_or_confirmed'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                              : 'bg-slate-800 text-white border-slate-800'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. 高風險與固定用藥 */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                <Pill className="w-3.5 h-3.5 text-amber-600" />
                3. 目前固定用藥（特別標註高風險藥物）
              </label>
              <div className="space-y-1.5">
                {HIGH_RISK_MEDS.map((med) => {
                  const checked = contextProfile.highRiskMedications.includes(med.id);
                  return (
                    <button
                      key={med.id}
                      type="button"
                      onClick={() => toggleMedication(med.id)}
                      className={`w-full p-2 rounded-md text-left text-xs border transition-all flex items-start justify-between gap-2 ${
                        checked
                          ? 'bg-amber-50 border-amber-400 text-amber-950 font-medium'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{med.label}</span>
                      {med.warningTag && (
                        <span className="shrink-0 text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded">
                          {med.warningTag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. 重大慢性病史 */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
              <HeartPulse className="w-3.5 h-3.5 text-sky-600" />
              4. 重大慢性病史（可複選，供跨專科交叉比對）
            </label>
            <div className="flex flex-wrap gap-2">
              {CHRONIC_CONDITIONS.map((cond) => {
                const active = contextProfile.chronicConditions.includes(cond.id);
                return (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => toggleCondition(cond.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      active
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {cond.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
