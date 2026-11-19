'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Activity,
  Stethoscope,
  Trash2,
  ArrowRight,
  Layers,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { TopApiControlBar } from '@/components/layout/TopApiControlBar';
import { ContextProfileCard } from '@/components/layout/ContextProfileCard';
import { ModeAndSearchHeader } from '@/components/symptom-input/ModeAndSearchHeader';
import { RegionQualitiesPanel } from '@/components/symptom-input/RegionQualitiesPanel';
import { BodyRegionList2D } from '@/components/symptom-input/BodyRegionList2D';
import { SystemicSymptomsAccordion } from '@/components/symptom-input/SystemicSymptomsAccordion';
import { TwoStageFollowUpModal } from '@/components/diagnosis/TwoStageFollowUpModal';
import { DiagnosisStreamReport } from '@/components/diagnosis/DiagnosisStreamReport';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import { DEPTH_LAYER_CONFIG } from '@/data/discomfortQualities';
import { SYSTEMIC_SYMPTOM_MAP } from '@/data/systemicSymptomsCatalog';
import {
  BodyRegionId,
  DiagnosisRequestPayload,
  DifferentialAndAnalysisResult,
  DynamicFollowUpAnswerItem,
  PrimaryDiagnosisResult,
  PubMedResearchResult,
  SafetyCheckResult,
} from '@/types/cdss';
import { runIsomorphicDiagnosisStream } from '@/lib/diagnosisStreamRunner';

const BodyCanvas3D = dynamic(
  () =>
    import('@/components/symptom-input/BodyCanvas3D').then(
      (mod) => mod.BodyCanvas3D
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[540px] sm:h-[620px] bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-cyan-300 gap-2.5">
        <Activity className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="text-sm font-bold">
          正在載入 3D 人體模型 (DRACO / Fresnel 輪廓光) 與 32 區透明感應熱區...
        </span>
      </div>
    ),
  }
);

