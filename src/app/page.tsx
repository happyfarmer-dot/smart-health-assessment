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
  ChevronUp,
  X,
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
    activeRegionId,
    selectedRegions,
    systemicSymptomIds,
    followUp,
    setActiveRegion,
    removeSelectedRegion,
    toggleSystemicSymptom,
    setFollowUpModalOpen,
  } = useDiagnosisStore();

  const [mounted, setMounted] = useState(false);
  const [isSummaryDrawerOpen, setIsSummaryDrawerOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [safetyResult, setSafetyResult] = useState<SafetyCheckResult | null>(null);
  const [primaryResult, setPrimaryResult] = useState<PrimaryDiagnosisResult | null>(null);
  const [differentialResult, setDifferentialResult] =
    useState<DifferentialAndAnalysisResult | null>(null);
  const [pubmedResult, setPubmedResult] = useState<PubMedResearchResult | null>(null);

  const reportSectionRef = useRef<HTMLDivElement | null>(null);
  const desktopPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 桌機版點選部位時自動平滑捲動至右側編輯面板（手機版則自動開啟 Bottom Sheet）
  useEffect(() => {
    if (!activeRegionId || typeof window === 'undefined') return;
    if (window.innerWidth >= 1024 && desktopPanelRef.current) {
      desktopPanelRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeRegionId]);

  const selectedRegionList = Object.values(selectedRegions);
  const totalSelections =
    selectedRegionList.length + systemicSymptomIds.length;
  const totalFeatureCount =
    selectedRegionList.reduce(
      (sum, rec) =>
        sum + rec.qualityIds.length + rec.specificSymptomIds.length,
      0
    ) + systemicSymptomIds.length;

  const hasStartedDiagnosis =
    isStreaming ||
    Boolean(safetyResult) ||
    Boolean(primaryResult) ||
    Boolean(differentialResult) ||
    Boolean(pubmedResult);

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
    <>
      <main className="max-w-7xl mx-auto px-3.5 sm:px-4 pt-3 pb-24 space-y-3">
        {/* 單行精簡 API 連線狀態列（點擊右側按鈕以 Modal 展開設定） */}
        <TopApiControlBar />

        {/* 緊湊型 App Header（僅保留標題與一行副標） */}
        <header className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center shadow-md shadow-cyan-950/60 shrink-0">
            <Stethoscope className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
              3D 互動式智慧醫療疾病判斷系統
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">
              現代實證西醫・32 區解剖鑑別診斷與 NCBI PubMed 實證檢索工作台
            </p>
          </div>
        </header>

        {/* 模組 A：基礎生理情境卡片 */}
        <ContextProfileCard />

        {/* 模組 B-1：3D / 2D 一鍵切換與頂部即時搜尋框 */}
        <ModeAndSearchHeader />

        {/* 模組 B-2 & C：主臨床輸入工作台 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* 左側 7 欄：高輪廓 3D 人體熱區場景 或 2D 快速列表 */}
          <div className="lg:col-span-7 space-y-3">
            {!mounted ? (
              <div className="w-full h-[540px] bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />
            ) : inputMode === '3d' ? (
              <BodyCanvas3D />
            ) : (
              <BodyRegionList2D />
            )}
          </div>

          {/* 右側 5 欄：桌機版部位編輯面板 + 全身性症狀分類面板 + 已選特徵總覽 */}
          <div className="lg:col-span-5 space-y-4">
            <div ref={desktopPanelRef} className="hidden lg:block">
              <RegionQualitiesPanel />
            </div>

            {/* 模組 C-2：7 大系統全身性症狀分類面板 */}
            <SystemicSymptomsAccordion />

            {/* 桌機與頁面內建已選特徵總覽 */}
            {totalSelections > 0 && (
              <div className="hidden lg:block bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    已納入疾病鑑別之臨床特徵清單
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    {selectedRegionList.length} 部位 / {totalFeatureCount} 特徵
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedRegionList.map((rec) => {
                    const depthCfg = DEPTH_LAYER_CONFIG[rec.depthLayer];
                    return (
                      <div
                        key={rec.regionId}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-2 hover:border-slate-700 transition-colors"
                      >
                        <div
                          className="cursor-pointer flex-1 space-y-1"
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
                                  {qLbl}
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
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 模組 E & F：尚未執行評估前隱藏，待按下診斷後再展開渲染 */}
        {hasStartedDiagnosis && (
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
        )}

        {/* 模組 D：兩階段臨床追問 Modal */}
        <TwoStageFollowUpModal
          onConfirmAndStartDiagnosis={handleConfirmAndStartDiagnosis}
        />
      </main>

      {/* 手機版部位編輯 Bottom Sheet（點擊任一部位時由底部滑出，附「完成此部位」確認鍵） */}
      {activeRegionId && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex items-end bg-slate-950/75 backdrop-blur-sm"
          onClick={() => setActiveRegion(null)}
        >
          <div
            className="w-full max-h-[86vh] overflow-y-auto rounded-t-3xl bg-slate-900 border-t border-cyan-500/40 shadow-2xl p-3 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-2.5 h-1.5 w-12 rounded-full bg-slate-700" />
            <RegionQualitiesPanel onDone={() => setActiveRegion(null)} />
          </div>
        </div>
      )}

      {/* 已選清單抽屜（點擊底部操作列「已選 X 部位・Y 項特徵」展開） */}
      {isSummaryDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 backdrop-blur-sm"
          onClick={() => setIsSummaryDrawerOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-t-3xl bg-slate-900 border-t border-slate-700 p-4 pb-6 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-extrabold text-white">
                  已納入鑑別之臨床特徵清單（{selectedRegionList.length} 部位・
                  {totalFeatureCount} 項特徵）
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSummaryDrawerOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {totalSelections === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                尚未選取任何解剖部位或全身症狀，請先於工作台勾選。
              </p>
            ) : (
              <div className="space-y-2.5">
                {selectedRegionList.map((rec) => {
                  const depthCfg = DEPTH_LAYER_CONFIG[rec.depthLayer];
                  return (
                    <div
                      key={rec.regionId}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-2"
                    >
                      <div
                        className="cursor-pointer flex-1 space-y-1"
                        onClick={() => {
                          setIsSummaryDrawerOpen(false);
                          setActiveRegion(rec.regionId as BodyRegionId);
                        }}
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
                                {qLbl}
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
                            className="cursor-pointer text-xs font-semibold bg-slate-900 text-amber-200 border border-amber-500/40 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 hover:bg-rose-950 hover:text-rose-200"
                          >
                            <span>{sysItem?.labelZh || sysId}</span>
                            <span className="text-slate-500">×</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 底部固定懸浮操作列 (Sticky Bottom Action Bar) */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(2,6,23,0.85)]">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsSummaryDrawerOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800 px-3 py-2 text-left transition-colors min-w-0"
          >
            <ChevronUp
              className={`w-4 h-4 text-cyan-400 shrink-0 transition-transform ${
                isSummaryDrawerOpen ? 'rotate-180' : ''
              }`}
            />
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold text-white truncate">
                已選 {selectedRegionList.length} 部位・{totalFeatureCount} 項特徵
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block">
                點擊展開已選清單抽屜
              </div>
            </div>
          </button>

          <button
            type="button"
            disabled={totalSelections === 0}
            onClick={() => setFollowUpModalOpen(true)}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all shadow-lg shrink-0 ${
              totalSelections > 0
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-950/60 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <span>開始臨床鑑別診斷</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
