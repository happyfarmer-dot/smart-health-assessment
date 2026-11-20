'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Printer,
  Stethoscope,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  ClinicalAttachmentImage,
  DynamicFollowUpAnswerItem,
  PrimaryDiagnosisResult,
} from '@/types/cdss';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import { BODY_REGION_MAP } from '@/data/bodyRegions';
import { DEPTH_LAYER_CONFIG } from '@/data/discomfortQualities';
import {
  SYSTEMIC_SYMPTOMS_BY_CATEGORY,
  SYSTEMIC_SYMPTOM_MAP,
} from '@/data/systemicSymptomsCatalog';
import { evaluateObjectiveVitalSigns } from '@/lib/vitalSignsEvaluator';

interface DoctorCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessedAt?: string;
  dynamicAnswers?: DynamicFollowUpAnswerItem[];
  attachments?: ClinicalAttachmentImage[];
  primaryResult?: PrimaryDiagnosisResult | null;
}

const ONSET_LABEL: Record<string, string> = {
  sudden_acute: '突發劇烈',
  gradual_hours_days: '數小時至數天漸進',
  chronic_weeks_months: '數天至數週慢性演變',
};

const FACTOR_LABEL: Record<string, string> = {
  worse_after_meal_fatty: '飯後或油膩飲食後加劇',
  worse_on_empty_stomach: '空腹或半夜加劇',
  worse_with_exertion: '活動或運動時加劇',
  worse_with_deep_breath: '深呼吸或咳嗽時加劇',
  worse_when_lying_flat: '平躺時加劇（坐起前傾緩解）',
  worse_with_posture_press: '按壓或姿勢改變時加劇',
  relieved_by_rest: '休息靜臥後緩解',
  relieved_by_bowel_gas: '排便或排氣後緩解',
};

const CHRONIC_LABEL: Record<string, string> = {
  hypertension: '高血壓',
  diabetes: '糖尿病',
  hyperlipidemia: '高血脂',
  asthma_copd: '氣喘 / COPD',
  coronary_heart_dis: '冠心病 / 心律不整',
  chronic_kidney_dis: '慢性腎臟病',
  liver_disease: '慢性肝病 / 肝硬化',
  peptic_ulcer_gerd: '胃潰瘍 / 胃食道逆流',
  autoimmune_disease: '自體免疫疾病',
  cancer_history: '惡性腫瘤病史',
};

const MED_LABEL: Record<string, string> = {
  anticoagulants: '抗凝血劑 / 抗血小板藥',
  immunosuppressants: '免疫抑制劑',
  systemic_steroids: '類固醇',
  antihypertensives: '降血壓藥',
  statins_lipid: '降血脂藥',
  nsaids_regular: '消炎止痛藥 (NSAIDs)',
  insulin_oral_hypo: '胰島素 / 降血糖藥',
  supplements_herbal: '常規保健品',
};

const FAMILY_LABEL: Record<string, string> = {
  cvd_coronary: '心血管 / 冠心病',
  stroke: '腦中風',
  diabetes: '糖尿病',
  cancer: '惡性腫瘤',
  autoimmune: '自體免疫疾病',
};

const TOCC_LABEL: Record<string, string> = {
  recent_surgery_trauma_fracture: '近1個月內手術／外傷／骨折',
  long_flight_bedrest_immobility: '長途飛行／久坐／長期臥床',
  recent_travel_infectious_contact: '近期旅遊史／蚊蟲叮咬／傳染病接觸',
};

const TREATMENT_LABEL: Record<string, string> = {
  analgesic_nsaids: '止痛消炎藥',
  antacid_ppi: '胃藥 / 制酸劑',
  antihistamine: '抗組織胺 / 過敏藥',
  cold_otc: '感冒成藥',
  ice_pack: '冰敷',
  heat_pack: '熱敷',
  rest_lying: '休息平躺',
};