export default function ClinicalDiagnosisWorkbenchPage() {
  const {
    apiSettings,
    updateApiSettings,
    contextProfile,
    inputMode,
    selectedRegions,
    systemicSymptomIds,
    followUp,
    setActiveRegion,
    removeSelectedRegion,
    toggleSystemicSymptom,
    setFollowUpModalOpen,
  } = useDiagnosisStore();

  const [mounted, setMounted] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [safetyResult, setSafetyResult] = useState<SafetyCheckResult | null>(null);
  const [primaryResult, setPrimaryResult] = useState<PrimaryDiagnosisResult | null>(null);
  const [differentialResult, setDifferentialResult] =
    useState<DifferentialAndAnalysisResult | null>(null);
  const [pubmedResult, setPubmedResult] = useState<PubMedResearchResult | null>(null);

  const reportSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedRegionList = Object.values(selectedRegions);
  const totalSelections =
    selectedRegionList.length + systemicSymptomIds.length;

  const handleConfirmAndStartDiagnosis = async (dynamicAnswers: {
    wasSkipped: boolean;
    answers: DynamicFollowUpAnswerItem[];
  }) => {
    setIsStreaming(true);
    setSafetyResult(null);
    setPrimaryResult(null);
    setDifferentialResult(null);
    setPubmedResult(null);

    setTimeout(() => {
      reportSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);

    const payload: DiagnosisRequestPayload = {
      contextProfile,
      regionRecords: selectedRegionList,
      systemicSymptomIds,
      followUp,
      dynamicAnswers,
      clientTimestamp: new Date().toISOString(),
    };

    const activeCustomKey =
      apiSettings.enabled && apiSettings.apiKey.trim()
        ? apiSettings.apiKey.trim()
        : '';

    await runIsomorphicDiagnosisStream(
      payload,
      {
        onSafetyCheck: (data) => setSafetyResult(data),
        onPrimaryDiagnosis: (data) => setPrimaryResult(data),
        onDifferentialAndAnalysis: (data) => setDifferentialResult(data),
        onPubMedResearch: (data) => setPubmedResult(data),
        onComplete: () => setIsStreaming(false),
        onError: () => setIsStreaming(false),
      },
      activeCustomKey,
      apiSettings.modelId
    );
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-4 sm:py-5 space-y-4">
      {/* Patch #1：頁面最上方新增「API 設定列」（Top API Control Bar） */}
      <TopApiControlBar />

      {/* 頂部純淨臨床決策支援系統標題列（無任何 Demo 範例按鈕） */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-950/60 shrink-0">
            <Stethoscope className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                3D 互動式智慧醫療疾病判斷系統
              </h1>
              <span className="text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                現代實證西醫・多專科疾病鑑別診斷 (CDSS)
              </span>
              <span className="text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                32 區全身無死角解剖分區 + Fresnel 3D 渲染
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              根據生理情境、解剖部位深度、24 項不適感受性質、44 項全身症狀與客觀生命徵象，進行跨專科臨床疾病推論與 PubMed 實證檢索
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end lg:self-auto">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-300">
              已收集臨床特徵
            </div>
            <div className="text-[11px] text-cyan-400">
              {selectedRegionList.length} 處解剖部位 /{' '}
              {systemicSymptomIds.length} 項全身表現
            </div>
          </div>

          <button
            type="button"
            disabled={totalSelections === 0}
            onClick={() => setFollowUpModalOpen(true)}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shadow-lg ${
              totalSelections > 0
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-950/60 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <span>開始臨床疾病鑑別診斷 ({totalSelections})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 模組 A：基礎生理情境卡片 (Context Profile & 藥源性排查基底) */}
      <ContextProfileCard />

      {/* 模組 B-1：3D / 2D 一鍵切換與頂部即時搜尋框 */}
      <ModeAndSearchHeader />

      {/* 模組 B-2 & C：主臨床輸入工作台 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* 左側 7 欄：高輪廓 3D 人體熱區場景 或 2D 快速列表 */}
        <div className="lg:col-span-7 space-y-4">
          {!mounted ? (
            <div className="w-full h-[580px] bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />
          ) : inputMode === '3d' ? (
            <BodyCanvas3D />
          ) : (
            <BodyRegionList2D />
          )}
        </div>

        {/* 右側 5 欄：部位深度×24項不適感受選單 + 44項全身性症狀分類面板 + 已選特徵總覽 */}
        <div className="lg:col-span-5 space-y-4">
          {/* 模組 B & C-1：點擊部位後之深度與 24 項通用不適感＋專屬症狀面板 */}
          <RegionQualitiesPanel />

          {/* 模組 C-2：6 大系統 44 項全身性症狀分類面板 */}
          <SystemicSymptomsAccordion />

          {/* 已納入鑑別診斷之臨床症狀清單 */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                已納入疾病鑑別之臨床特徵清單
              </h3>
              <span className="text-xs font-bold text-slate-400">
                共 {totalSelections} 項
              </span>
            </div>

            {totalSelections === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-dashed border-slate-800 text-xs text-slate-400 text-center leading-relaxed">
                請點選左側 3D 人體模型上的解剖部位（或切換至 2D 列表），勾選不適感受性質與全身性症狀後，即可進入兩階段臨床追問與疾病判斷。
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedRegionList.map((rec) => {
                  const depthCfg = DEPTH_LAYER_CONFIG[rec.depthLayer];
                  return (
                    <div
                      key={rec.regionId}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-2 hover:border-slate-700 transition-colors"
                    >
                      <div
                        className="cursor-pointer flex-1 space-y-1.5"
                        onClick={() =>
                          setActiveRegion(rec.regionId as BodyRegionId)
                        }
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-white">
                            {rec.regionNameZh}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-bold inline-flex items-center gap-1 ${depthCfg.badgeStyle}`}
                          >
                            <Layers className="w-2.5 h-2.5" />
                            {depthCfg.shortLabelZh}
                          </span>
                        </div>

                        {rec.qualityLabelsZh.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {rec.qualityLabelsZh.map((qLbl, i) => (
                              <span
                                key={i}
                                className="text-[11px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-md font-medium"
                              >
                                性質：{qLbl}
                              </span>
                            ))}
                          </div>
                        )}

                        {rec.specificSymptomLabelsZh.length > 0 && (
                          <ul className="space-y-0.5 text-xs text-slate-300 list-disc list-inside">
                            {rec.specificSymptomLabelsZh.map((sLbl, i) => (
                              <li key={i}>{sLbl}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeSelectedRegion(rec.regionId as BodyRegionId)
                        }
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="移除此部位"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {systemicSymptomIds.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
                    <div className="text-xs font-extrabold text-amber-300 mb-1.5">
                      全身性症狀表現：
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {systemicSymptomIds.map((sysId) => {
                        const sysItem = SYSTEMIC_SYMPTOM_MAP[sysId];
                        return (
                          <span
                            key={sysId}
                            onClick={() => toggleSystemicSymptom(sysId)}
                            className="cursor-pointer text-xs font-semibold bg-slate-900 text-amber-200 border border-amber-500/40 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 hover:bg-rose-950 hover:text-rose-200 hover:border-rose-500/50 transition-colors"
                          >
                            <span>{sysItem?.labelZh || sysId}</span>
                            <span className="text-slate-500">×</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setFollowUpModalOpen(true)}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all"
                >
                  <span>下一步：補充臨床資訊（生命徵象與 AI 動態追問）</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 模組 E & F：4 階段 SSE 串流多專科疾病鑑別診斷與 PubMed 實證報告區 */}
      <div ref={reportSectionRef} className="pt-2">
        <DiagnosisStreamReport
          isStreaming={isStreaming}
          safetyResult={safetyResult}
          primaryResult={primaryResult}
          differentialResult={differentialResult}
          pubmedResult={pubmedResult}
          optionalGeminiKey={apiSettings.enabled ? apiSettings.apiKey : ''}
          onChangeGeminiKey={(key) =>
            updateApiSettings({ enabled: true, apiKey: key })
          }
        />
      </div>

      {/* 模組 D：兩階段臨床追問 Modal（Step 1 病程與客觀生命徵象 -> Step 2 AI 假說驅動動態追問） */}
      <TwoStageFollowUpModal
        onConfirmAndStartDiagnosis={handleConfirmAndStartDiagnosis}
      />
    </main>
  );
}
