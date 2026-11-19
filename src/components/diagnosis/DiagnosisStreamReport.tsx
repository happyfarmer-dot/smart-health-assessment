'use client';

import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileSearch,
  FlaskConical,
  Gauge,
  GitBranch,
  HelpCircle,
  KeyRound,
  Layers,
  Loader2,
  Microscope,
  Pill,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  XCircle,
} from 'lucide-react';
import {
  DifferentialAndAnalysisResult,
  EvidenceLevelTag,
  PrimaryDiagnosisResult,
  PubMedResearchResult,
  SafetyCheckResult,
} from '@/types/cdss';

interface DiagnosisStreamReportProps {
  isStreaming: boolean;
  safetyResult: SafetyCheckResult | null;
  primaryResult: PrimaryDiagnosisResult | null;
  differentialResult: DifferentialAndAnalysisResult | null;
  pubmedResult: PubMedResearchResult | null;
  optionalGeminiKey: string;
  onChangeGeminiKey: (key: string) => void;
}

const EVIDENCE_BADGE_STYLES: Record<EvidenceLevelTag, string> = {
  'Practice Guideline':
    'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  'Meta-Analysis': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
  'Systematic Review': 'bg-teal-500/15 text-teal-300 border-teal-500/40',
  RCT: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
  Observational: 'bg-slate-700/60 text-slate-300 border-slate-600',
};

