'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Activity,
  Stethoscope,
  Trash2,
  ArrowRight,
  Layers,
  Globe,
  CheckCircle2,
  CalendarClock,
  Sparkles,
} from 'lucide-react';
import { ContextProfileCard } from '@/components/layout/ContextProfileCard';
import { ModeToggleHeader } from '@/components/symptom-input/ModeToggleHeader';
import { RegionSymptomPopover } from '@/components/symptom-input/RegionSymptomPopover';
import { BodyRegionList2D } from '@/components/symptom-input/BodyRegionList2D';
import { SystemicSymptomPanel } from '@/components/symptom-input/SystemicSymptomPanel';
import { FollowUpModal } from '@/components/assessment/FollowUpModal';
import { StreamingReportView } from '@/components/assessment/StreamingReportView';
import { TimelineComparison } from '@/components/timeline/TimelineComparison';
import { useHealthStore } from '@/store/useHealthStore';
import { DEPTH_LAYER_META, SYSTEMIC_SYMPTOMS } from '@/data/symptomCatalog';
import { runProgressiveAssessmentStream } from '@/lib/assessmentRunner';
import {
  AssessmentRequestPayload,
  BodyRegionId,
  ClinicalAnalysisResult,
  PubMedEvidenceResult,
  RedFlagEvaluationResult,
  TriageAndSpecialtyResult,
} from '@/types/medical';

// 動態載入 Three.js 3D 畫布，避免 SSR hydration 衝突並加速首屏載入
const BodyCanvas3D = dynamic(
  () =>
    import('@/components/symptom-input/BodyCanvas3D').then(
      (mod) => mod.BodyCanvas3D
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] sm:h-[580px] bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-sky-300 gap-2">
        <Activity className="w-8 h-8 animate-spin text-sky-400" />
        <span className="text-sm font-bold">
          正在初始化 24 區 3D 解剖人體模型（含腹部五分區與左右防呆座標）...
        </span>
      </div>
    ),
  }
);

