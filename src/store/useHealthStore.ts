'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  BodyRegionId,
  ClinicalAnalysisResult,
  FollowUpAnswers,
  PatientContextProfile,
  PubMedEvidenceResult,
  RedFlagEvaluationResult,
  SelectedRegionSymptom,
  SymptomDepthLayer,
  SystemicSymptomId,
  TimelineAssessmentNode,
  TriageAndSpecialtyResult,
} from '@/types/medical';
import { BODY_REGION_MAP } from '@/data/bodyRegions';
import { REGION_SYMPTOM_OPTIONS } from '@/data/symptomCatalog';

export type InputViewMode = '3d' | '2d';
export type CameraOrientation = 'anterior' | 'posterior';

interface HealthAssessmentState {
  // 模組 A：個人生理情境卡 (Context Profile)
  contextProfile: PatientContextProfile;
  isProfileDrawerOpen: boolean;
  updateContextProfile: (partial: Partial<PatientContextProfile>) => void;
  setProfileDrawerOpen: (open: boolean) => void;

  // 模組 B：3D / 2D 雙模式狀態與雙向同步
  inputMode: InputViewMode;
  cameraOrientation: CameraOrientation;
  cameraResetTrigger: number;
  activeRegionId: BodyRegionId | null;
  hoveredRegionId: BodyRegionId | null;

  selectedRegions: Record<string, SelectedRegionSymptom>;
  systemicSymptoms: SystemicSymptomId[];

  // 模組 C：動態追問狀態
  followUpAnswers: FollowUpAnswers;
  isFollowUpModalOpen: boolean;

  // 模組 G：病程時間軸追蹤 (Timeline Nodes)
  timelineNodes: TimelineAssessmentNode[];
  addTimelineNode: (params: {
    userNote?: string;
    redFlag: RedFlagEvaluationResult;
    triage: TriageAndSpecialtyResult;
    clinical: ClinicalAnalysisResult;
    pubmed?: PubMedEvidenceResult;
  }) => void;
  removeTimelineNode: (nodeId: string) => void;
  loadDemoProgressionTimeline: () => void;

  // 互動 Actions
  setInputMode: (mode: InputViewMode) => void;
  setCameraOrientation: (orientation: CameraOrientation) => void;
  toggleCameraOrientation: () => void;
  triggerCameraReset: () => void;
  setActiveRegion: (regionId: BodyRegionId | null) => void;
  setHoveredRegion: (regionId: BodyRegionId | null) => void;

  // 部位深度與症狀增刪 Actions
  setRegionDepthLayer: (regionId: BodyRegionId, depth: SymptomDepthLayer) => void;
  toggleRegionSymptom: (regionId: BodyRegionId, symptomId: string) => void;
  quickAddSymptomFromSearch: (regionId: BodyRegionId, symptomId?: string) => void;
  removeSelectedRegion: (regionId: BodyRegionId) => void;
  toggleSystemicSymptom: (symptomId: SystemicSymptomId) => void;
  clearAllSelections: () => void;

  // 追問 Modal Actions
  setFollowUpModalOpen: (open: boolean) => void;
  updateFollowUpAnswers: (partial: Partial<FollowUpAnswers>) => void;
}

const DEFAULT_CONTEXT_PROFILE: PatientContextProfile = {
  ageGroup: '18-39',
  biologicalSex: 'male',
  pregnancyStatus: 'not_applicable',
  chronicConditions: [],
  highRiskMedications: [],
  customMedicationNote: '',
  updatedAt: new Date().toISOString(),
};

const DEFAULT_FOLLOW_UP: FollowUpAnswers = {
  duration: 'days_1_3',
  severityScore: 4,
  isSuddenOnset: false,
  hasRadiation: false,
  radiationTargetNote: '',
};