const RESPONSE_LABEL: Record<string, string> = {
  significant_relief: '明顯緩解',
  mild_relief: '稍微緩解',
  no_effect: '完全無效',
  worsened: '反而加重',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function DoctorCheatSheetModal({
  isOpen,
  onClose,
  assessedAt,
  dynamicAnswers = [],
  attachments = [],
  primaryResult = null,
}: DoctorCheatSheetModalProps) {
  const { contextProfile, selectedRegions, systemicSymptomIds, followUp } =
    useDiagnosisStore();

  const [includeAiHint, setIncludeAiHint] = useState(false);
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isInAppWebView, setIsInAppWebView] = useState(false);

  const generatedTime = useMemo(() => {
    if (assessedAt) return assessedAt;
    return new Date().toLocaleString('zh-TW', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [assessedAt]);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/Line\/|FBAN|FBAV|Instagram|MicroMessenger/i.test(ua)) {
        setIsInAppWebView(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('cheat-sheet-open');
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('cheat-sheet-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  const regionRecords = useMemo(
    () => Object.values(selectedRegions),
    [selectedRegions]
  );

  const vitalEval = useMemo(
    () => evaluateObjectiveVitalSigns(followUp.vitals || {}),
    [followUp.vitals]
  );

  const groupedSystemic = useMemo(() => {
    return SYSTEMIC_SYMPTOMS_BY_CATEGORY.map((grp) => ({
      categoryNameZh: grp.categoryNameZh,
      items: grp.items
        .filter((it) => systemicSymptomIds.includes(it.id))
        .map((it) => it.labelZh),
    })).filter((g) => g.items.length > 0);
  }, [systemicSymptomIds]);

  const sexLabel =
    contextProfile.biologicalSex === 'female'
      ? '女性'
      : contextProfile.biologicalSex === 'male'
      ? '男性'
      : '其他';

  const bmiStr =
    contextProfile.heightCm && contextProfile.weightKg
      ? `${contextProfile.heightCm} cm / ${contextProfile.weightKg} kg (BMI ${(
          contextProfile.weightKg / Math.pow(contextProfile.heightCm / 100, 2)
        ).toFixed(1)})`
      : null;

  const pregnancyStr =
    contextProfile.biologicalSex === 'female' &&
    contextProfile.pregnancyStatus &&
    contextProfile.pregnancyStatus !== 'not_applicable'
      ? contextProfile.pregnancyStatus === 'possible_or_confirmed'
        ? '懷孕可能／已確認*'
        : '無懷孕可能'
      : null;

  const allergyStr = contextProfile.drugAndFoodAllergies?.trim() || '';
  const medsList = [
    ...(contextProfile.highRiskMedications || []).map(
      (id) => MED_LABEL[id] || id
    ),
    ...(contextProfile.customMedicationNote?.trim()
      ? [contextProfile.customMedicationNote.trim()]
      : []),
  ];
  const chronicList = [
    ...(contextProfile.chronicConditions || []).map(
      (id) => CHRONIC_LABEL[id] || id
    ),
    ...(contextProfile.customChronicNote?.trim()
      ? [contextProfile.customChronicNote.trim()]
      : []),
  ];
  const familyList = (contextProfile.familyHistory || []).map(
    (id) => FAMILY_LABEL[id] || id
  );
  const toccList = [
    ...(contextProfile.recentEventsTocc || []).map(
      (id) => TOCC_LABEL[id] || id
    ),
    ...(contextProfile.customToccNote?.trim()
      ? [contextProfile.customToccNote.trim()]
      : []),
  ];

  const habitParts: string[] = [];
  if (contextProfile.smokingStatus === 'current') habitParts.push('目前抽菸*');
  else if (contextProfile.smokingStatus === 'former') habitParts.push('曾抽菸');
  if (contextProfile.alcoholHabit === 'regular_heavy') habitParts.push('規律/大量飲酒*');
  else if (contextProfile.alcoholHabit === 'social_occasional') habitParts.push('偶爾飲酒');
  if (contextProfile.betelNutHabit === 'former_or_current') habitParts.push('嚼食檳榔*');

  const v = followUp.vitals || {};
  const vitalItems: Array<{ label: string; value: string; abnormal: boolean }> = [];
  if (v.temperatureC !== undefined) {
    vitalItems.push({
      label: '體溫',
      value: `${v.temperatureC} °C`,
      abnormal: v.temperatureC >= 37.5 || v.temperatureC < 35.0,
    });
  }
  if (v.systolicBp !== undefined || v.diastolicBp !== undefined) {
    const sbp = v.systolicBp ?? 0;
    const dbp = v.diastolicBp ?? 0;
    vitalItems.push({
      label: '血壓',
      value: `${v.systolicBp ?? '-'}/${v.diastolicBp ?? '-'} mmHg`,
      abnormal: sbp >= 140 || (sbp > 0 && sbp < 90) || dbp >= 90,
    });
  }
  if (v.heartRateBpm !== undefined) {
    vitalItems.push({
      label: '心率',
      value: `${v.heartRateBpm} bpm`,
      abnormal: v.heartRateBpm > 100 || v.heartRateBpm < 55,
    });
  }
  if (v.spo2Pct !== undefined) {
    vitalItems.push({
      label: '血氧 SpO2',
      value: `${v.spo2Pct}%`,
      abnormal: v.spo2Pct < 95,
    });
  }
  if (v.bloodGlucoseMgDl !== undefined) {
    vitalItems.push({
      label: '血糖',
      value: `${v.bloodGlucoseMgDl} mg/dL (${
        v.glucoseTiming === 'fasting' ? '空腹' : '飯後'
      })`,
      abnormal: v.bloodGlucoseMgDl >= 180 || v.bloodGlucoseMgDl < 70,
    });
  }

  const onsetOrderText =
    followUp.regionOnsetOrder && followUp.regionOnsetOrder.length > 1
      ? followUp.regionOnsetOrder
          .map((id) => BODY_REGION_MAP[id]?.nameZh || id)
          .join(' → ')
      : null;

  const selfTreatText =
    followUp.selfTreatments && followUp.selfTreatments.length > 0
      ? `${followUp.selfTreatments
          .map((id) => TREATMENT_LABEL[id] || id)
          .join('、')}${
          followUp.treatmentResponse
            ? `（反應：${RESPONSE_LABEL[followUp.treatmentResponse]}）`
            : ''
        }`
      : null;

  const ruleOutAnswers =
    primaryResult?.targetedRuleOutHistory?.flatMap((r) => r.answeredItems) || [];

  const plainTextCheatSheet = useMemo(() => {
    const lines: string[] = [];
    lines.push('【門診就醫病況整理單（看診小抄）】');
    lines.push(`生成時間：${generatedTime}`);
    lines.push(
      `基本資料：${contextProfile.ageGroup || ''}歲・${sexLabel}${
        bmiStr ? `・${bmiStr}` : ''
      }${pregnancyStr ? `・${pregnancyStr}` : ''}`
    );
    lines.push(
      `★ 過敏史：${allergyStr || '未填報'} ｜ ★ 固定/高風險用藥：${
        medsList.length > 0 ? medsList.join('、') : '未填報'
      }`
    );
    if (chronicList.length > 0) lines.push(`慢性病史：${chronicList.join('、')}`);
    if (habitParts.length > 0) lines.push(`生活習慣：${habitParts.join('、')}`);
    if (familyList.length > 0) lines.push(`家族病史：${familyList.join('、')}`);
    if (toccList.length > 0) lines.push(`近期 TOCC：${toccList.join('、')}`);

    lines.push('');
    lines.push('【主訴與生命徵象】');
    lines.push(
      `發作：${ONSET_LABEL[followUp.onsetPattern] || followUp.onsetPattern}｜持續：${
        followUp.durationLabelZh
      }｜VAS 疼痛/不適：${followUp.severityScore}/10`
    );
    if (onsetOrderText) {
      lines.push(
        `發作順序：${onsetOrderText}${
          followUp.hasSymptomMigration ? '（有明顯疼痛轉移）' : ''
        }`
      );
    }
    if (followUp.modifyingFactors.length > 0) {
      lines.push(
        `誘發/緩解因子：${followUp.modifyingFactors
          .map((f) => FACTOR_LABEL[f] || f)
          .join('、')}`
      );
    }
    if (vitalItems.length > 0) {
      lines.push(
        `客觀數值：${vitalItems
          .map((vi) => `${vi.label} ${vi.value}${vi.abnormal ? '*' : ''}`)
          .join('｜')}`
      );
    }
    if (selfTreatText) {
      lines.push(`就醫前自行處置：${selfTreatText}`);
    }

    if (regionRecords.length > 0) {
      lines.push('');
      lines.push('【局部解剖症狀】');
      regionRecords.forEach((r) => {
        const reg = BODY_REGION_MAP[r.regionId];
        const side = reg?.lateralityLabelZh ? `(${reg.lateralityLabelZh})` : '';
        const depth = DEPTH_LAYER_CONFIG[r.depthLayer]?.shortLabelZh || r.depthLayer;
        lines.push(
          `• ${r.regionNameZh}${side} [${depth}]：特徵(${
            r.specificSymptomLabelsZh.join('、') || '無'
          })；性質(${r.qualityLabelsZh.join('、') || '無'})`
        );
      });
    }

    if (groupedSystemic.length > 0) {
      lines.push('');
      lines.push('【全身性伴隨症狀】');
      groupedSystemic.forEach((g) => {
        lines.push(`• ${g.categoryNameZh}：${g.items.join('、')}`);
      });
    } else if (systemicSymptomIds.length > 0) {
      lines.push(
        `• 全身症狀：${systemicSymptomIds
          .map((id) => SYSTEMIC_SYMPTOM_MAP[id]?.labelZh || id)
          .join('、')}`
      );
    }

    if (dynamicAnswers.length > 0 || ruleOutAnswers.length > 0) {
      lines.push('');
      lines.push('【臨床追問重點回覆】');
      dynamicAnswers.forEach((a) => {
        lines.push(`• ${a.questionTextZh}：${a.selectedOptionLabelZh}`);
      });
      ruleOutAnswers.forEach((a) => {
        lines.push(`• ${a.questionTextZh}：${a.selectedLabelZh}`);
      });
    }

    if (includeAiHint && primaryResult?.topSuspectedDiseases?.length) {
      lines.push('');
      lines.push('【AI 鑑別方向參考（僅供醫師輔助參閱）】');
      primaryResult.topSuspectedDiseases.forEach((d, idx) => {
        lines.push(
          `${idx + 1}. ${d.diseaseNameZh} (${d.diseaseNameEn}) — 吻合度 ${d.clinicalMatchScorePct}%`
        );
      });
    }

    lines.push('');
    lines.push('※ 本表由病患於就醫前自行整理彙整，僅供門診問診輔助溝通使用。');
    return lines.join('\n');
  }, [
    generatedTime,
    contextProfile.ageGroup,
    sexLabel,
    bmiStr,
    pregnancyStr,
    allergyStr,
    medsList,
    chronicList,
    habitParts,
    familyList,
    toccList,
    followUp,
    onsetOrderText,
    vitalItems,
    selfTreatText,
    regionRecords,
    groupedSystemic,
    systemicSymptomIds,
    dynamicAnswers,
    ruleOutAnswers,
    includeAiHint,
    primaryResult,
  ]);

  if (!isOpen) return null;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(plainTextCheatSheet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore
    }
  };

  const handleDownloadStandaloneHtml = () => {
    const printableEl = document.getElementById('doctor-cheat-sheet-a4');
    const bodyInner = printableEl ? printableEl.innerHTML : `<pre>${escapeHtml(plainTextCheatSheet)}</pre>`;

    const standaloneHtml = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>門診就醫病況整理單（看診小抄）</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
    background: #ffffff;
    color: #000000;
    margin: 0;
    padding: 16px;
    font-size: 12px;
    line-height: 1.45;
  }
  .toolbar {
    display: flex; gap: 8px; justify-content: flex-end; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #cbd5e1;
  }
  .btn {
    padding: 8px 14px; border: 1px solid #000; background: #000; color: #fff; font-weight: 700; font-size: 12px; border-radius: 6px; cursor: pointer;
  }
  .sheet { max-width: 794px; margin: 0 auto; }
  .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  .page-break-before { page-break-before: always; break-before: page; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th, td { border: 1px solid #1e293b; padding: 5px 7px; text-align: left; vertical-align: top; font-size: 11px; }
  th { background: #f1f5f9; font-weight: 800; }
  .alert-box { border: 2px solid #000000; padding: 8px 10px; margin: 8px 0; background: #f8fafc; }
  .section-title { font-size: 12px; font-weight: 900; border-bottom: 1.5px solid #000; padding-bottom: 2px; margin: 10px 0 5px; }
  .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  img { max-width: 100%; max-height: 240px; object-fit: contain; border: 1px solid #94a3b8; }
  @media print {
    .toolbar { display: none !important; }
    body { padding: 0; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button class="btn" onclick="window.print()">列印 / 另存 A4 PDF</button>
  </div>
  <div class="sheet">${bodyInner}</div>
</body>
</html>`;

    const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `門診看診小抄_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[94vh] flex flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal 頂部控制列（列印時隱藏） */}
        <div className="no-print border-b border-slate-800 bg-slate-950/95 px-4 py-3 space-y-2.5 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-black text-white">
                看診小抄預覽（A4 白底黑字門診整理單）
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="關閉看診小抄預覽"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 客製化勾選開關 + 三大輸出按鈕 */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              {primaryResult?.topSuspectedDiseases?.length ? (
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeAiHint}
                    onChange={(e) => setIncludeAiHint(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800 accent-cyan-400"
                  />
                  <span>附帶本次 AI 鑑別方向參考</span>
                </label>
              ) : null}

              {attachments.length > 0 && (
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeAttachments}
                    onChange={(e) => setIncludeAttachments(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800 accent-cyan-400"
                  />
                  <span>附帶患部照片／檢驗單縮圖 ({attachments.length} 張)</span>
                </label>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-3 py-1.5 text-xs font-black transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>列印 / 另存 A4 PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadStandaloneHtml}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>下載獨立列印檔 (.html)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                )}
                <span>{copied ? '已複製文字' : '複製純文字版'}</span>
              </button>
            </div>
          </div>

          {isInAppWebView && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                偵測到 App 內建瀏覽器：若無法直接列印，建議改用 Chrome／Safari 開啟，或點擊「下載獨立列印檔 (.html)」。
              </span>
            </div>
          )}
        </div>

        {/* A4 白底純黑字預覽本體 */}
        <div className="flex-1 overflow-y-auto bg-slate-800/60 p-3 sm:p-5 print:p-0 print:bg-white">
          <div
            id="doctor-cheat-sheet-a4"
            className="print-cheat-sheet mx-auto max-w-[794px] bg-white text-black p-5 sm:p-7 rounded-lg shadow-xl print:shadow-none print:rounded-none print:p-0 text-[12px] leading-relaxed"
          >
            {/* 1. 表頭區 */}
            <div className="avoid-break border-b-2 border-black pb-2.5 mb-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h1 className="text-lg font-black tracking-tight text-black">
                  門診就醫病況整理單（看診小抄）
                </h1>
                <span className="text-[11px] font-semibold text-black">
                  彙整時間：{generatedTime}
                </span>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-black flex flex-wrap gap-x-5 gap-y-1">
                <span>姓名：__________________</span>
                <span>出生年月日：______________</span>
                <span>掛號科別：____________</span>
              </div>
            </div>

            {/* 2. 基本生理與高危警示方框（粗框置頂） */}
            <div className="avoid-break alert-box border-2 border-black bg-slate-50 p-2.5 mb-3 space-y-1">
              <div className="text-[11px] font-bold text-black">
                基本生理：{contextProfile.ageGroup || '未填'} 歲 ｜ 生理性別：{sexLabel}
                {bmiStr ? ` ｜ 體態：${bmiStr}` : ''}
                {pregnancyStr ? ` ｜ ${pregnancyStr}` : ''}
              </div>
              <div className="text-[11px] text-black">
                <span className="font-black bg-black text-white px-1 py-0.5 mr-1">
                  ★ 藥物／食物過敏史
                </span>
                <span className="font-bold">
                  {allergyStr || '未填報'}
                </span>
                <span className="mx-2">｜</span>
                <span className="font-black bg-black text-white px-1 py-0.5 mr-1">
                  ★ 目前固定／高風險用藥
                </span>
                <span className="font-bold">
                  {medsList.length > 0 ? medsList.join('、') : '未填報'}
                </span>
              </div>
              <div className="text-[11px] text-black flex flex-wrap gap-x-4 gap-y-0.5">
                {chronicList.length > 0 && (
                  <span>
                    <strong>重大慢性病：</strong>
                    {chronicList.join('、')}
                  </span>
                )}
                {habitParts.length > 0 && (
                  <span>
                    <strong>生活習慣：</strong>
                    {habitParts.join('、')}
                  </span>
                )}
                {familyList.length > 0 && (
                  <span>
                    <strong>家族病史：</strong>
                    {familyList.join('、')}
                  </span>
                )}
                {toccList.length > 0 && (
                  <span>
                    <strong>近期 TOCC：</strong>
                    {toccList.join('、')}
                  </span>
                )}
              </div>
            </div>

            {/* 3. 主訴摘要與客觀生命徵象 */}
            <div className="avoid-break mb-3">
              <div className="section-title text-xs font-black border-b border-black pb-0.5 mb-1.5">
                一、主訴病程與客觀生命徵象 (Chief Complaint &amp; Vitals)
              </div>
              <div className="text-[11px] space-y-1 text-black">
                <div>
                  <strong>發作模式：</strong>
                  {ONSET_LABEL[followUp.onsetPattern] || followUp.onsetPattern}
                  　｜　<strong>持續時間：</strong>
                  {followUp.durationLabelZh}
                  　｜　<strong>不適強度 (VAS)：</strong>
                  <strong>{followUp.severityScore} / 10 分</strong>
                </div>
                {onsetOrderText && (
                  <div>
                    <strong>發作先後順序：</strong>
                    {onsetOrderText}
                    {followUp.hasSymptomMigration ? '（有明顯疼痛位置轉移）' : ''}
                  </div>
                )}
                {followUp.modifyingFactors.length > 0 && (
                  <div>
                    <strong>誘發／緩解因子：</strong>
                    {followUp.modifyingFactors
                      .map((f) => FACTOR_LABEL[f] || f)
                      .join('、')}
                  </div>
                )}
                {vitalItems.length > 0 && (
                  <div>
                    <strong>客觀量測數值：</strong>
                    {vitalItems.map((vi, idx) => (
                      <span key={vi.label} className="mr-3">
                        {idx > 0 ? '' : ''}
                        {vi.label}{' '}
                        <span className={vi.abnormal ? 'font-black underline' : 'font-semibold'}>
                          {vi.value}
                          {vi.abnormal ? '*' : ''}
                        </span>
                      </span>
                    ))}
                    {vitalEval.abnormalSummaryListZh.length > 0 && (
                      <span className="text-[10px]">（* 標示異常）</span>
                    )}
                  </div>
                )}
                {selfTreatText && (
                  <div>
                    <strong>就醫前自行處置與反應：</strong>
                    {selfTreatText}
                  </div>
                )}
              </div>
            </div>

            {/* 4. 局部解剖症狀表格 */}
            {regionRecords.length > 0 && (
              <div className="avoid-break mb-3">
                <div className="section-title text-xs font-black border-b border-black pb-0.5 mb-1.5">
                  二、局部解剖症狀紀錄
                </div>
                <table className="w-full border-collapse border border-black text-[11px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-black px-2 py-1 text-left font-black w-[22%]">
                        解剖部位（側別）
                      </th>
                      <th className="border border-black px-2 py-1 text-left font-black w-[14%]">
                        病灶深度
                      </th>
                      <th className="border border-black px-2 py-1 text-left font-black w-[38%]">
                        專屬臨床特徵
                      </th>
                      <th className="border border-black px-2 py-1 text-left font-black w-[26%]">
                        不適與疼痛性質
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionRecords.map((r) => {
                      const reg = BODY_REGION_MAP[r.regionId];
                      const side = reg?.lateralityLabelZh
                        ? `（${reg.lateralityLabelZh}）`
                        : '';
                      const depth =
                        DEPTH_LAYER_CONFIG[r.depthLayer]?.shortLabelZh ||
                        r.depthLayer;
                      return (
                        <tr key={r.regionId}>
                          <td className="border border-black px-2 py-1 font-bold align-top">
                            {r.regionNameZh}
                            <span className="text-[10px] font-normal">
                              {side}
                            </span>
                          </td>
                          <td className="border border-black px-2 py-1 align-top">
                            {depth}
                          </td>
                          <td className="border border-black px-2 py-1 align-top">
                            {r.specificSymptomLabelsZh.length > 0
                              ? r.specificSymptomLabelsZh.join('；')
                              : '—'}
                          </td>
                          <td className="border border-black px-2 py-1 align-top">
                            {r.qualityLabelsZh.length > 0
                              ? r.qualityLabelsZh.join('、')
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 5. 全身性伴隨症狀 */}
            {groupedSystemic.length > 0 && (
              <div className="avoid-break mb-3">
                <div className="section-title text-xs font-black border-b border-black pb-0.5 mb-1.5">
                  三、全身性伴隨症狀
                </div>
                <ul className="space-y-0.5 text-[11px]">
                  {groupedSystemic.map((g) => (
                    <li key={g.categoryNameZh}>
                      <strong>{g.categoryNameZh}：</strong>
                      {g.items.join('、')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 6. 臨床追問重點回覆 */}
            {(dynamicAnswers.length > 0 || ruleOutAnswers.length > 0) && (
              <div className="avoid-break mb-3">
                <div className="section-title text-xs font-black border-b border-black pb-0.5 mb-1.5">
                  四、臨床追問重點回覆（含否定排除特徵）
                </div>
                <ul className="space-y-0.5 text-[11px]">
                  {dynamicAnswers.map((a, i) => (
                    <li key={`dyn_${i}`}>
                      • {a.questionTextZh}：<strong>{a.selectedOptionLabelZh}</strong>
                    </li>
                  ))}
                  {ruleOutAnswers.map((a, i) => (
                    <li key={`ro_${i}`}>
                      • {a.questionTextZh}：<strong>{a.selectedLabelZh}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 選填：AI 鑑別方向參考（預設關閉） */}
            {includeAiHint && primaryResult?.topSuspectedDiseases?.length ? (
              <div className="avoid-break mb-3 border border-black p-2 bg-slate-50">
                <div className="text-[11px] font-black mb-1">
                  參考：系統初步鑑別方向（非正式診斷，僅供輔助）
                </div>
                <ol className="list-decimal list-inside text-[11px] space-y-0.5">
                  {primaryResult.topSuspectedDiseases.map((d) => (
                    <li key={d.diseaseId}>
                      <strong>{d.diseaseNameZh}</strong>（{d.diseaseNameEn}）— 吻合度{' '}
                      {d.clinicalMatchScorePct}%
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {/* 7. 頁尾免責小字 */}
            <div className="mt-4 pt-2 border-t border-black text-[10px] text-black flex justify-between">
              <span>本表由病患於就醫前自行整理彙整，僅供門診問診輔助溝通使用。</span>
              <span>第 1 頁</span>
            </div>

            {/* 選填：患部照片／檢驗單縮圖（獨立於文末或第 2 頁，避免擠亂第 1 頁） */}
            {includeAttachments && attachments.length > 0 && (
              <div className="page-break-before mt-6 pt-4 border-t-2 border-dashed border-black">
                <div className="section-title text-xs font-black border-b border-black pb-0.5 mb-2">
                  附件：患部外觀照片／檢驗單據（共 {attachments.length} 張）
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {attachments.map((att, idx) => (
                    <div
                      key={att.id}
                      className="avoid-break border border-black p-2 text-[10px]"
                    >
                      <img
                        src={att.previewDataUrl}
                        alt={att.fileName}
                        className="w-full max-h-56 object-contain mb-1"
                      />
                      <div className="font-bold">
                        圖 {idx + 1}：{att.fileName}（{att.width}×{att.height}）
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
