'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Hospital,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  BookOpen,
  ExternalLink,
  HeartHandshake,
  AlertTriangle,
  Sparkles,
  BookmarkPlus,
  Loader2,
  PhoneCall,
} from 'lucide-react';
import {
  ClinicalAnalysisResult,
  PubMedEvidenceResult,
  RedFlagEvaluationResult,
  TriageAndSpecialtyResult,
} from '@/types/medical';

interface StreamingReportViewProps {
  isStreaming: boolean;
  currentStage: number;
  redFlag: RedFlagEvaluationResult | null;
  triage: TriageAndSpecialtyResult | null;
  clinical: ClinicalAnalysisResult | null;
  pubmed: PubMedEvidenceResult | null;
  onSaveToTimeline?: (userNote: string) => void;
  savedToTimelineSuccess?: boolean;
}

export function StreamingReportView({
  isStreaming,
  currentStage,
  redFlag,
  triage,
  clinical,
  pubmed,
  onSaveToTimeline,
  savedToTimelineSuccess,
}: StreamingReportViewProps) {
  // 反焦慮設計鐵則：少見但需鑑別的可能性預設收合；PubMed 前瞻研究預設收合
  const [isDifferentialExpanded, setIsDifferentialExpanded] = useState(false);
  const [isPubMedExpanded, setIsPubMedExpanded] = useState(false);
  const [copiedCheatSheet, setCopiedCheatSheet] = useState(false);
  const [timelineNote, setTimelineNote] = useState('');

  if (currentStage === 0 && !isStreaming) return null;

  const handleCopyCheatSheet = () => {
    if (!clinical?.doctorCheatSheet.summaryText100Words) return;
    navigator.clipboard.writeText(
      clinical.doctorCheatSheet.summaryText100Words
    );
    setCopiedCheatSheet(true);
    setTimeout(() => setCopiedCheatSheet(false), 2500);
  };

  return (
    <section
      id="assessment-report-section"
      className="bg-white border-2 border-sky-600/30 rounded-3xl p-4 sm:p-6 shadow-xl space-y-6 transition-all"
    >
      {/* 頂部串流進度條與醫療邊界聲明 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold uppercase tracking-wider bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full">
              模組 F：串流分階段臨床評估報告
            </span>
            {isStreaming && (
              <span className="text-xs font-bold text-sky-600 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                正在漸進渲染階段 {currentStage} / 4...
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            實證西醫多專科導引與反焦慮分層報告
          </h2>
        </div>

        {/* 4 階段進度指示燈 */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold">
          {[
            { s: 1, label: '1.紅旗篩檢' },
            { s: 2, label: '2.科別分流' },
            { s: 3, label: '3.反焦慮解析' },
            { s: 4, label: '4.PubMed實證' },
          ].map((st) => (
            <span
              key={st.s}
              className={`px-2.5 py-1 rounded-lg border transition-all ${
                currentStage >= st.s
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              {st.label}
            </span>
          ))}
        </div>
      </div>

      {/* ==================== 階段 1 (第 1 秒內)：確定性急症安全檢查結果 ==================== */}
      {redFlag && (
        <div
          className={`rounded-2xl p-4 sm:p-5 border-2 transition-all ${
            redFlag.isRedFlagTriggered
              ? 'bg-rose-950 text-white border-rose-500 shadow-lg'
              : 'bg-emerald-50/90 text-emerald-950 border-emerald-300'
          }`}
        >
          <div className="flex items-start gap-3.5">
            {redFlag.isRedFlagTriggered ? (
              <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span
                  className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    redFlag.isRedFlagTriggered
                      ? 'bg-rose-500 text-white'
                      : 'bg-emerald-200/80 text-emerald-900'
                  }`}
                >
                  階段 1（第 1 秒確定性規則引擎）：急症安全檢查結果
                </span>
              </div>

              <p className="text-xs sm:text-sm font-bold leading-relaxed">
                {redFlag.safeMessageZh}
              </p>

              {redFlag.isRedFlagTriggered && (
                <div className="space-y-3 pt-2">
                  {redFlag.triggeredRules.map((rule) => (
                    <div
                      key={rule.ruleId}
                      className="p-3.5 rounded-xl bg-rose-900/90 border border-rose-400/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm font-black text-rose-100">
                          ⚠️ {rule.alertTitleZh}
                        </span>
                        <span className="text-[11px] bg-rose-950/80 text-rose-300 px-2 py-0.5 rounded">
                          {rule.clinicalCategory}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-extrabold text-amber-300 flex items-center gap-1.5">
                        <PhoneCall className="w-4 h-4 shrink-0" />
                        <span>立即行動建議：{rule.immediateActionZh}</span>
                      </p>
                      <p className="text-xs text-rose-200 leading-relaxed">
                        臨床原因說明：{rule.reasoningZh}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 階段 2 (第 2~4 秒)：就醫急迫度燈號與台灣醫院建議掛號科別 ==================== */}
      {triage ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 左：紅/黃/綠 就醫急迫度燈號卡 */}
          <div
            className={`lg:col-span-5 rounded-2xl p-4 sm:p-5 border flex flex-col justify-between ${
              triage.triageLevel === 'red_emergency'
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : triage.triageLevel === 'yellow_prompt_outpatient'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
            }`}
          >
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
                階段 2：就醫急迫度燈號
              </span>
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-4 h-4 rounded-full shrink-0 ${
                    triage.triageLevel === 'red_emergency'
                      ? 'bg-rose-600 animate-ping'
                      : triage.triageLevel === 'yellow_prompt_outpatient'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                />
                <h3 className="text-base sm:text-lg font-black">
                  {triage.triageTitleZh}
                </h3>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {triage.triageSummaryZh}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-black/10 text-[11px] font-semibold">
              ※ 本分流燈號僅供就醫時程參考，不取代實際急診檢傷分類。
            </div>
          </div>

          {/* 右：建議優先掛號科別（符合台灣醫院分科） */}
          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hospital className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  建議優先掛號科別（依台灣醫院標準分科 × 部位深度路由）
                </h3>
              </div>
            </div>

            <div className="space-y-2.5">
              {triage.recommendedSpecialties.map((spec, idx) => (
                <div
                  key={spec.specialtyNameTw}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    idx === 0
                      ? 'bg-white border-sky-400 shadow-sm'
                      : 'bg-white/70 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                          idx === 0
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {idx === 0 ? '首選建議科別' : `協同鑑別科別 #${idx + 1}`}
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-900">
                        {spec.specialtyNameTw}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {spec.routingReasonZh}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        isStreaming && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
            <span>正在根據部位與深度層級計算台灣醫院專科路由...</span>
          </div>
        )
      )}

      {/* ==================== 階段 3 (第 5~8 秒)：反焦慮分層解析 + 看診小抄 + 居家照護 ==================== */}
      {clinical ? (
        <div className="space-y-5">
          {/* 跨系統會診總結 (Simulated MDT) */}
          <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 text-xs sm:text-sm text-sky-950 leading-relaxed flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-extrabold text-sky-900 mb-0.5">
                跨系統多專科整合觀點（Simulated MDT）
              </div>
              <p>{clinical.mdtCrossSystemInsightZh}</p>
            </div>
          </div>

          {/* 3-A：反焦慮分層 — 頂部預設展開「最常見的良性／輕微可能原因」 */}
          <div className="border-2 border-emerald-500/40 bg-emerald-50/20 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  反焦慮視覺第一層（預設展開・高機率常見狀況）
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  最常見可能相關的良性／一般臨床原因
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                ※ 僅供健康資訊參考，非確定性診斷
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {clinical.commonPossibilitiesExpanded.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="text-sm font-extrabold text-slate-900">
                      {item.conditionLabelZh}
                    </h4>
                    <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                      {item.likelihoodBadge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.specialtyPerspectiveZh}
                  </p>
                  {item.matchingSymptomsZh.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] text-slate-400">
                        對應您勾選的特徵：
                      </span>
                      {item.matchingSymptomsZh.map((sym, i) => (
                        <span
                          key={i}
                          className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                        >
                          {sym}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 3-A 底部：預設收合之「其他需留意之鑑別可能性」 (Anti-Cyberchondria) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() =>
                  setIsDifferentialExpanded(!isDifferentialExpanded)
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-bold flex items-center justify-between transition-colors"
              >
                <span>
                  {isDifferentialExpanded
                    ? '▼ 收合「少見但醫師門診會一併鑑別排除的可能性」'
                    : `▶ 展開查看「其他需由醫師鑑別排除之少見可能性（共 ${clinical.lessCommonDifferentialCollapsed.length} 項，已預設摺疊避免無謂焦慮）」`}
                </span>
                {isDifferentialExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {isDifferentialExpanded && (
                <div className="mt-3 space-y-2.5 pl-2 border-l-2 border-slate-300">
                  {clinical.lessCommonDifferentialCollapsed.map((diff, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1"
                    >
                      <div className="font-extrabold text-slate-800">
                        {diff.conditionLabelZh}
                      </div>
                      <p className="text-slate-600">
                        <strong>為何列入跨科考量：</strong>
                        {diff.whyConsiderZh}
                      </p>
                      <p className="text-sky-800">
                        <strong>門診可能安排之檢查方向：</strong>
                        {diff.whatDoctorMayCheckZh}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3-B & 3-C：看診小抄 (Doctor Cheat Sheet) + 居家照護與惡化警訊 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* 看診小抄 (100 字內結構化摘要 + 一鍵複製 + 儲存至病程時間軸) */}
            <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2.5 py-0.5 rounded-full">
                    看診小抄（Doctor Cheat Sheet・100 字內結構化摘要）
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCheatSheet}
                    className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    {copiedCheatSheet ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>已複製！</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>一鍵複製小抄</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs sm:text-sm font-medium text-sky-100 leading-relaxed select-all">
                  {clinical.doctorCheatSheet.summaryText100Words}
                </div>

                <div className="space-y-1 pt-1">
                  <div className="text-xs font-bold text-slate-300">
                    建議就醫時可主動詢問醫師的問題：
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {clinical.doctorCheatSheet.suggestedQuestionsForDoctor.map(
                      (q, i) => (
                        <li key={i}>{q}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              {/* 儲存至模組 G 病程時間軸 */}
              {onSaveToTimeline && (
                <div className="pt-3 border-t border-slate-700 space-y-2">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <BookmarkPlus className="w-4 h-4" />
                    <span>將本次評估存入「病程時間軸追蹤」（支援跨日對比與匯出 PDF）：</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={timelineNote}
                      onChange={(e) => setTimelineNote(e.target.value)}
                      placeholder="選填今日備註（如：早上體溫 38.1°C、痛點移到右下腹）..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onSaveToTimeline(timelineNote);
                        setTimelineNote('');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shrink-0 transition-all"
                    >
                      {savedToTimelineSuccess ? '✓ 已存入時間軸' : '+ 存入時間軸'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 安全居家照護與惡化警訊 */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                  <span>非藥物安全居家照護原則（不推薦任何處方藥物與劑量）</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside leading-relaxed">
                  {clinical.homeCareAndWatchouts.generalCareTipsZh.map(
                    (tip, i) => (
                      <li key={i}>{tip}</li>
                    )
                  )}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-rose-800 font-extrabold text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>惡化警訊（若新出現以下情況請立刻就醫或轉往急診）：</span>
                </div>
                <ul className="space-y-1 text-xs text-rose-900 list-disc list-inside leading-relaxed">
                  {clinical.homeCareAndWatchouts.escalationTriggersZh.map(
                    (trig, i) => (
                      <li key={i}>{trig}</li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        isStreaming &&
        currentStage >= 2 && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
            <span>正在生成反焦慮分層臨床解析與 100 字看診小抄...</span>
          </div>
        )
      )}

      {/* ==================== 階段 4：延伸前瞻醫學研究動態（可摺疊區塊・嚴格防幻覺 PubMed） ==================== */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/60">
        <button
          type="button"
          onClick={() => setIsPubMedExpanded(!isPubMedExpanded)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-100/80 transition-colors"
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span className="text-xs sm:text-sm font-extrabold text-slate-800">
              延伸前瞻醫學研究動態（NCBI PubMed 實證文獻檢索・可摺疊區隔）
            </span>
            <span className="text-[11px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
              強制鎖定 Humans[MeSH]・零幻覺 Metadata Grounding
            </span>
          </div>
          {isPubMedExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {isPubMedExpanded && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-3">
            {!pubmed ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>正在向 NCBI PubMed E-utilities API 檢索真實人類臨床文獻...</span>
              </div>
            ) : (
              <>
                <div className="p-2.5 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto">
                  <span className="text-sky-400 font-bold">
                    實際執行之 PubMed E-utilities 鎖定語法：
                  </span>{' '}
                  {pubmed.executedQuery}
                </div>

                {pubmed.articles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pubmed.articles.map((art) => (
                      <div
                        key={art.pmid}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between space-y-2"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded">
                              {art.evidenceLevel}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              PMID: {art.pmid} ({art.publicationYear})
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {art.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 italic">
                            期刊：{art.journalName}
                          </p>
                          <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg leading-relaxed">
                            {art.plainLanguageTakeawayZh}
                          </p>
                        </div>

                        <div className="pt-1">
                          <a
                            href={art.pubmedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            <span>開啟 PubMed 原始文獻連結 (PMID: {art.pmid})</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 leading-relaxed">
                    <strong>防幻覺安全保護狀態：</strong>
                    {pubmed.fallbackNoticeZh}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