export const useHealthStore = create<HealthAssessmentState>()(
  persist(
    (set, get) => ({
      contextProfile: DEFAULT_CONTEXT_PROFILE,
      isProfileDrawerOpen: false,

      updateContextProfile: (partial) =>
        set((state) => {
          const nextSex = partial.biologicalSex ?? state.contextProfile.biologicalSex;
          let nextPregnancy =
            partial.pregnancyStatus ?? state.contextProfile.pregnancyStatus;
          if (nextSex !== 'female') {
            nextPregnancy = 'not_applicable';
          } else if (nextPregnancy === 'not_applicable') {
            nextPregnancy = 'no';
          }
          return {
            contextProfile: {
              ...state.contextProfile,
              ...partial,
              pregnancyStatus: nextPregnancy,
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      setProfileDrawerOpen: (open) => set({ isProfileDrawerOpen: open }),

      inputMode: '3d',
      cameraOrientation: 'anterior',
      cameraResetTrigger: 0,
      activeRegionId: null,
      hoveredRegionId: null,
      selectedRegions: {},
      systemicSymptoms: [],
      followUpAnswers: DEFAULT_FOLLOW_UP,
      isFollowUpModalOpen: false,
      timelineNodes: [],

      addTimelineNode: ({ userNote, redFlag, triage, clinical, pubmed }) =>
        set((state) => {
          const now = new Date();
          const dayIndex = state.timelineNodes.length + 1;
          const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${String(
            now.getHours()
          ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          const newNode: TimelineAssessmentNode = {
            nodeId: `node-${Date.now()}`,
            recordedAt: now.toISOString(),
            dayLabelZh: `紀錄節點 #${dayIndex} (${dateStr})`,
            userNote: userNote?.trim() || undefined,
            requestSnapshot: {
              contextProfile: state.contextProfile,
              regionSymptoms: Object.values(state.selectedRegions),
              systemicSymptoms: state.systemicSymptoms,
              followUp: state.followUpAnswers,
              clientTimestamp: now.toISOString(),
            },
            reportSnapshot: {
              redFlag,
              triage,
              clinical,
              pubmed,
            },
          };

          return {
            timelineNodes: [...state.timelineNodes, newNode],
          };
        }),

      removeTimelineNode: (nodeId) =>
        set((state) => ({
          timelineNodes: state.timelineNodes.filter((n) => n.nodeId !== nodeId),
        })),

      // 內建典型跨日病程範例（例如：第 1 天中上腹悶痛微燒 → 第 2 天轉移至右下腹劇痛高燒）方便一鍵展示時間軸對比
      loadDemoProgressionTimeline: () =>
        set((state) => {
          const demoNode1: TimelineAssessmentNode = {
            nodeId: 'demo-day-1',
            recordedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            dayLabelZh: '第 1 天 (前日 09:00)',
            userNote: '早餐後覺得肚臍周圍跟胃悶悶的，有點沒食慾',
            requestSnapshot: {
              contextProfile: state.contextProfile,
              regionSymptoms: [
                {
                  regionId: 'abd_epigastric',
                  regionNameZh: '中上腹與肚臍周圍（胃／胰／早期闌尾）',
                  depthLayer: 'deep_visceral',
                  symptomIds: ['epi_periumbilical_cramps'],
                  symptomLabelsZh: ['肚臍周圍陣發性絞痛、腸鳴或伴隨腹瀉'],
                  meshTermsEn: ['Gastroenteritis', 'Abdominal Cramps'],
                },
              ],
              systemicSymptoms: ['anorexia_nausea'],
              followUp: {
                duration: 'hours',
                severityScore: 4,
                isSuddenOnset: false,
                hasRadiation: false,
              },
              clientTimestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
            },
            reportSnapshot: {
              redFlag: {
                isRedFlagTriggered: false,
                triggeredRules: [],
                checkedRulesCount: 7,
                safeMessageZh: '未發現立即危急紅旗組合',
              },
              triage: {
                triageLevel: 'green_routine_observation',
                triageTitleZh: '綠燈：一般門診諮詢與居家觀察',
                triageSummaryZh: '初期中上腹與肚臍周圍悶痛，建議清淡飲食並觀察痛點是否轉移。',
                recommendedSpecialties: [
                  {
                    specialtyNameTw: '肝膽腸胃科',
                    priority: 'primary',
                    routingReasonZh: '中上腹與肚臍周圍深層不適評估',
                    scoreWeight: 12,
                  },
                ],
              },
              clinical: {
                engineModeUsed: 'deterministic_ebm',
                commonPossibilitiesExpanded: [],
                lessCommonDifferentialCollapsed: [],
                mdtCrossSystemInsightZh: '初期表現似一般急性腸胃炎或消化不良，需觀察痛點是否向右下腹移動。',
                doctorCheatSheet: {
                  summaryText100Words:
                    '【第1天看診摘要】主訴：中上腹与肚臍周圍[深層內臟:肚臍周圍絞痛]，伴隨食慾不振、噁心。不適程度 4/10 分，無放射痛。建議觀察並優先評估：肝膽腸胃科。',
                  suggestedQuestionsForDoctor: [],
                },
                homeCareAndWatchouts: {
                  generalCareTipsZh: [],
                  escalationTriggersZh: [],
                },
              },
            },
          };

          const demoNode2: TimelineAssessmentNode = {
            nodeId: 'demo-day-2',
            recordedAt: new Date().toISOString(),
            dayLabelZh: '第 2 天 (今日 14:30)',
            userNote: '體溫燒到 38.3°C，痛點明顯從肚臍移到右下腹，走路震動就很痛',
            requestSnapshot: {
              contextProfile: state.contextProfile,
              regionSymptoms: [
                {
                  regionId: 'abd_rlq',
                  regionNameZh: '右下腹（闌尾／盲腸區｜身體右側）',
                  depthLayer: 'deep_visceral',
                  symptomIds: ['rlq_migrating_sharp_pain', 'rlq_rebound_tenderness'],
                  symptomLabelsZh: [
                    '右下腹持續定點劇痛（或由肚臍周圍轉移至右下腹）',
                    '按壓右下腹放開瞬間劇痛（反彈痛）或走路震動即痛',
                  ],
                  meshTermsEn: ['Appendicitis', 'Peritonitis'],
                },
              ],
              systemicSymptoms: ['fever_high', 'anorexia_nausea'],
              followUp: {
                duration: 'days_1_3',
                severityScore: 8,
                isSuddenOnset: false,
                hasRadiation: true,
                radiationTargetNote: '由肚臍周圍轉移定點至右下腹',
              },
              clientTimestamp: new Date().toISOString(),
            },
            reportSnapshot: {
              redFlag: {
                isRedFlagTriggered: true,
                triggeredRules: [
                  {
                    ruleId: 'RF_ACUTE_RLQ_APPENDICITIS',
                    clinicalCategory: '外科急腹症鑑別（急性闌尾炎／局部腹膜炎）',
                    alertTitleZh: '右下腹定點劇痛、按壓反彈痛且合併發燒',
                    immediateActionZh: '建議立即前往急診或一般外科評估，檢查前暫時禁食禁水。',
                    reasoningZh: '典型由肚臍周圍轉移至右下腹之劇痛合併發燒與反彈痛。',
                  },
                ],
                checkedRulesCount: 7,
                safeMessageZh: '偵測到右下腹急腹症紅旗警訊！',
              },
              triage: {
                triageLevel: 'red_emergency',
                triageTitleZh: '紅燈：建議立即前往急診評估',
                triageSummaryZh: '疼痛分數由 4 分升至 8 分且轉移至右下腹合併高燒。',
                recommendedSpecialties: [
                  {
                    specialtyNameTw: '急診醫學科／一般外科',
                    priority: 'primary',
                    routingReasonZh: '優先排除急性闌尾炎',
                    scoreWeight: 100,
                  },
                ],
              },
              clinical: {
                engineModeUsed: 'deterministic_ebm',
                commonPossibilitiesExpanded: [],
                lessCommonDifferentialCollapsed: [],
                mdtCrossSystemInsightZh: '跨日病程顯示典型闌尾炎轉移痛特徵，請立即就醫。',
                doctorCheatSheet: {
                  summaryText100Words:
                    '【第2天看診摘要】主訴：痛點由肚臍轉移至右下腹[深層內臟:定點劇痛、反彈痛]，新增發燒(≥38°C)與噁心。不適程度由 4 分升至 8/10 分。建議立即評估：急診醫學科／一般外科。',
                  suggestedQuestionsForDoctor: [],
                },
                homeCareAndWatchouts: {
                  generalCareTipsZh: [],
                  escalationTriggersZh: [],
                },
              },
            },
          };

          return {
            timelineNodes: [demoNode1, demoNode2],
          };
        }),

      setInputMode: (mode) => set({ inputMode: mode }),
      setCameraOrientation: (orientation) => set({ cameraOrientation: orientation }),
      toggleCameraOrientation: () =>
        set((state) => ({
          cameraOrientation:
            state.cameraOrientation === 'anterior' ? 'posterior' : 'anterior',
        })),
      triggerCameraReset: () =>
        set((state) => ({ cameraResetTrigger: state.cameraResetTrigger + 1 })),

      setActiveRegion: (regionId) => {
        if (!regionId) {
          set({ activeRegionId: null });
          return;
        }
        const regionDef = BODY_REGION_MAP[regionId];
        set((state) => {
          let nextOrientation = state.cameraOrientation;
          if (regionDef?.viewOrientation === 'posterior') {
            nextOrientation = 'posterior';
          } else if (regionDef?.viewOrientation === 'anterior') {
            nextOrientation = 'anterior';
          }
          return {
            activeRegionId: regionId,
            cameraOrientation: nextOrientation,
          };
        });
      },

      setHoveredRegion: (regionId) => set({ hoveredRegionId: regionId }),

      setRegionDepthLayer: (regionId, depth) =>
        set((state) => {
          const regionDef = BODY_REGION_MAP[regionId];
          if (!regionDef) return state;

          const existing = state.selectedRegions[regionId];
          const updated: SelectedRegionSymptom = existing
            ? { ...existing, depthLayer: depth }
            : {
                regionId,
                regionNameZh: regionDef.nameZh,
                depthLayer: depth,
                symptomIds: [],
                symptomLabelsZh: [],
                meshTermsEn: [],
              };

          return {
            selectedRegions: {
              ...state.selectedRegions,
              [regionId]: updated,
            },
          };
        }),

      toggleRegionSymptom: (regionId, symptomId) =>
        set((state) => {
          const regionDef = BODY_REGION_MAP[regionId];
          const symptomOpt = REGION_SYMPTOM_OPTIONS.find((s) => s.id === symptomId);
          if (!regionDef || !symptomOpt) return state;

          const existing = state.selectedRegions[regionId];
          const currentIds = existing ? existing.symptomIds : [];
          const isAlreadySelected = currentIds.includes(symptomId);

          const nextIds = isAlreadySelected
            ? currentIds.filter((id) => id !== symptomId)
            : [...currentIds, symptomId];

          if (nextIds.length === 0) {
            const copy = { ...state.selectedRegions };
            delete copy[regionId];
            return { selectedRegions: copy };
          }

          const selectedOpts = REGION_SYMPTOM_OPTIONS.filter((s) =>
            nextIds.includes(s.id)
          );
          const nextLabels = selectedOpts.map((s) => s.labelZh);
          const nextMesh = Array.from(
            new Set(selectedOpts.flatMap((s) => s.meshTermsEn))
          );

          const nextDepth: SymptomDepthLayer = existing
            ? existing.depthLayer
            : symptomOpt.recommendedDepth || regionDef.defaultDepthLayer;

          return {
            selectedRegions: {
              ...state.selectedRegions,
              [regionId]: {
                regionId,
                regionNameZh: regionDef.nameZh,
                depthLayer: nextDepth,
                symptomIds: nextIds,
                symptomLabelsZh: nextLabels,
                meshTermsEn: nextMesh,
              },
            },
          };
        }),

      quickAddSymptomFromSearch: (regionId, symptomId) => {
        const state = get();
        state.setActiveRegion(regionId);
        if (symptomId) {
          const existing = state.selectedRegions[regionId];
          if (!existing || !existing.symptomIds.includes(symptomId)) {
            state.toggleRegionSymptom(regionId, symptomId);
          }
        } else {
          const regionSymptoms = REGION_SYMPTOM_OPTIONS.filter(
            (s) => s.regionId === regionId
          );
          if (
            regionSymptoms.length > 0 &&
            !state.selectedRegions[regionId]
          ) {
            state.toggleRegionSymptom(regionId, regionSymptoms[0].id);
          }
        }
      },

      removeSelectedRegion: (regionId) =>
        set((state) => {
          const copy = { ...state.selectedRegions };
          delete copy[regionId];
          return {
            selectedRegions: copy,
            activeRegionId:
              state.activeRegionId === regionId ? null : state.activeRegionId,
          };
        }),

      toggleSystemicSymptom: (symptomId) =>
        set((state) => {
          const exists = state.systemicSymptoms.includes(symptomId);
          return {
            systemicSymptoms: exists
              ? state.systemicSymptoms.filter((id) => id !== symptomId)
              : [...state.systemicSymptoms, symptomId],
          };
        }),

      clearAllSelections: () =>
        set({
          selectedRegions: {},
          systemicSymptoms: [],
          activeRegionId: null,
        }),

      setFollowUpModalOpen: (open) => set({ isFollowUpModalOpen: open }),
      updateFollowUpAnswers: (partial) =>
        set((state) => ({
          followUpAnswers: { ...state.followUpAnswers, ...partial },
        })),
    }),
    {
      name: 'smart-health-assessment-storage-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        contextProfile: state.contextProfile,
        selectedRegions: state.selectedRegions,
        systemicSymptoms: state.systemicSymptoms,
        timelineNodes: state.timelineNodes,
      }),
    }
  )
);
