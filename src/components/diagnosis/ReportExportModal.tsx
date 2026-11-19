'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileCode,
  FileText,
  Printer,
  X,
} from 'lucide-react';
import {
  ClinicalFollowUpParams,
  DifferentialAndAnalysisResult,
  PatientContextProfile,
  PrimaryDiagnosisResult,
  PubMedResearchResult,
  SafetyCheckResult,
  SelectedRegionClinicalRecord,
} from '@/types/cdss';
import { SYSTEMIC_SYMPTOM_MAP } from '@/data/systemicSymptomsCatalog';
import { DEPTH_LAYER_CONFIG } from '@/data/discomfortQualities';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessedAt: string;
  contextProfile: PatientContextProfile;
  regionRecords: SelectedRegionClinicalRecord[];
  systemicSymptomIds: string[];
  followUp: ClinicalFollowUpParams;
  safetyResult: SafetyCheckResult | null;
  primaryResult: PrimaryDiagnosisResult | null;
  differentialResult: DifferentialAndAnalysisResult | null;
  pubmedResult: PubMedResearchResult | null;
}

export function ReportExportModal({
  isOpen,
  onClose,
  assessedAt,
  contextProfile,
  regionRecords,
  systemicSymptomIds,
  followUp,
  safetyResult,
  primaryResult,
  differentialResult,
  pubmedResult,
}: ReportExportModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const plainTextReport = useMemo(() => {
    const lines: string[] = [];
    lines.push('============================================================');
    lines.push('3D 互動式智慧醫療疾病判斷系統 — 多專科臨床評估報告書');
    lines.push('============================================================');
    lines.push(`評估時間：${assessedAt}`);
    lines.push(
      `生理情境：${contextProfile.biologicalSex === 'female' ? '生理女性' : '生理男性'}｜年齡層 ${contextProfile.ageGroup}`
    );
    if (contextProfile.heightCm && contextProfile.weightKg) {
      const bmi = (
        contextProfile.weightKg / Math.pow(contextProfile.heightCm / 100, 2)
      ).toFixed(1);
      lines.push(
        `身高體重：${contextProfile.heightCm} cm / ${contextProfile.weightKg} kg (BMI ${bmi})`
      );
    }
    if (contextProfile.chronicConditions.length > 0) {
      lines.push(`慢性病史：${contextProfile.chronicConditions.join('、')}`);
    }
    if (contextProfile.highRiskMedications.length > 0) {
      lines.push(`目前高風險用藥：${contextProfile.highRiskMedications.join('、')}`);
    }
    if (contextProfile.drugAndFoodAllergies) {
      lines.push(`過敏史：${contextProfile.drugAndFoodAllergies}`);
    }

    lines.push('');
    lines.push('【一、主訴部位、深度與客觀生命徵象】');
    lines.push(
      `病程：${followUp.durationLabelZh}｜疼痛/不適強度 VAS ${followUp.severityScore}/10`
    );
    const v = followUp.vitals || {};
    const vitalParts: string[] = [];
    if (v.temperatureC) vitalParts.push(`體溫 ${v.temperatureC}°C`);
    if (v.systolicBp && v.diastolicBp) {
      vitalParts.push(`血壓 ${v.systolicBp}/${v.diastolicBp} mmHg`);
    }
    if (v.heartRateBpm) vitalParts.push(`心率 ${v.heartRateBpm} bpm`);
    if (v.spo2Pct) vitalParts.push(`血氧 ${v.spo2Pct}%`);
    if (v.bloodGlucoseMgDl) vitalParts.push(`血糖 ${v.bloodGlucoseMgDl} mg/dL`);
    if (vitalParts.length > 0) {
      lines.push(`生命徵象：${vitalParts.join('、')}`);
    }

    regionRecords.forEach((r) => {
      const depthLbl = DEPTH_LAYER_CONFIG[r.depthLayer]?.shortLabelZh || r.depthLayer;
      const quals = r.qualityLabelsZh.length > 0 ? r.qualityLabelsZh.join('、') : '無特定';
      const specs =
        r.specificSymptomLabelsZh.length > 0
          ? r.specificSymptomLabelsZh.join('、')
          : '無';
      lines.push(`• ${r.regionNameZh} [${depthLbl}]｜感受：${quals}｜專屬徵象：${specs}`);
    });
    if (systemicSymptomIds.length > 0) {
      lines.push(
        `• 全身性症狀：${systemicSymptomIds
          .map((id) => SYSTEMIC_SYMPTOM_MAP[id]?.labelZh || id)
          .join('、')}`
      );
    }

    if (safetyResult) {
      lines.push('');
      lines.push('【二、臨床急迫度與用藥安全分流】');
      if (safetyResult.hasRedFlagAlert && safetyResult.alerts.length > 0) {
        safetyResult.alerts.forEach((al) => {
          lines.push(`! 警訊：${al.suspectedEmergencyConditionZh} — ${al.immediateActionZh}`);
        });
      } else {
        lines.push(`安全檢核：${safetyResult.silentPassSummaryZh}`);
      }
      if (safetyResult.vitalSignsAbnormalSummaryZh.length > 0) {
        lines.push(`生命徵象判讀：${safetyResult.vitalSignsAbnormalSummaryZh.join('；')}`);
      }
    }

    if (primaryResult?.iatrogenicAlerts?.length) {
      lines.push('');
      lines.push('【藥源性副作用排查】');
      primaryResult.iatrogenicAlerts.forEach((ia) => {
        lines.push(`! 用藥關聯 (${ia.medicationNameZh})：${ia.clinicalAdviceZh}`);
      });
    }

    if (primaryResult) {
      lines.push('');
      lines.push('【三、最有可能之具體疾病鑑別清單】');
      primaryResult.topSuspectedDiseases.forEach((dx, idx) => {
        lines.push(
          `#${idx + 1} ${dx.diseaseNameZh} (${dx.diseaseNameEn}) — ${dx.probabilityLevel}（吻合度 ${dx.clinicalMatchScorePct}%）`
        );
        lines.push(`   建議專科：${dx.involvedSpecialtiesTw.join('、')}`);
        lines.push(
          `   支持證據：${dx.clinicalReasoning.supportingEvidenceZh.join('；')}`
        );
        lines.push(
          `   待排除/不支持點：${dx.clinicalReasoning.unsupportingOrLackingEvidenceZh.join('；')}`
        );
        lines.push(`   病理機轉：${dx.pathophysiologyPlainZh}`);
        lines.push(
          `   建議確診檢查：${dx.confirmatoryDiagnosticTests
            .map((t) => `${t.testNameZh}（${t.expectedFindingOrPurposeZh}）`)
            .join('；')}`
        );
      });
    }

    if (differentialResult) {
      lines.push('');
      lines.push('【四、建議看診科別與病程惡化警訊】');
      lines.push(
        `優先掛號科別：${differentialResult.supplementaryGuidance.recommendedDepartmentsTw.join('、')}`
      );
      lines.push(
        `急診警訊：${differentialResult.supplementaryGuidance.escalationRedFlagsZh.join('；')}`
      );
    }

    if (pubmedResult && pubmedResult.articles.length > 0) {
      lines.push('');
      lines.push('【五、PubMed 實證文獻參考索引】');
      pubmedResult.articles.forEach((art, idx) => {
        lines.push(
          `${idx + 1}. [${art.evidenceLevel}] ${art.title} (${art.journalName}, ${art.publicationYear}) PMID: ${art.pmid}`
        );
      });
    }

    lines.push('');
    lines.push(
      '※ 本報告為現代實證西醫臨床決策支援系統 (CDSS) 就醫前參考摘要，不能取代醫師親自理學檢查與正式診斷。'
    );
    return lines.join('\n');
  }, [
    assessedAt,
    contextProfile,
    regionRecords,
    systemicSymptomIds,
    followUp,
    safetyResult,
    primaryResult,
    differentialResult,
    pubmedResult,
  ]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainTextReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback textarea copy
      const ta = document.createElement('textarea');
      ta.value = plainTextReport;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([plainTextReport], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical-assessment-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtml = () => {
    const escaped = plainTextReport
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const htmlDoc = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <title>臨床評估報告書 - ${assessedAt}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif; max-width: 820px; margin: 32px auto; padding: 0 20px; color: #0f172a; line-height: 1.65; }
    h1 { font-size: 20px; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
    pre { white-space: pre-wrap; font-family: inherit; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; font-size: 13px; }
  </style>
</head>
<body>
  <h1>3D 互動式智慧醫療疾病判斷系統 — 臨床評估報告書</h1>
  <pre>${escaped}</pre>
</body>
</html>`;
    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical-assessment-report-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    onClose();
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 no-print"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                一鍵生成臨床評估報告書
              </h3>
              <p className="text-[11px] text-slate-400">
                可列印白底黑字 PDF、下載檔案或複製純文字摘要供就醫出示
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            aria-label="關閉報告匯出視窗"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 三種即時輸出方式按鈕列 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-4 border-b border-slate-800 bg-slate-950/40">
          <button
            type="button"
            onClick={handlePrintPdf}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs py-2.5 px-3 shadow-md transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>列印／另存為 PDF</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs py-2.5 px-2.5 transition-colors cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>下載 .html</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs py-2.5 px-2.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>下載 .txt</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center justify-center gap-2 rounded-xl border font-bold text-xs py-2.5 px-3 transition-colors cursor-pointer ${
              copied
                ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>已複製純文字摘要</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-cyan-400" />
                <span>一鍵複製純文字摘要</span>
              </>
            )}
          </button>
        </div>

        {/* 摘要預覽區 */}
        <div className="flex-1 overflow-y-auto p-4">
          <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200 leading-relaxed bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            {plainTextReport}
          </pre>
        </div>
      </div>
    </div>
  );
}