export const DiagnosisStreamReport: React.FC<DiagnosisStreamReportProps> = ({
  isStreaming,
  safetyResult,
  primaryResult,
  differentialResult,
  pubmedResult,
  optionalGeminiKey,
  onChangeGeminiKey,
}) => {
  const [isSecondaryExpanded, setIsSecondaryExpanded] = useState(false);
  const [isPubMedExpanded, setIsPubMedExpanded] = useState(true);
  const [showApiKeyConfig, setShowApiKeyConfig] = useState(false);

  const hasAnyReportData =
    Boolean(safetyResult) ||
    Boolean(primaryResult) ||
    Boolean(differentialResult) ||
    Boolean(pubmedResult);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 text-slate-100 shadow-xl overflow-hidden">
      {/* 頂部會診報告標題與選填 Gemini API Key 擴充設定 */}
      <div className="border-b border-slate-800 bg-slate-950/80 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Microscope className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  多專科會診 (MDT) 臨床疾病推論與鑑別診斷報告
                </h2>
                {isStreaming && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    SSE 串流會診推論中
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                現代實證西醫鑑別診斷 · 含診斷信心度評估、藥源性排查、支持與不支持證據、白話病理機轉與確診檢查建議
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowApiKeyConfig((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
              optionalGeminiKey.trim()
                ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>
              {optionalGeminiKey.trim()
                ? '已啟用 Gemini AI 深度白話潤飾'
                : '選填 Gemini API Key'}
            </span>
          </button>
        </div>

        {/* 選填 Gemini API Key 摺疊列 */}
        {showApiKeyConfig && (
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-cyan-300">
                雙軌確定性西醫引擎 ＋ 選填 Gemini 2.5 Flash：
              </span>{' '}
              系統內建完整西醫鑑別知識庫與真實 NCBI PubMed 檢索，無須金鑰即可完整執行；若填入您個人的 Gemini API Key（僅存於瀏覽器記憶體），可額外強化白話病生理段落。
            </div>
            <input
              type="password"
              value={optionalGeminiKey}
              onChange={(e) => onChangeGeminiKey(e.target.value)}
              placeholder="貼上 AIza... (選填，留空即使用內建引擎)"
              className="w-full sm:w-72 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        )}

        {/* 4 階段 SSE 進度指示器 */}
        {hasAnyReportData && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                label: '1. 靜默危急值與紅旗審查',
                done: Boolean(safetyResult),
              },
              {
                label: '2. 具體疾病鑑別與藥源排查',
                done: Boolean(primaryResult),
              },
              {
                label: '3. 跨科轉移痛與次要排查',
                done: Boolean(differentialResult),
              },
              {
                label: '4. PubMed 人類實證文獻',
                done: Boolean(pubmedResult),
              },
            ].map((stage, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium ${
                  stage.done
                    ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-200'
                    : 'border-slate-800 bg-slate-950/40 text-slate-500'
                }`}
              >
                {stage.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                ) : (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-600 shrink-0" />
                )}
                <span className="truncate">{stage.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 尚未執行評估時的專業空狀態提示（嚴禁任何 Demo 範例按鈕） */}
      {!hasAnyReportData && !isStreaming && (
        <div className="p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700 text-cyan-400">
            <Stethoscope className="h-6 w-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-200">
            準備進行臨床疾病推論與多專科鑑別診斷
          </h3>
          <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
            請於上方 3D 人體模型（或 2D 列表）點選不適部位、標記深度層級與疼痛性質，並勾選伴隨之全身性症狀後，點擊「開始臨床疾病鑑別診斷」。系統將依序串流輸出具體懷疑病名、支持與不支持證據、白話病理機轉、確診檢查項目與真實 PubMed 實證文獻。
          </p>
        </div>
      )}

      {/* 串流報告主體 */}
      {hasAnyReportData && (
        <div className="p-5 space-y-6">
          {/* ==================== Event 1: safety_check (靜默背景攔截，僅在觸發時顯示頂部紅色警示卡) ==================== */}
          {safetyResult && safetyResult.hasRedFlagAlert && (
            <div className="rounded-2xl border-2 border-rose-500 bg-rose-950/50 p-5 shadow-lg shadow-rose-950/50 space-y-3">
              <div className="flex items-center gap-2.5 text-rose-300">
                <AlertOctagon className="h-6 w-6 text-rose-400 shrink-0" />
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-rose-200">
                    緊急臨床危急值／紅旗徵象攔截警示 (Immediate Emergency Red-Flag Alert)
                  </h3>
                  <p className="text-xs text-rose-300/90">
                    系統於背景安全審查偵測到需優先排除之急性危及生命徵象，請勿等待一般門診：
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {safetyResult.alerts.map((alert) => (
                  <div
                    key={alert.ruleId}
                    className="rounded-xl border border-rose-500/40 bg-slate-950/80 p-3.5 space-y-1.5"
                  >
                    <div className="text-xs sm:text-sm font-bold text-rose-300">
                      需緊急排除之急症：{alert.suspectedEmergencyConditionZh}
                    </div>
                    <div className="text-xs text-slate-200">
                      <span className="font-semibold text-rose-400">觸發臨床依據：</span>
                      {alert.triggeringEvidenceZh}
                    </div>
                    <div className="text-xs font-semibold text-amber-300 pt-0.5">
                      處置建議：{alert.immediateActionZh}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {safetyResult && !safetyResult.hasRedFlagAlert && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{safetyResult.silentPassSummaryZh}</span>
              </div>
              {safetyResult.vitalSignsAbnormalSummaryZh.length > 0 && (
                <div className="flex items-center gap-1.5 text-amber-300">
                  <Activity className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    已將 {safetyResult.vitalSignsAbnormalSummaryZh.length} 項異常生理數值納入鑑別權重
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ==================== Event 2: primary_diagnosis ==================== */}
          {primaryResult && (
            <div className="space-y-6">
              {/* 2-A. 診斷信心度與資訊完整度評估 (Diagnostic Confidence & Missing Info) */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                      臨床診斷信心度與特徵特異度評估 (Diagnostic Confidence Assessment)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                        primaryResult.diagnosticConfidence.confidenceLevel.startsWith('高')
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                          : primaryResult.diagnosticConfidence.confidenceLevel.startsWith('中')
                          ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                          : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {primaryResult.diagnosticConfidence.confidenceLevel}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      特異度 {primaryResult.diagnosticConfidence.specificityScorePct}%
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {primaryResult.diagnosticConfidence.assessmentRationaleZh}
                </p>

                {primaryResult.diagnosticConfidence.missingInformationToNarrowDownZh.length >
                  0 && (
                  <div className="rounded-lg border border-slate-800/90 bg-slate-900/70 p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300">
                      <HelpCircle className="h-3.5 w-3.5" />
                      若要進一步收斂鑑別範圍，看診時可補充或由醫師確認之資訊：
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                      {primaryResult.diagnosticConfidence.missingInformationToNarrowDownZh.map(
                        (info, idx) => (
                          <li key={idx}>{info}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* 2-B. 條件式藥源性／保健品副作用警示卡 (Iatrogenic Drug Cause Alert) */}
              {primaryResult.iatrogenicAlerts.length > 0 && (
                <div className="rounded-2xl border border-amber-500/50 bg-amber-950/25 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300">
                    <Pill className="h-5 w-5 text-amber-400 shrink-0" />
                    <div>
                      <h3 className="text-sm font-bold text-amber-200">
                        藥源性症狀與常規用藥／保健品交互作用排查提示 (Iatrogenic Cause Alert)
                      </h3>
                      <p className="text-[11px] text-amber-300/80">
                        系統比對您於「基礎生理情境卡」勾選的常規用藥與目前症狀，發現以下高度相關之藥理機轉：
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {primaryResult.iatrogenicAlerts.map((alert) => (
                      <div
                        key={alert.medicationId}
                        className="rounded-xl border border-amber-500/30 bg-slate-950/80 p-3.5 space-y-1.5 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-amber-300">
                            關聯用藥／保健品：{alert.medicationNameZh}
                          </span>
                          <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] text-amber-200">
                            吻合症狀：{alert.matchingUserSymptomsZh.join('、')}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          <span className="font-semibold text-slate-200">藥理作用機轉：</span>
                          {alert.suspectedSideEffectMechanismZh}
                        </p>
                        <p className="text-cyan-300 font-medium pt-0.5">
                          <span className="font-semibold">臨床建議：</span>
                          {alert.clinicalAdviceZh}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2-C. 最有可能之具體疾病鑑別清單 (Top 2-3 Suspected Diseases) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-cyan-400" />
                    最有可能之具體疾病鑑別清單 (Primary Differential Diagnoses)
                  </h3>
                  <span className="text-xs text-slate-400">
                    依臨床症狀吻合度與深度層級排序
                  </span>
                </div>

                <div className="space-y-5">
                  {primaryResult.topSuspectedDiseases.map((dx, index) => (
                    <div
                      key={dx.diseaseId}
                      className="rounded-2xl border border-slate-700/90 bg-slate-950/85 p-5 shadow-md space-y-4"
                    >
                      {/* 疾病標題、中英文對照與可能性分級 */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800 pb-3.5">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-xs font-extrabold text-cyan-300">
                              #{index + 1}
                            </span>
                            <h4 className="text-base sm:text-lg font-extrabold text-slate-100">
                              {dx.diseaseNameZh}
                            </h4>
                          </div>
                          <div className="text-xs font-mono text-cyan-400/90 pl-8">
                            {dx.diseaseNameEn}
                          </div>
                        </div>

                        <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5 shrink-0">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${
                              dx.probabilityLevel.startsWith('高度')
                                ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                                : 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                            }`}
                          >
                            {dx.probabilityLevel} · 臨床吻合度 {dx.clinicalMatchScorePct}%
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {dx.involvedSpecialtiesTw.map((sp) => (
                              <span
                                key={sp}
                                className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300"
                              >
                                {sp}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 支持證據 vs 不支持／待確認證據 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-3.5 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            支持此疾病之臨床證據 (Supporting Evidence)
                          </div>
                          <ul className="space-y-1.5 text-xs text-slate-200">
                            {dx.clinicalReasoning.supportingEvidenceZh.map((ev, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">•</span>
                                <span>{ev}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-3.5 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                            <XCircle className="h-4 w-4 text-amber-400 shrink-0" />
                            不支持或尚待確認之鑑別點 (Lacking / Rule-out Factors)
                          </div>
                          <ul className="space-y-1.5 text-xs text-slate-300">
                            {dx.clinicalReasoning.unsupportingOrLackingEvidenceZh.map(
                              (ev, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-amber-400 font-bold">•</span>
                                  <span>{ev}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* 白話病理機轉說明 */}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 space-y-1.5">
                        <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5" />
                          白話西醫病理機轉 (Pathophysiology Explanation)
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {dx.pathophysiologyPlainZh}
                        </p>
                      </div>

                      {/* 醫學確診與排除關鍵檢查項目 */}
                      <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/15 p-3.5 space-y-2.5">
                        <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                          <FlaskConical className="h-4 w-4 text-cyan-400" />
                          臨床上用來確診或排除該疾病的關鍵檢查項目 (Confirmatory Diagnostic Tests)
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {dx.confirmatoryDiagnosticTests.map((test, tIdx) => (
                            <div
                              key={tIdx}
                              className="rounded-lg border border-slate-800 bg-slate-950/80 p-2.5 text-xs"
                            >
                              <div className="font-bold text-slate-100">
                                {tIdx + 1}. {test.testNameZh}
                              </div>
                              <div className="text-slate-300 mt-0.5">
                                <span className="text-cyan-400 font-medium">檢查目的與預期發現：</span>
                                {test.expectedFindingOrPurposeZh}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== Event 3: differential_and_analysis ==================== */}
          {differentialResult && (
            <div className="space-y-5 pt-2">
              {/* 3-A. 多專科跨科會診：牽涉痛機轉與生理權重綜合解析 */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                      MDT 跨科別會診：牽涉痛神經傳導與生理背景權重解析
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {differentialResult.mdtCrossSpecialtyAnalysis.participatingSpecialtiesTw.map(
                      (sp) => (
                        <span
                          key={sp}
                          className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300"
                        >
                          {sp}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-200 leading-relaxed">
                  <p className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                    <span className="font-bold text-cyan-300">
                      跨解剖區牽涉痛與全身症狀關聯：
                    </span>
                    {differentialResult.mdtCrossSpecialtyAnalysis.referredPainAndSystemicLinkZh}
                  </p>
                  <p className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                    <span className="font-bold text-emerald-300">
                      基礎生理背景與客觀生命徵象權重分析：
                    </span>
                    {differentialResult.mdtCrossSpecialtyAnalysis.vitalsAndContextWeightAnalysisZh}
                  </p>
                </div>
              </div>

              {/* 3-B. 反焦慮設計：次要鑑別診斷與需排除之低機率項目（預設收合） */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsSecondaryExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-900/70 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-slate-400" />
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-200">
                        次要鑑別診斷與需排除之其他可能性（共{' '}
                        {differentialResult.secondaryDifferentialsCollapsed.length} 項，預設收合以降低資訊焦慮）
                      </span>
                      <p className="text-[11px] text-slate-400">
                        包含發生率較低但臨床醫師在完整鑑別時會一併列入排除清單 (Rule-out List) 的疾病
                      </p>
                    </div>
                  </div>
                  {isSecondaryExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isSecondaryExpanded && (
                  <div className="border-t border-slate-800 p-4 space-y-2.5">
                    {differentialResult.secondaryDifferentialsCollapsed.map((sec, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-xs space-y-1"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-slate-100">
                            {sec.diseaseNameZh}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {sec.diseaseNameEn}
                          </span>
                        </div>
                        <p className="text-slate-300">
                          <span className="font-semibold text-slate-200">為何列入排查：</span>
                          {sec.whyConsiderToRuleOutZh}
                        </p>
                        <p className="text-cyan-300">
                          <span className="font-semibold">關鍵排除檢查：</span>
                          {sec.keyRuleOutTestZh}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3-C. 輔助就醫科別與居家安全照護須知 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    建議優先看診科別與就醫前注意事項
                  </div>
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {differentialResult.supplementaryGuidance.recommendedDepartmentsTw.map(
                      (dept) => (
                        <span
                          key={dept}
                          className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-300"
                        >
                          建議掛號：{dept}
                        </span>
                      )
                    )}
                  </div>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {differentialResult.supplementaryGuidance.nonPharmacologicalReliefZh.map(
                      (tip, i) => (
                        <li key={i}>• {tip}</li>
                      )
                    )}
                  </ul>
                </div>

                <div className="rounded-xl border border-rose-500/30 bg-rose-950/15 p-4 space-y-2">
                  <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                    病程惡化警訊（若新出現以下情況請立即急診）
                  </div>
                  <ul className="space-y-1 text-xs text-slate-200">
                    {differentialResult.supplementaryGuidance.escalationRedFlagsZh.map(
                      (flag, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>{flag}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ==================== Event 4: pubmed_research (Phase 4 零幻覺 PubMed 實證文獻) ==================== */}
          {pubmedResult && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/75 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsPubMedExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-900/80 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="h-4 w-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-100">
                        PubMed 臨床實證醫學文獻佐證（NCBI E-utilities 即時檢索 · 零幻覺保證）
                      </span>
                      <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                        Locked: AND Humans[MeSH]
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      所有 PMID、標題、年份與期刊均直接取自美國國家醫學圖書館 API，嚴禁 AI 憑記憶生成
                    </p>
                  </div>
                </div>
                {isPubMedExpanded ? (
                  <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isPubMedExpanded && (
                <div className="border-t border-slate-800 p-4 space-y-3">
                  {/* 顯示實際執行的 E-utilities Query */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-2.5 text-[11px] font-mono text-slate-400 break-all">
                    <span className="text-cyan-400 font-semibold">Executed NCBI Query: </span>
                    {pubmedResult.executedQuery}
                  </div>

                  {pubmedResult.articles.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {pubmedResult.articles.map((art) => (
                        <div
                          key={art.pmid}
                          className="rounded-xl border border-slate-800 bg-slate-900/75 p-3.5 space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                                  EVIDENCE_BADGE_STYLES[art.evidenceLevel]
                                }`}
                              >
                                {art.evidenceLevel}
                              </span>
                              <span className="text-xs font-mono text-cyan-400">
                                PMID: {art.pmid}
                              </span>
                              <span className="text-xs text-slate-400">
                                {art.journalName} ({art.publicationYear})
                              </span>
                            </div>

                            <a
                              href={art.pubmedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                            >
                              <span>PubMed 原文</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>

                          <h5 className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
                            {art.title}
                          </h5>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {art.plainClinicalTakeawayZh}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-300">
                      <FileSearch className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        {pubmedResult.fallbackNoticeZh ||
                          '目前等待 PubMed API 回應或處於離線狀態；為遵守零幻覺原則，系統絕不虛構任何文獻。'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 底部醫療免責聲明 */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/90 px-4 py-3 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-bold text-slate-300">
              臨床決策支援系統 (CDSS) 醫療聲明：
            </span>
            本系統採用現代實證西醫鑑別診斷邏輯與 NCBI PubMed 真實人類文獻檢索，旨在提供具備病理機轉與檢查方向之「就醫前多專科會診參考報告」，不能取代親自就診時由醫師進行之理學檢查（如聽診、觸診）、抽血檢驗與醫學影像診斷。
          </div>
        </div>
      )}
    </div>
  );
};
