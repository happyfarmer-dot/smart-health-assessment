'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  CheckCircle2,
  Clock,
  Droplets,
  Flame,
  Gauge,
  HeartPulse,
  HelpCircle,
  Loader2,
  Pill,
  ShieldAlert,
  SkipForward,
  Sparkles,
  Stethoscope,
  Thermometer,
  Trash2,
  Upload,
  Wind,
  X,
} from 'lucide-react';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import {
  BodyRegionId,
  ClinicalAttachmentImage,
  DiagnosisRequestPayload,
  DynamicFollowUpAnswerItem,
  DynamicFollowUpQuestion,
  OnsetPattern,
  SelfTreatmentId,
  TreatmentResponseLevel,
  TriggerOrReliefFactorId,
} from '@/types/cdss';
import { evaluateObjectiveVitalSigns } from '@/lib/vitalSignsEvaluator';
import { fetchDynamicFollowUpQuestionsIsomorphic } from '@/lib/diagnosisStreamRunner';
import { GlossaryText } from './GlossaryText';

const SELF_TREATMENT_OPTIONS: Array<{ id: SelfTreatmentId; labelZh: string }> = [
  { id: 'analgesic_nsaids', labelZh: '止痛消炎藥（普拿疼／NSAIDs）' },
  { id: 'antacid_ppi', labelZh: '胃藥／制酸劑' },
  { id: 'antihistamine', labelZh: '抗組織胺／過敏藥' },
  { id: 'cold_otc', labelZh: '感冒成藥' },
  { id: 'ice_pack', labelZh: '冰敷' },
  { id: 'heat_pack', labelZh: '熱敷' },
  { id: 'rest_lying', labelZh: '休息平躺' },
];

const TREATMENT_RESPONSE_OPTIONS: Array<{
  id: TreatmentResponseLevel;
  labelZh: string;
}> = [
  { id: 'significant_relief', labelZh: '明顯緩解' },
  { id: 'mild_relief', labelZh: '稍微緩解' },
  { id: 'no_effect', labelZh: '完全無效' },
  { id: 'worsened', labelZh: '反而加重' },
];

/**
 * 純前端 Canvas 安全預處理：等比例縮放至長邊上限 1024px、JPEG 品質 0.8，
 * 重新繪製像素以自動剝除照片中的 EXIF GPS 定位與裝置個資。
 */
async function compressAndStripExifToJpeg(
  file: File
): Promise<ClinicalAttachmentImage> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('讀取圖片失敗'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('圖片格式不支援'));
    el.src = dataUrl;
  });

  const MAX_EDGE = 1024;
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height, 1));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('瀏覽器不支援 Canvas 壓縮');
  }
  ctx.drawImage(img, 0, 0, width, height);

  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.8);
  const base64Data = jpegDataUrl.split(',')[1] || '';
  const sizeKb = Math.max(1, Math.round((base64Data.length * 3) / 4 / 1024));

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fileName: file.name,
    mimeType: 'image/jpeg',
    base64Data,
    previewDataUrl: jpegDataUrl,
    width,
    height,
    sizeKb,
  };
}

interface TwoStageFollowUpModalProps {
  onConfirmAndStartDiagnosis: (params: {
    wasSkipped: boolean;
    answers: DynamicFollowUpAnswerItem[];
    attachments?: ClinicalAttachmentImage[];
  }) => void;
}

const ONSET_OPTIONS: Array<{
  id: OnsetPattern;
  labelZh: string;
  descZh: string;
}> = [
  {
    id: 'sudden_acute',
    labelZh: '突發性劇烈發作（數秒至數分鐘內達高峰）',
    descZh: '需優先排查血管急症、結石嵌頓絞痛或急性臟器穿孔',
  },
  {
    id: 'gradual_hours_days',
    labelZh: '漸進性發作（數小時至數天內逐漸明顯）',
    descZh: '常見於急性感染症、臟器發炎（如膽囊炎、闌尾炎）或代謝異常',
  },
  {
    id: 'chronic_weeks_months',
    labelZh: '慢性反覆發作（持續數週至數月以上）',
    descZh: '常見於功能性腸胃疾病、退化性筋膜病變、慢性潰瘍或自體免疫問題',
  },
];

