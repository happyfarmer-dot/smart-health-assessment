'use client';

import React, { useMemo } from 'react';
import {
  UserCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  HeartPulse,
  Pill,
  Baby,
  CheckCircle2,
  Scale,
  Flame,
  Dna,
  Plane,
  ShieldAlert,
} from 'lucide-react';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import {
  AgeGroup,
  AlcoholHabit,
  BetelNutHabit,
  BiologicalSex,
  ChronicConditionId,
  ExerciseFrequency,
  FamilyHistoryConditionId,
  HighRiskMedicationId,
  PregnancyPossibility,
  RecentEventToccId,
  SmokingStatus,
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

const SMOKING_OPTIONS: { value: SmokingStatus; label: string }[] = [
  { value: 'never', label: '從未吸菸' },
  { value: 'former', label: '已戒菸' },
  { value: 'current', label: '目前吸菸中' },
];

const ALCOHOL_OPTIONS: { value: AlcoholHabit; label: string }[] = [
  { value: 'none', label: '不飲酒' },
  { value: 'social_occasional', label: '偶爾小酌 / 社交飲酒' },
  { value: 'regular_heavy', label: '經常飲酒 / 重度飲酒' },
];

const BETEL_OPTIONS: { value: BetelNutHabit; label: string }[] = [
  { value: 'never', label: '從未嚼檳榔' },
  { value: 'former_or_current', label: '曾嚼或目前嚼食檳榔' },
];

const EXERCISE_OPTIONS: { value: ExerciseFrequency; label: string }[] = [
  { value: 'sedentary', label: '久坐少動（幾乎無運動）' },
  { value: 'moderate_1_2_week', label: '每週運動 1–2 次' },
  { value: 'active_3_plus_week', label: '規律運動（每週 ≥ 3 次）' },
];

const CHRONIC_CONDITIONS: { id: ChronicConditionId; label: string }[] = [
  { id: 'hypertension', label: '高血壓' },
  { id: 'diabetes', label: '糖尿病' },
  { id: 'hyperlipidemia', label: '高血脂' },
  { id: 'coronary_heart_dis', label: '冠心病 / 心律不整' },
  { id: 'asthma_copd', label: '氣喘 / 慢性肺病' },
  { id: 'peptic_ulcer_gerd', label: '胃潰瘍 / 胃食道逆流' },
  { id: 'chronic_kidney_dis', label: '慢性腎臟病' },
  { id: 'liver_disease', label: '慢性肝病 / B、C 肝' },
  { id: 'autoimmune_disease', label: '自體免疫疾病' },
  { id: 'cancer_history', label: '惡性腫瘤病史' },
];

const FAMILY_HISTORY_OPTIONS: { id: FamilyHistoryConditionId; label: string }[] = [
  { id: 'cvd_coronary', label: '早發心血管疾病／心肌梗塞' },
  { id: 'stroke', label: '腦中風家族史' },
  { id: 'diabetes', label: '糖尿病家族史' },
  { id: 'cancer', label: '惡性腫瘤（癌症）家族史' },
  { id: 'autoimmune', label: '自體免疫／風濕疾病家族史' },
];

const RECENT_TOCC_OPTIONS: {
  id: RecentEventToccId;
  label: string;
  clinicalTag: string;
}[] = [
  {
    id: 'recent_surgery_trauma_fracture',
    label: '近 1 個月內曾有手術、外傷或骨折',
    clinicalTag: '術後感染／深部靜脈栓塞／骨科併發症排查',
  },
  {
    id: 'long_flight_bedrest_immobility',
    label: '近期長途飛行（>4小時）、久坐不動或長期臥床',
    clinicalTag: '下肢深部靜脈栓塞 (DVT) 與急性肺栓塞 (PE) 高風險因子',
  },
  {
    id: 'recent_travel_infectious_contact',
    label: '近期國內外旅遊史、山林郊外蚊蟲叮咬或傳染病接觸史 (TOCC)',
    clinicalTag: '登革熱、恙蟲病、流感或特殊傳染病排查',
  },
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

  const familyHistoryList = contextProfile.familyHistory || [];
  const recentToccList = contextProfile.recentEventsTocc || [];

  // 自動計算 BMI (kg / m^2) 與台灣衛福部國健署成人 BMI 分級
  const bmiInfo = useMemo(() => {
    const h = contextProfile.heightCm;
    const w = contextProfile.weightKg;
    if (!h || !w || h < 50 || h > 250 || w < 10 || w > 350) return null;
    const m = h / 100;
    const bmi = Number((w / (m * m)).toFixed(1));
    let categoryZh = '正常範圍';
    let badgeClass =
      'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
    if (bmi < 18.5) {
      categoryZh = '體重過輕';
      badgeClass = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40';
    } else if (bmi >= 24 && bmi < 27) {
      categoryZh = '過重';
      badgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/40';
    } else if (bmi >= 27) {
      categoryZh = '肥胖（心血管／代謝／關節負荷加權）';
      badgeClass = 'bg-rose-500/15 text-rose-300 border-rose-500/40';
    }
    return { bmi, categoryZh, badgeClass };
  }, [contextProfile.heightCm, contextProfile.weightKg]);

  const toggleCondition = (id: ChronicConditionId) => {
    const exists = contextProfile.chronicConditions.includes(id);
    const next = exists
      ? contextProfile.chronicConditions.filter((c) => c !== id)
      : [...contextProfile.chronicConditions, id];
    updateContextProfile({ chronicConditions: next });
  };

  const toggleFamilyHistory = (id: FamilyHistoryConditionId) => {
    const exists = familyHistoryList.includes(id);
    const next = exists
      ? familyHistoryList.filter((f) => f !== id)
      : [...familyHistoryList, id];
    updateContextProfile({ familyHistory: next });
  };

  const toggleRecentTocc = (id: RecentEventToccId) => {
    const exists = recentToccList.includes(id);
    const next = exists
      ? recentToccList.filter((t) => t !== id)
      : [...recentToccList, id];
    updateContextProfile({ recentEventsTocc: next });
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

  const parseNum = (v: string): number | undefined => {
    const t = v.trim();
    if (!t) return undefined;
    const n = Number(t);
    return Number.isFinite(n) ? n : undefined;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg overflow-hidden transition-all">
      {/* 常駐頂部摘要列（預設摺疊，點擊展開 5 大分組完整設定） */}
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
                基礎生理情境卡片（Context Profile：體態 BMI・習慣・病史過敏・用藥・TOCC）
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
              {bmiInfo && (
                <>
                  <span>•</span>
                  <span className="text-cyan-300 font-semibold">
                    BMI {bmiInfo.bmi} ({bmiInfo.categoryZh})
                  </span>
                </>
              )}
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
                慢性病：{contextProfile.chronicConditions.length} 項 / 家族史：
                {familyHistoryList.length} 項
              </span>
              <span>•</span>
              <span>
                用藥／保健品：{contextProfile.highRiskMedications.length} 項
              </span>
              {recentToccList.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-medium">
                  <Plane className="w-3 h-3" />
                  近期 TOCC / 手術血栓風險 {recentToccList.length} 項
                </span>
              )}
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
          <span>
            {isProfileExpanded
              ? '收合生理情境卡'
              : '展開填寫完整生理情境（BMI／菸酒／過敏／家族史／用藥／TOCC）'}
          </span>
          {isProfileExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* 展開後的 5 大臨床分組編輯面板 */}
      {isProfileExpanded && (
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 space-y-5">
          {/* ==================== 分組 1 & 2：基本體態 (含自動計算 BMI) + 生活與風險習慣 ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 分組 1：基本體態 */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  一、基本體態（年齡、生理性別、身高體重與自動 BMI 計算）
                </span>
                {bmiInfo && (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${bmiInfo.badgeClass}`}
                  >
                    BMI: {bmiInfo.bmi} · {bmiInfo.categoryZh}
                  </span>
                )}
              </div>

              {/* 年齡區間 */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  年齡區間（決定各年齡層疾病發生率基準）
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {AGE_GROUPS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => updateContextProfile({ ageGroup: g.value })}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all border ${
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

              {/* 身高 (cm) 與 體重 (kg) 自動計算 BMI */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 items-end">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    身高 (cm)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="250"
                    placeholder="例如 168"
                    value={contextProfile.heightCm ?? ''}
                    onChange={(e) =>
                      updateContextProfile({
                        heightCm: parseNum(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    體重 (kg)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    step="0.5"
                    placeholder="例如 65"
                    value={contextProfile.weightKg ?? ''}
                    onChange={(e) =>
                      updateContextProfile({
                        weightKg: parseNum(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-1.5 text-xs">
                  <div className="text-[10px] text-slate-400">身體質量指數 BMI</div>
                  <div className="font-mono font-bold text-cyan-300">
                    {bmiInfo
                      ? `${bmiInfo.bmi} kg/m²`
                      : '輸入身高體重自動計算'}
                  </div>
                </div>
              </div>

              {/* 生理性別與懷孕可能 */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    生理性別（影響婦產科／泌尿科解剖器官鑑別）
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SEX_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() =>
                          updateContextProfile({ biologicalSex: s.value })
                        }
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-center transition-all border ${
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
                  <div className="pt-2 border-t border-slate-800">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-rose-300 mb-1.5">
                      <Baby className="w-3.5 h-3.5" />
                      是否可能懷孕或目前懷孕中？（攸關子宮外孕排查與影像檢查禁忌）
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { value: 'no', label: '無懷孕可能' },
                          {
                            value: 'possible_or_confirmed',
                            label: '可能懷孕 / 已懷孕',
                          },
                        ] as { value: PregnancyPossibility; label: string }[]
                      ).map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() =>
                            updateContextProfile({ pregnancyStatus: p.value })
                          }
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            contextProfile.pregnancyStatus === p.value
                              ? p.value === 'possible_or_confirmed'
                                ? 'bg-rose-600 text-white border-rose-500 font-bold'
                                : 'bg-slate-700 text-white border-slate-600'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 分組 2：生活與風險習慣（菸、酒、檳榔、日常運動頻率） */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3.5">
              <div className="border-b border-slate-800 pb-2">
                <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  二、生活與風險習慣（抽菸、飲酒、嚼檳榔史、日常運動頻率）
                </span>
              </div>

              {/* 抽菸史 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  1. 抽菸史（影響慢性肺病、心血管、周邊動脈與肺癌風險）
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SMOKING_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        updateContextProfile({ smokingStatus: opt.value })
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        (contextProfile.smokingStatus || 'never') === opt.value
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 飲酒習慣 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  2. 飲酒習慣（影響急性胰臟炎、酒精性肝炎、痛風與胃潰瘍風險）
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {ALCOHOL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        updateContextProfile({ alcoholHabit: opt.value })
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        (contextProfile.alcoholHabit || 'none') === opt.value
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 嚼檳榔史 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  3. 嚼檳榔史（影響口腔黏膜白斑、張口受限與口腔咽喉病變風險）
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {BETEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        updateContextProfile({ betelNutHabit: opt.value })
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        (contextProfile.betelNutHabit || 'never') === opt.value
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 日常運動頻率 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  4. 日常運動頻率
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {EXERCISE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        updateContextProfile({ exerciseFrequency: opt.value })
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        (contextProfile.exerciseFrequency ||
                          'moderate_1_2_week') === opt.value
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ==================== 分組 3：重大慢性病史、藥物與食物過敏史、重大家族病史 ==================== */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <span className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5">
                <Dna className="w-4 h-4 text-cyan-400" />
                三、病史與過敏（重大慢性病史、藥物／食物過敏史、重大家族病史）
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 本人重大慢性病史 (複選 + 自填) */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <HeartPulse className="w-3.5 h-3.5 text-cyan-400" />
                  1. 本人重大慢性病史（可複選）
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CHRONIC_CONDITIONS.map((c) => {
                    const active = contextProfile.chronicConditions.includes(
                      c.id
                    );
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCondition(c.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all border ${
                          active
                            ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {c.label}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={contextProfile.customChronicNote || ''}
                  onChange={(e) =>
                    updateContextProfile({ customChronicNote: e.target.value })
                  }
                  placeholder="其他過去病史自填（例如：甲狀腺亢進、痛風、膽結石、曾開過刀...）"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* 藥物與食物過敏史 + 重大家族病史 */}
              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-rose-300 mb-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    2. 藥物與食物過敏史（例如：盤尼西林、NSAIDs 止痛藥、顯影劑、海鮮花生）
                  </label>
                  <input
                    type="text"
                    value={contextProfile.drugAndFoodAllergies || ''}
                    onChange={(e) =>
                      updateContextProfile({
                        drugAndFoodAllergies: e.target.value,
                      })
                    }
                    placeholder="若無過敏可留空；若有過敏藥物或食物請填寫以利處置建議避開..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    3. 重大家族病史（一等或二等親屬曾患以下疾病，可複選）
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {FAMILY_HISTORY_OPTIONS.map((fh) => {
                      const active = familyHistoryList.includes(fh.id);
                      return (
                        <button
                          key={fh.id}
                          type="button"
                          onClick={() => toggleFamilyHistory(fh.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            active
                              ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400 font-bold'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {active ? '✓ ' : '+ '}
                          {fh.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== 分組 4：目前用藥與常規保健品（藥源性症狀排查） ==================== */}
          <div className="bg-slate-900 p-4 rounded-xl border border-amber-500/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300">
                <Pill className="w-4 h-4 text-amber-400" />
                四、目前固定處方用藥與常規保健品（供系統執行「藥源性副作用排查 Iatrogenic Check」）
              </label>
              <span className="text-[11px] text-amber-200/80">
                例如：降血脂藥與肌肉痠痛、ACEI 降壓藥與慢性乾咳、NSAIDs 止痛藥與胃痛黑便
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {HIGH_RISK_MEDS.map((m) => {
                const active = contextProfile.highRiskMedications.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMedication(m.id)}
                    className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between gap-1.5 ${
                      active
                        ? 'bg-amber-500/20 text-amber-100 border-amber-400 shadow-sm'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold leading-snug">
                      {active ? '✓ ' : '+ '}
                      {m.label}
                    </div>
                    <div
                      className={`text-[10px] px-1.5 py-0.5 rounded self-start ${
                        active
                          ? 'bg-amber-400/20 text-amber-200 font-semibold'
                          : 'bg-slate-900 text-slate-500'
                      }`}
                    >
                      {m.iatrogenicTag}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-1">
              <input
                type="text"
                value={contextProfile.customMedicationNote || ''}
                onChange={(e) =>
                  updateContextProfile({ customMedicationNote: e.target.value })
                }
                placeholder="可選填您目前服用的具體藥名或保健品名稱（例如：Lipitor、脈優 Norvasc、阿斯匹靈、紅麴、魚油）..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* ==================== 分組 5：近期特殊事件 (TOCC 與手術／血栓／旅遊接觸史) ==================== */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-xs font-extrabold text-rose-300">
                <Plane className="w-4 h-4 text-rose-400" />
                五、近期特殊事件（TOCC 與病程背景：手術外傷、長途飛行久臥血栓風險、旅遊接觸史）
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {RECENT_TOCC_OPTIONS.map((item) => {
                const active = recentToccList.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleRecentTocc(item.id)}
                    className={`p-3 rounded-xl text-left transition-all border flex flex-col justify-between gap-1.5 ${
                      active
                        ? 'bg-rose-500/20 text-rose-100 border-rose-400 shadow-sm'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold leading-snug">
                      {active ? '✓ ' : '+ '}
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      臨床關聯：{item.clinicalTag}
                    </div>
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={contextProfile.customToccNote || ''}
              onChange={(e) =>
                updateContextProfile({ customToccNote: e.target.value })
              }
              placeholder="補充近期特殊事件（例如：兩週前去東南亞旅遊、上週剛做完膝關節手術、昨日去山區露營被蚊蟲叮咬...）"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}