export default function SmartHealthHomePage() {
  const {
    contextProfile,
    inputMode,
    selectedRegions,
    systemicSymptoms,
    followUpAnswers,
    timelineNodes,
    setActiveRegion,
    removeSelectedRegion,
    toggleSystemicSymptom,
    setFollowUpModalOpen,
    addTimelineNode,
    quickAddSymptomFromSearch,
  } = useHealthStore();

  const [mounted, setMounted] = useState(false);

  // 4 階段串流報告狀態
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [redFlagResult, setRedFlagResult] =
    useState<RedFlagEvaluationResult | null>(null);
  const [triageResult, setTriageResult] =
    useState<TriageAndSpecialtyResult | null>(null);
  const [clinicalResult, setClinicalResult] =
    useState<ClinicalAnalysisResult | null>(null);
  const [pubmedResult, setPubmedResult] =
    useState<PubMedEvidenceResult | null>(null);
  const [savedToTimelineSuccess, setSavedToTimelineSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedRegionList = Object.values(selectedRegions);
  const totalSelections =
    selectedRegionList.length + systemicSymptoms.length;

  const handleStartAssessment = async (geminiApiKey?: string) => {
    const payload: AssessmentRequestPayload = {
      contextProfile,
      regionSymptoms: selectedRegionList,
      systemicSymptoms,
      followUp: followUpAnswers,
      clientTimestamp: new Date().toISOString(),
    };

    setIsStreaming(true);
    setCurrentStage(0);
    setRedFlagResult(null);
    setTriageResult(null);
    setClinicalResult(null);
    setPubmedResult(null);
    setSavedToTimelineSuccess(false);

    // 自動平滑捲動至報告區域
    setTimeout(() => {
      document
        .getElementById('assessment-report-anchor')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);

    await runProgressiveAssessmentStream(
      payload,
      (evt) => {
        if (evt.event === 'red_flag_check') {
          setCurrentStage(1);
          setRedFlagResult(evt.data);
        } else if (evt.event === 'triage_and_specialty') {
          setCurrentStage(2);
          setTriageResult(evt.data);
        } else if (evt.event === 'clinical_analysis') {
          setCurrentStage(3);
          setClinicalResult(evt.data);
        } else if (evt.event === 'pubmed_evidence') {
          setCurrentStage(4);
          setPubmedResult(evt.data);
        }
      },
      { geminiApiKey }
    );

    setIsStreaming(false);
  };

  const handleSaveToTimeline = (userNote: string) => {
    if (!redFlagResult || !triageResult || !clinicalResult) return;
    addTimelineNode({
      userNote,
      redFlag: redFlagResult,
      triage: triageResult,
      clinical: clinicalResult,
      pubmed: pubmedResult || undefined,
    });
    setSavedToTimelineSuccess(true);
  };

  // 一鍵載入臨床情境範例（方便快速測試良性分層 vs 急症紅旗攔截）
  const loadQuickScenario = (type: 'benign_gerd' | 'redflag_rlq' | 'redflag_acs') => {
    if (type === 'benign_gerd') {
      quickAddSymptomFromSearch('abd_epigastric', 'epi_burning_acid');
    } else if (type === 'redflag_rlq') {
      quickAddSymptomFromSearch('abd_rlq', 'rlq_rebound_tenderness');
      if (!systemicSymptoms.includes('fever_high')) {
        toggleSystemicSymptom('fever_high');
      }
    } else if (type === 'redflag_acs') {
      quickAddSymptomFromSearch('chest_left', 'chest_l_crushing_pain');
      if (!systemicSymptoms.includes('cold_sweat_pallor')) {
        toggleSystemicSymptom('cold_sweat_pallor');
      }
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-5 sm:py-6 space-y-6">
      {/* 頂部品牌標題與快速情境體驗列 */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm print:hidden">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white flex items-center justify-center shadow-md shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                3D 互動式智慧健康評估系統
              </h1>
              <span className="text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200 px-2.5 py-0.5 rounded-full">
                現代實證西醫・反焦慮分層
              </span>
              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Web & GitHub Pages 雙棲架構
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              專家大腦、白話嘴巴：具備 24 區 3D 解剖定位（腹部五分區）、表層／深層多專科路由、確定性紅旗攔截與防幻覺 PubMed 檢索
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
          <a
            href="#timeline-section-anchor"
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-extrabold flex items-center gap-1.5 transition-all"
          >
            <CalendarClock className="w-4 h-4 text-indigo-600" />
            <span>病程時間軸與匯出 ({timelineNodes.length})</span>
          </a>

          <button
            type="button"
            disabled={totalSelections === 0}
            onClick={() => setFollowUpModalOpen(true)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shadow-sm ${
              totalSelections > 0
                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-200 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>開始臨床評估 ({totalSelections})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 一鍵臨床測試情境體驗列 */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-bold">快速體驗臨床分層與紅旗攔截範例：</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadQuickScenario('benign_gerd')}
            className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-semibold transition-all"
          >
            🟢 載入常見輕症範例（中上腹火燒心／胃食道逆流）
          </button>
          <button
            type="button"
            onClick={() => loadQuickScenario('redflag_rlq')}
            className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-semibold transition-all"
          >
            🔴 載入外科紅旗範例（右下腹反彈痛＋高燒）
          </button>
          <button
            type="button"
            onClick={() => loadQuickScenario('redflag_acs')}
            className="px-3 py-1 rounded-lg bg-rose-500/25 hover:bg-rose-500/35 border border-rose-400/50 text-rose-200 font-semibold transition-all"
          >
            🚨 載入心血管紅旗範例（左胸深層壓迫痛＋冒冷汗）
          </button>
        </div>
      </div>

      {/* 模組 A：常駐可展開之個人生理情境卡 (Context Profile) */}
      <div className="print:hidden">
        <ContextProfileCard />
      </div>

      {/* 模組 B-1：3D / 2D 雙模式一鍵切換與白話文模糊搜尋框 */}
      <div className="print:hidden">
        <ModeToggleHeader />
      </div>

      {/* 模組 B-2：主互動工作區 (左：3D 模型或 2D 快速列表；右：深度與症狀選擇 + 全身性症狀 + 已選清單) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start print:hidden">
        {/* 左側 7 欄：3D 模型畫布 或 2D 快速列表 */}
        <div className="lg:col-span-7 space-y-4">
          {!mounted ? (
            <div className="w-full h-[540px] bg-slate-900 rounded-2xl animate-pulse" />
          ) : inputMode === '3d' ? (
            <BodyCanvas3D />
          ) : (
            <BodyRegionList2D />
          )}
        </div>

        {/* 右側 5 欄：部位深度×症狀選單 + 全身性症狀面板 + 已選症狀匯總卡 */}
        <div className="lg:col-span-5 space-y-4">
          <RegionSymptomPopover />
          <SystemicSymptomPanel />

          {/* 已選部位與全身症狀即時匯總（雙向同步驗證卡） */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                已納入評估之症狀清單（3D / 2D 同步）
              </h3>
              <span className="text-xs font-bold text-slate-500">
                共 {totalSelections} 項
              </span>
            </div>

            {totalSelections === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 text-center">
                尚未選擇任何症狀。您可以點擊左側 3D 人體部位、使用上方搜尋框（如輸入「右下腹痛」），或點選頂部快速範例按鈕。
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedRegionList.map((item) => {
                  const depthMeta = DEPTH_LAYER_META[item.depthLayer];
                  return (
                    <div
                      key={item.regionId}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-2"
                    >
                      <div
                        className="cursor-pointer flex-1"
                        onClick={() =>
                          setActiveRegion(item.regionId as BodyRegionId)
                        }
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-slate-900">
                            {item.regionNameZh}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-bold inline-flex items-center gap-1 ${depthMeta.badgeColor}`}
                          >
                            <Layers className="w-2.5 h-2.5" />
                            {depthMeta.labelZh}
                          </span>
                        </div>
                        <ul className="mt-1.5 space-y-0.5 text-xs text-slate-600 list-disc list-inside">
                          {item.symptomLabelsZh.map((lbl, i) => (
                            <li key={i}>{lbl}</li>
                          ))}
                        </ul>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          removeSelectedRegion(item.regionId as BodyRegionId)
                        }
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="移除此部位"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {systemicSymptoms.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                    <div className="text-xs font-extrabold text-amber-900 mb-1.5">
                      全身性症狀：
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {systemicSymptoms.map((sysId) => {
                        const sysDef = SYSTEMIC_SYMPTOMS.find(
                          (s) => s.id === sysId
                        );
                        return (
                          <span
                            key={sysId}
                            onClick={() => toggleSystemicSymptom(sysId)}
                            className="cursor-pointer text-xs font-semibold bg-white text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full inline-flex items-center gap-1 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-colors"
                          >
                            {sysDef?.labelZh || sysId}
                            <span className="text-slate-400">×</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setFollowUpModalOpen(true)}
                  className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <span>下一步：進行輕量化動態追問與急症紅旗篩檢</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 模組 C：輕量化動態追問 Modal */}
      <FollowUpModal onConfirmStartAssessment={handleStartAssessment} />

      {/* 模組 D + E + F：4 階段串流分階段渲染報告 */}
      <div id="assessment-report-anchor" className="print:hidden">
        <StreamingReportView
          isStreaming={isStreaming}
          currentStage={currentStage}
          redFlag={redFlagResult}
          triage={triageResult}
          clinical={clinicalResult}
          pubmed={pubmedResult}
          onSaveToTimeline={handleSaveToTimeline}
          savedToTimelineSuccess={savedToTimelineSuccess}
        />
      </div>

      {/* 模組 G：病程時間軸追蹤與 PDF / PNG 一鍵匯出 */}
      <div id="timeline-section-anchor">
        <TimelineComparison />
      </div>
    </main>
  );
}