const DURATION_OPTIONS = [
  '少於 24 小時（今日新發）',
  '1 ～ 3 天',
  '4 ～ 7 天',
  '1 ～ 4 週',
  '超過 1 個月（慢性持續或反覆）',
];

const MODIFYING_FACTOR_OPTIONS: Array<{
  id: TriggerOrReliefFactorId;
  labelZh: string;
}> = [
  { id: 'worse_after_meal_fatty', labelZh: '飯後或油膩飲食後明顯加劇' },
  { id: 'worse_on_empty_stomach', labelZh: '空腹飢餓或半夜時加劇' },
  { id: 'worse_with_exertion', labelZh: '活動、出力或運動走路時加劇' },
  { id: 'worse_with_deep_breath', labelZh: '深呼吸或咳嗽時明顯加劇' },
  { id: 'worse_when_lying_flat', labelZh: '平躺時加劇（坐起或身體前傾可緩解）' },
  { id: 'worse_with_posture_press', labelZh: '按壓局部或轉動／彎腰姿勢改變時加劇' },
  { id: 'relieved_by_rest', labelZh: '休息靜臥後可逐漸緩解' },
  { id: 'relieved_by_bowel_gas', labelZh: '排便或排氣後可緩解' },
];

export const TwoStageFollowUpModal: React.FC<TwoStageFollowUpModalProps> = ({
  onConfirmAndStartDiagnosis,
}) => {
  const {
    apiSettings,
    setApiModalOpen,
    isFollowUpModalOpen,
    setFollowUpModalOpen,
    followUp,
    updateFollowUp,
    updateVitalSigns,
    toggleModifyingFactor,
    contextProfile,
    selectedRegions,
    systemicSymptomIds,
  } = useDiagnosisStore();

  const [step, setStep] = useState<'step1_vitals' | 'step2_dynamic'>('step1_vitals');
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [hypothesesSummaryZh, setHypothesesSummaryZh] = useState('');
  const [dynamicQuestions, setDynamicQuestions] = useState<DynamicFollowUpQuestion[]>([]);
  const [selectedOptionMap, setSelectedOptionMap] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<ClinicalAttachmentImage[]>([]);
  const [isCompressingImages, setIsCompressingImages] = useState(false);
  const [imageErrorMsg, setImageErrorMsg] = useState<string | null>(null);

  const regionRecords = Object.values(selectedRegions);

  // 同步「症狀出現先後順序」與當前已選部位清單
  const orderedRegionIds = useMemo<BodyRegionId[]>(() => {
    const currentIds = regionRecords.map((r) => r.regionId);
    const saved = (followUp.regionOnsetOrder || []).filter((id) =>
      currentIds.includes(id)
    );
    const remaining = currentIds.filter((id) => !saved.includes(id));
    return [...saved, ...remaining];
  }, [regionRecords, followUp.regionOnsetOrder]);

  // 當 Modal 打開時重置回 Step 1
  useEffect(() => {
    if (isFollowUpModalOpen) {
      setStep('step1_vitals');
      setImageErrorMsg(null);
    }
  }, [isFollowUpModalOpen]);

  const vitalsEvaluation = useMemo(
    () => evaluateObjectiveVitalSigns(followUp.vitals || {}),
    [followUp.vitals]
  );

  if (!isFollowUpModalOpen) return null;

  const moveRegionOrder = (index: number, delta: -1 | 1) => {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= orderedRegionIds.length) return;
    const next = [...orderedRegionIds];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    updateFollowUp({ regionOnsetOrder: next });
  };

  const toggleSelfTreatment = (id: SelfTreatmentId) => {
    const current = followUp.selfTreatments || [];
    const next = current.includes(id)
      ? current.filter((t) => t !== id)
      : [...current, id];
    updateFollowUp({
      selfTreatments: next,
      treatmentResponse: next.length === 0 ? undefined : followUp.treatmentResponse,
    });
  };

  const handleImageFilesChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const remainingSlots = Math.max(0, 5 - attachments.length);
    if (remainingSlots === 0) {
      setImageErrorMsg('最多僅可附加 5 張圖片，請先移除不需要的圖片。');
      return;
    }

    setImageErrorMsg(null);
    setIsCompressingImages(true);
    try {
      const processed: ClinicalAttachmentImage[] = [];
      for (const file of files.slice(0, remainingSlots)) {
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressAndStripExifToJpeg(file);
        processed.push(compressed);
      }
      if (processed.length > 0) {
        setAttachments((prev) => [...prev, ...processed].slice(0, 5));
      }
    } catch (err) {
      setImageErrorMsg(
        err instanceof Error ? err.message : '圖片壓縮失敗，請更換其他照片。'
      );
    } finally {
      setIsCompressingImages(false);
    }
  };

  const hasValidGeminiKey =
    apiSettings.enabled && apiSettings.apiKey.trim().length >= 12;

  const handleProceedToDynamicQuestions = async () => {
    setStep('step2_dynamic');
    setIsLoadingQuestions(true);

    const normalizedFollowUp =
      orderedRegionIds.length > 1
        ? { ...followUp, regionOnsetOrder: orderedRegionIds }
        : followUp;

    const basePayload: Omit<DiagnosisRequestPayload, 'dynamicAnswers'> = {
      contextProfile,
      regionRecords,
      systemicSymptomIds,
      followUp: normalizedFollowUp,
      attachments,
      clientTimestamp: new Date().toISOString(),
    };

    const res = await fetchDynamicFollowUpQuestionsIsomorphic(basePayload);
    const normalizedQuestions = res.questions.map((q) => {
      const hasNegative = q.options.some(
        (o) =>
          o.optionId === 'negative_none_or_uncertain' ||
          o.labelZh.includes('以上特徵皆不符合')
      );
      if (hasNegative) return q;
      return {
        ...q,
        options: [
          ...q.options,
          {
            optionId: 'negative_none_or_uncertain',
            labelZh: '以上特徵皆不符合／不確定',
            clinicalWeightTag: 'negative_none_or_uncertain',
          },
        ],
      };
    });
    setHypothesesSummaryZh(res.clinicalContextSummaryZh);
    setDynamicQuestions(normalizedQuestions);

    const initAnswers: Record<string, string> = {};
    normalizedQuestions.forEach((q) => {
      if (selectedOptionMap[q.questionId]) {
        initAnswers[q.questionId] = selectedOptionMap[q.questionId];
      }
    });
    setSelectedOptionMap(initAnswers);
    setIsLoadingQuestions(false);
  };

  const handleSkipDynamicAndRun = () => {
    if (orderedRegionIds.length > 1) {
      updateFollowUp({ regionOnsetOrder: orderedRegionIds });
    }
    setFollowUpModalOpen(false);
    onConfirmAndStartDiagnosis({
      wasSkipped: true,
      answers: [],
      attachments,
    });
  };

  const handleSubmitDynamicAndRun = () => {
    if (orderedRegionIds.length > 1) {
      updateFollowUp({ regionOnsetOrder: orderedRegionIds });
    }
    const answers: DynamicFollowUpAnswerItem[] = [];
    for (const q of dynamicQuestions) {
      const chosenOptId = selectedOptionMap[q.questionId];
      if (!chosenOptId) continue;
      const optObj = q.options.find((o) => o.optionId === chosenOptId);
      if (!optObj) continue;

      answers.push({
        questionId: q.questionId,
        questionTextZh: q.questionTextZh,
        selectedOptionId: optObj.optionId,
        selectedOptionLabelZh: optObj.labelZh,
        clinicalWeightTag: optObj.clinicalWeightTag,
      });
    }

    setFollowUpModalOpen(false);
    onConfirmAndStartDiagnosis({
      wasSkipped: answers.length === 0,
      answers,
      attachments,
    });
  };

  const parseNumberInput = (val: string): number | undefined => {
    const trimmed = val.trim();
    if (!trimmed) return undefined;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : undefined;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* 頂部標題與兩階段進度條 */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  臨床特徵、生命徵象與 AI 假說驅動動態追問
                </h2>
                <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
                  {step === 'step1_vitals' ? 'Step 1 / 2' : 'Step 2 / 2'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {step === 'step1_vitals'
                  ? '補充發作病程與客觀生理數值（體溫、血壓、血氧、血糖），大幅提升西醫鑑別診斷特異度'
                  : 'AI 根據您標記的症狀假說，即時生成 2～3 題關鍵鑑別單選題以縮小疑似疾病範圍'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFollowUpModalOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            aria-label="關閉追問視窗"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 內容捲動區 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {step === 'step1_vitals' ? (
            <>
              {/* 1. 發作型態與持續時間 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    <Clock className="h-3.5 w-3.5" />
                    1. 症狀發作起病型態 (Onset Pattern)
                  </label>
                  <div className="space-y-2">
                    {ONSET_OPTIONS.map((item) => {
                      const active = followUp.onsetPattern === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => updateFollowUp({ onsetPattern: item.id })}
                          className={`w-full text-left rounded-xl border p-3 transition-all ${
                            active
                              ? 'border-cyan-500 bg-cyan-950/40 text-slate-100 shadow-sm shadow-cyan-500/10'
                              : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-semibold">{item.labelZh}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{item.descZh}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* 持續時間 */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                      <Activity className="h-3.5 w-3.5" />
                      2. 本次不適已持續時間 (Duration)
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {DURATION_OPTIONS.map((dur) => {
                        const active = followUp.durationLabelZh === dur;
                        return (
                          <button
                            key={dur}
                            type="button"
                            onClick={() => updateFollowUp({ durationLabelZh: dur })}
                            className={`text-left rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                              active
                                ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                                : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            {dur}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* VAS 嚴重度滑桿 */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">
                        3. 不適／疼痛嚴重度 (<GlossaryText text="VAS" /> 1–10 分)
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                          followUp.severityScore >= 8
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : followUp.severityScore >= 5
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {followUp.severityScore} / 10 分
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={followUp.severityScore}
                      onChange={(e) =>
                        updateFollowUp({ severityScore: Number(e.target.value) })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>1–3 輕微不適</span>
                      <span>4–6 中度干擾睡眠/活動</span>
                      <span>7–10 劇烈難忍</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. 客觀生理數值 / 生命徵象輸入區 (V4 新增核心功能) */}
              <div className="rounded-xl border border-cyan-500/30 bg-slate-950/80 p-4 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                      4. 客觀生理數值／生命徵象（選填，若手邊有血壓計、耳溫槍、血氧機強烈建議填寫）
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    系統將自動判讀異常與危急值並納入疾病鑑別權重
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* 體溫 */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-2.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 mb-1.5">
                      <Thermometer className="h-3.5 w-3.5 text-amber-400" />
                      體溫 (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="33"
                      max="43"
                      placeholder="例如 36.8 或 38.5"
                      value={followUp.vitals?.temperatureC ?? ''}
                      onChange={(e) =>
                        updateVitalSigns({
                          temperatureC: parseNumberInput(e.target.value),
                        })
                      }
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* 收縮壓 / 舒張壓 */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-2.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 mb-1.5">
                      <Gauge className="h-3.5 w-3.5 text-rose-400" />
                      血壓 收縮壓 / 舒張壓 (mmHg)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="50"
                        max="260"
                        placeholder="收縮壓 120"
                        value={followUp.vitals?.systolicBp ?? ''}
                        onChange={(e) =>
                          updateVitalSigns({
                            systolicBp: parseNumberInput(e.target.value),
                          })
                        }
                        className="w-1/2 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                      />
                      <span className="text-slate-500 text-xs">/</span>
                      <input
                        type="number"
                        min="30"
                        max="160"
                        placeholder="舒張壓 80"
                        value={followUp.vitals?.diastolicBp ?? ''}
                        onChange={(e) =>
                          updateVitalSigns({
                            diastolicBp: parseNumberInput(e.target.value),
                          })
                        }
                        className="w-1/2 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 心跳速率 */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-2.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 mb-1.5">
                      <HeartPulse className="h-3.5 w-3.5 text-emerald-400" />
                      心跳速率 / 脈搏 (bpm)
                    </label>
                    <input
                      type="number"
                      min="25"
                      max="240"
                      placeholder="例如 75 或 115"
                      value={followUp.vitals?.heartRateBpm ?? ''}
                      onChange={(e) =>
                        updateVitalSigns({
                          heartRateBpm: parseNumberInput(e.target.value),
                        })
                      }
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* 血氧飽和度 SpO2 */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-2.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 mb-1.5">
                      <Wind className="h-3.5 w-3.5 text-cyan-400" />
                      血氧飽和度 SpO2 (%)
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      placeholder="正常 95～100"
                      value={followUp.vitals?.spo2Pct ?? ''}
                      onChange={(e) =>
                        updateVitalSigns({
                          spo2Pct: parseNumberInput(e.target.value),
                        })
                      }
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* 血糖值 */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-2.5 sm:col-span-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 mb-1.5">
                      <Droplets className="h-3.5 w-3.5 text-purple-400" />
                      指尖或抽血血糖值 (mg/dL) 與量測時機
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="number"
                        min="20"
                        max="800"
                        placeholder="例如 95 (空腹) 或 140"
                        value={followUp.vitals?.bloodGlucoseMgDl ?? ''}
                        onChange={(e) =>
                          updateVitalSigns({
                            bloodGlucoseMgDl: parseNumberInput(e.target.value),
                          })
                        }
                        className="sm:w-1/2 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                      />
                      <select
                        value={followUp.vitals?.glucoseTiming ?? 'postprandial'}
                        onChange={(e) =>
                          updateVitalSigns({
                            glucoseTiming: e.target.value as
                              | 'fasting'
                              | 'postprandial',
                          })
                        }
                        className="sm:w-1/2 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="postprandial">餐後或隨機血糖 (Postprandial / Random)</option>
                        <option value="fasting">空腹 8 小時血糖 (Fasting)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 即時生命徵象判讀回饋列 */}
                {vitalsEvaluation.fieldEvaluations.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    {vitalsEvaluation.fieldEvaluations.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                          item.status === 'critical'
                            ? 'border-rose-500/50 bg-rose-950/40 text-rose-200'
                            : item.status === 'warning'
                            ? 'border-amber-500/40 bg-amber-950/30 text-amber-200'
                            : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                        }`}
                      >
                        {item.status === 'critical' ? (
                          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                        ) : item.status === 'warning' ? (
                          <Flame className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-bold">
                            [{item.labelZh} {item.valueText}]
                          </span>{' '}
                          {item.clinicalNoteZh}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. 誘發與緩解因子 + 放射痛備註 */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  5. 誘發或緩解情境（可複選）
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MODIFYING_FACTOR_OPTIONS.map((factor) => {
                    const checked = followUp.modifyingFactors.includes(factor.id);
                    return (
                      <button
                        key={factor.id}
                        type="button"
                        onClick={() => toggleModifyingFactor(factor.id)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                          checked
                            ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 font-medium'
                            : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                            checked
                              ? 'border-cyan-400 bg-cyan-500 text-slate-950 font-bold'
                              : 'border-slate-600 bg-slate-900'
                          }`}
                        >
                          {checked ? '✓' : ''}
                        </span>
                        <span>{factor.labelZh}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    補充放射痛或特殊臨床情境（選填，例如：痛感從右上腹延伸到右肩胛骨、飯後 1 小時特別痛）
                  </label>
                  <input
                    type="text"
                    value={followUp.radiationNote || ''}
                    onChange={(e) => updateFollowUp({ radiationNote: e.target.value })}
                    placeholder="可輸入任何補充細節..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 6. 發作先後順序與疼痛轉移路徑（選填，標記超過 1 個部位時顯示） */}
              {orderedRegionIds.length > 1 && (
                <div className="rounded-xl border border-amber-500/30 bg-slate-950/75 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      6. 症狀出現先後順序與疼痛轉移路徑（選填）
                    </label>
                    <span className="text-[11px] text-slate-400">
                      使用箭頭調整順序（1. 最先發生 → 2. 隨後出現）
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {orderedRegionIds.map((rId, idx) => {
                      const rec = selectedRegions[rId];
                      if (!rec) return null;
                      return (
                        <div
                          key={rId}
                          className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold shrink-0 ${
                                idx === 0
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-slate-800 text-cyan-300 border border-slate-700'
                              }`}
                            >
                              {idx === 0
                                ? '1. 最先發生'
                                : `${idx + 1}. 隨後出現／轉移至此`}
                            </span>
                            <span className="font-semibold text-slate-100 truncate">
                              {rec.regionNameZh}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveRegionOrder(idx, -1)}
                              className="p-1 rounded border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                              title="上移順序"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === orderedRegionIds.length - 1}
                              onClick={() => moveRegionOrder(idx, 1)}
                              className="p-1 rounded border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                              title="下移順序"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <label className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(followUp.hasSymptomMigration)}
                      onChange={(e) =>
                        updateFollowUp({ hasSymptomMigration: e.target.checked })
                      }
                      className="mt-0.5 rounded border-slate-700 bg-slate-900 accent-amber-400"
                    />
                    <span className="text-xs text-slate-200 leading-snug">
                      症狀／疼痛有明顯從原部位轉移到新部位（例如：先肚臍／中上腹悶痛，數小時後轉移並固定至右下腹）
                    </span>
                  </label>
                </div>
              )}

              {/* 7. 已自行處置與用藥反應（選填） */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-cyan-400 shrink-0" />
                  <label className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    {orderedRegionIds.length > 1 ? '7.' : '6.'} 發作後是否曾自行處置或服用成藥？（選填）
                  </label>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {SELF_TREATMENT_OPTIONS.map((item) => {
                    const checked = (followUp.selfTreatments || []).includes(
                      item.id
                    );
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleSelfTreatment(item.id)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs transition-all cursor-pointer ${
                          checked
                            ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200 font-bold'
                            : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {checked ? '✓ ' : ''}
                        {item.labelZh}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    處置或服藥後的反應（單選）：
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {TREATMENT_RESPONSE_OPTIONS.map((resp) => {
                      const active = followUp.treatmentResponse === resp.id;
                      return (
                        <button
                          key={resp.id}
                          type="button"
                          onClick={() =>
                            updateFollowUp({
                              treatmentResponse: active ? undefined : resp.id,
                            })
                          }
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                            active
                              ? resp.id === 'worsened'
                                ? 'border-rose-400 bg-rose-950/70 text-rose-200'
                                : 'border-emerald-400 bg-emerald-950/60 text-emerald-200'
                              : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {resp.labelZh}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 8. Gemini 多模態能力：補充照片或檢驗報告（選填，最多 5 張） */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
                    <label className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      {orderedRegionIds.length > 1 ? '8.' : '7.'} 補充患部外觀照片或檢驗報告（選填，最多 5 張）
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    支援皮膚皮疹／紅腫水泡、口腔喉嚨、眼部充血或健檢抽血數值單
                  </span>
                </div>

                {/* 醒目隱私提醒與 EXIF 剝除說明 */}
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-2.5 text-[11px] text-amber-200 leading-relaxed">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    圖片僅於瀏覽器端壓縮（上限 1024px・自動剝除 EXIF 定位與裝置個資）後直傳 Gemini API 分析，不留存於任何伺服器；上傳檢驗單前請先遮蔽姓名與身分證字號。
                  </span>
                </div>

                {!hasValidGeminiKey && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-slate-300">
                    <span>
                      目前為「基礎規則模式」：需設定 Gemini API Key 才能啟用影像與檢驗單 AI 判讀。
                    </span>
                    <button
                      type="button"
                      onClick={() => setApiModalOpen(true)}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 cursor-pointer"
                    >
                      立即設定 API Key
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <label
                    className={`inline-flex items-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-xs font-bold transition-colors ${
                      attachments.length >= 5 || isCompressingImages
                        ? 'border-slate-700 bg-slate-900 text-slate-500 cursor-not-allowed'
                        : 'border-cyan-500/50 bg-cyan-950/30 hover:bg-cyan-950/60 text-cyan-200 cursor-pointer'
                    }`}
                  >
                    {isCompressingImages ? (
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    ) : (
                      <Upload className="w-4 h-4 text-cyan-400" />
                    )}
                    <span>
                      {isCompressingImages
                        ? '正在壓縮與清除 EXIF...'
                        : `選擇照片／檢驗單 (${attachments.length}/5)`}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={attachments.length >= 5 || isCompressingImages}
                      onChange={handleImageFilesChange}
                      className="hidden"
                    />
                  </label>

                  {attachments.length > 0 && (
                    <span className="text-[11px] font-semibold text-cyan-300">
                      目前總容量：
                      {attachments.reduce((sum, a) => sum + a.sizeKb, 0)} KB
                    </span>
                  )}

                  {imageErrorMsg && (
                    <span className="text-xs text-rose-400 font-semibold">
                      {imageErrorMsg}
                    </span>
                  )}
                </div>

                {attachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="relative rounded-xl border border-slate-800 bg-slate-900 p-2 flex items-center gap-2.5"
                      >
                        <img
                          src={att.previewDataUrl}
                          alt={att.fileName}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold text-slate-200 truncate">
                            {att.fileName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {att.width}×{att.height} · {att.sizeKb} KB (EXIF 已除)
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setAttachments((prev) =>
                              prev.filter((item) => item.id !== att.id)
                            )
                          }
                          className="p-1 text-slate-400 hover:text-rose-400 shrink-0 cursor-pointer"
                          title="移除圖片"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Step 2: AI 假說驅動動態追問 (2-3 題關鍵鑑別題) */
            <div className="space-y-5">
              {isLoadingQuestions ? (
                <div className="flex flex-col items-center justify-center py-14 space-y-3 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                  <div className="text-sm font-semibold text-slate-200">
                    正在根據您的症狀組合與生命徵象推演初步鑑別假說...
                  </div>
                  <p className="text-xs text-slate-400 max-w-md">
                    系統正模擬專科主治醫師問診思維，鎖定 2～3 個最能拉開疾病機率差距的關鍵問題
                  </p>
                </div>
              ) : (
                <>
                  {/* 假說摘要橫幅 */}
                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/25 p-4">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                          臨床鑑別假說鎖定 (Hypothesis-Driven Differential Probing)
                        </div>
                        <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                          {hypothesesSummaryZh}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2-3 題關鍵鑑別題 */}
                  <div className="space-y-4">
                    {dynamicQuestions.map((q, qIdx) => {
                      const chosenOptionId = selectedOptionMap[q.questionId];
                      return (
                        <div
                          key={q.questionId}
                          className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
                                關鍵鑑別追問 #{qIdx + 1}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                鑑別假說：{q.targetHypothesisZh}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-100 pt-1">
                              {q.questionTextZh}
                            </h4>
                            <p className="flex items-start gap-1.5 text-[11px] text-slate-400">
                              <HelpCircle className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                              <span>透過此題答案調整對應疾病在多專科鑑別模型中的臨床符合度權重</span>
                            </p>
                          </div>

                          <div className="space-y-2 pt-1">
                            {q.options.map((opt) => {
                              const isSelected = chosenOptionId === opt.optionId;
                              return (
                                <button
                                  key={opt.optionId}
                                  type="button"
                                  onClick={() =>
                                    setSelectedOptionMap((prev) => ({
                                      ...prev,
                                      [q.questionId]: opt.optionId,
                                    }))
                                  }
                                  className={`w-full flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-xs transition-all ${
                                    isSelected
                                      ? 'border-cyan-500 bg-cyan-950/50 text-slate-100 font-semibold shadow-sm shadow-cyan-500/10'
                                      : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700'
                                  }`}
                                >
                                  <span
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                                      isSelected
                                        ? 'border-cyan-400 bg-cyan-400 text-slate-950 font-bold'
                                        : 'border-slate-600'
                                    }`}
                                  >
                                    {isSelected ? '●' : ''}
                                  </span>
                                  <span>{opt.labelZh}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 底部操作列 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/90 px-5 py-3.5">
          {step === 'step1_vitals' ? (
            <>
              <button
                type="button"
                onClick={handleSkipDynamicAndRun}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-slate-600 hover:bg-slate-800 transition-colors"
              >
                <SkipForward className="h-3.5 w-3.5 text-slate-400" />
                略過追問，直接評估
              </button>

              <button
                type="button"
                onClick={handleProceedToDynamicQuestions}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-teal-400 transition-all"
              >
                <span>下一步：AI 關鍵鑑別追問 (2～3 題)</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('step1_vitals')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                返回修改病程與生命徵象
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSkipDynamicAndRun}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-slate-600 hover:bg-slate-800 transition-colors"
                >
                  <SkipForward className="h-3.5 w-3.5 text-slate-400" />
                  略過追問，直接評估
                </button>

                <button
                  type="button"
                  disabled={isLoadingQuestions}
                  onClick={handleSubmitDynamicAndRun}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 transition-all"
                >
                  <Stethoscope className="h-4 w-4" />
                  <span>回答並開始精準評估</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
