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
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import {
  AgeGroup,
  BiologicalSex,
  ChronicConditionId,
  HighRiskMedicationId,
  PregnancyPossibility,
} from '@/types/cdss';

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

const HIGH_RISK_MEDS: {
  id: HighRiskMedicationId;
  label: string;
  iatrogenicTag: string;
}[] = [
  {
    id: 'anticoagulants',
    label: '抗凝血劑 / 抗血小板藥（阿斯匹靈、保栓通、Warfarin、NOAC）',
    iatrogenicTag: '出血與黑便排查',
  },
  {
    id: 'immunosuppressants',
    label: '免疫抑制劑（如 Cyclosporine、Methotrexate 等）',
    iatrogenicTag: '非典型感染排查',
  },
  {
    id: 'systemic_steroids',
    label: '類固醇（長期口服或注射）',
    iatrogenicTag: '血糖波動與胃黏膜刺激',
  },
  {
    id: 'antihypertensives',
    label: '降血壓藥（如 ACEI / ARB / CCB / 利尿劑）',
    iatrogenicTag: '乾咳、下肢水腫或姿勢性頭暈排查',
  },
  {
    id: 'statins_lipid',
    label: '降血脂藥（Statins 史他汀類）或紅麴保健品',
    iatrogenicTag: '對稱性肌肉痠痛無力排查',
  },
  {
    id: 'nsaids_regular',
    label: '消炎止痛藥 (NSAIDs，如 Ibuprofen、Diclofenac)',
    iatrogenicTag: '上腹潰瘍痛與腎負荷排查',
  },
  {
    id: 'insulin_oral_hypo',
    label: '胰島素或口服降血糖藥',
    iatrogenicTag: '心悸冷汗手抖低血糖排查',
  },
  {
    id: 'supplements_herbal',
    label: '常規高劑量保健品（魚油、銀杏、維生素等）',
    iatrogenicTag: '交互作用排查',
  },
];

export function ContextProfileCard() {
  const {
    contextProfile,
    isProfileExpanded,
    updateContextProfile,
    setProfileExpanded,
  } = useDiagnosisStore();

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
    SEX_OPTIONS.find((s) => s.value === contextProfile.biologicalSex)?.label ||
    '未設定';
  const ageLabel =
    AGE_GROUPS.find((a) => a.value === contextProfile.ageGroup)?.label ||
    '未設定';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg overflow-hidden transition-all">
      {/* 常駐頂部摘要列 */}
      <button
        type="button"
        onClick={() => setProfileExpanded(!isProfileExpanded)}
        className="w-full px-4 py-3.5 flex flex-wrap items-center justify-between gap-2 bg-slate-900 hover:bg-slate-800/70 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-sm">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-extrabold text-slate-100">
                基礎生理情境卡片（Context Profile & 藥源性排查基底）
              </span>
              <span className="text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                LocalStorage 自動記憶
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-200">{ageLabel}</span>
              <span>•</span>
              <span className="font-semibold text-slate-200">{sexLabel}</span>
              {contextProfile.biologicalSex === 'female' &&
                contextProfile.pregnancyStatus === 'possible_or_confirmed' && (
                  <>
                    <span>•</span>
                    <span className="text-rose-300 font-bold bg-rose-950/80 border border-rose-700/60 px-1.5 py-0.2 rounded">
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
                固定用藥／保健品：
                {contextProfile.highRiskMedications.length > 0
                  ? `${contextProfile.highRiskMedications.length} 項`
                  : '無'}
              </span>
              {contextProfile.highRiskMedications.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  已啟用藥源性副作用排查
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-3 py-1.5 rounded-xl">
          <span>{isProfileExpanded ? '收合生理情境' : '展開設定情境與用藥'}</span>
          {isProfileExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* 展開後的暗黑編輯面板 */}
      {isProfileExpanded && (
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. 年齡區間 */}
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-slate-300 mb-2">
                1. 年齡區間（影響疾病發生率加權）
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5">
                {AGE_GROUPS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => updateContextProfile({ ageGroup: g.value })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-all border ${
                      contextProfile.ageGroup === g.value
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-sm'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 生理性別與懷孕可能性 */}
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  2. 生理性別（影響解剖器官與婦科／泌尿鑑別）
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SEX_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() =>
                        updateContextProfile({ biologicalSex: s.value })
                      }
                      className={`px-2.5 py-2 rounded-lg text-xs font-semibold text-center transition-all border ${
                        contextProfile.biologicalSex === s.value
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-sm'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {contextProfile.biologicalSex === 'female' && (
                <div className="pt-2.5 border-t border-slate-800">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-rose-300 mb-2">
                    <Baby className="w-3.5 h-3.5" />
                    目前是否可能懷孕或正處於孕期？
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'no', label: '無懷孕可能' },
                      {
                        value: 'possible_or_confirmed',
                        label: '可能懷孕 / 已懷孕',
                      },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          updateContextProfile({
                            pregnancyStatus: opt.value as PregnancyPossibility,
                          })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          contextProfile.pregnancyStatus === opt.value
                            ? opt.value === 'possible_or_confirmed'
                              ? 'bg-rose-600 text-white border-rose-400 shadow-sm'
                              : 'bg-slate-700 text-white border-slate-600'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. 目前固定用藥與常規保健品 (藥源性排查) */}
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                <Pill className="w-3.5 h-3.5 text-amber-400" />
                3. 固定用藥與常規保健品（供後端藥源性副作用排查）
              </label>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {HIGH_RISK_MEDS.map((med) => {
                  const checked = contextProfile.highRiskMedications.includes(
                    med.id
                  );
                  return (
                    <button
                      key={med.id}
                      type="button"
                      onClick={() => toggleMedication(med.id)}
                      className={`w-full p-2 rounded-lg text-left text-xs border transition-all flex items-start justify-between gap-2 ${
                        checked
                          ? 'bg-amber-500/15 border-amber-400 text-amber-100 font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{med.label}</span>
                      <span className="shrink-0 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                        {med.iatrogenicTag}
                      </span>
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={contextProfile.customMedicationNote || ''}
                onChange={(e) =>
                  updateContextProfile({ customMedicationNote: e.target.value })
                }
                placeholder="選填其他具體藥名或保健品（如：Lisinopril、紅麴、魚油）..."
                className="mt-2 w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* 4. 重大慢性病史 */}
          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
              <HeartPulse className="w-3.5 h-3.5 text-cyan-400" />
              4. 重大慢性病史（可複選，供多專科鑑別診斷加權）
            </label>
            <div className="flex flex-wrap gap-2">
              {CHRONIC_CONDITIONS.map((cond) => {
                const active = contextProfile.chronicConditions.includes(
                  cond.id
                );
                return (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => toggleCondition(cond.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      active
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-sm'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
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
