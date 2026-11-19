'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  ApiConnectionSettings,
  BodyRegionId,
  ClinicalFollowUpParams,
  PatientContextProfile,
  SelectedRegionClinicalRecord,
  SymptomDepthLayer,
  TriggerOrReliefFactorId,
} from '@/types/cdss';
import { BODY_REGION_MAP } from '@/data/bodyRegions';
import {
  DISCOMFORT_QUALITIES_CATALOG,
  REGION_SPECIFIC_SYMPTOMS,
} from '@/data/discomfortQualities';

export type InputViewMode = '3d' | '2d';
export type CameraOrientation = 'anterior' | 'posterior';

interface DiagnosisWorkbenchState {
  // 頂部 API 連線設定條 (Top API Control Bar)
  apiSettings: ApiConnectionSettings;
  updateApiSettings: (partial: Partial<ApiConnectionSettings>) => void;

  // 模組 A：基礎生理情境卡 (Context Profile)
  contextProfile: PatientContextProfile;
  isProfileExpanded: boolean;
  updateContextProfile: (partial: Partial<PatientContextProfile>) => void;
  setProfileExpanded: (expanded: boolean) => void;

  // 模組 B：3D / 2D 雙模式狀態與雙向同步（預設為 2D 快速列表模式）
  inputMode: InputViewMode;
  cameraOrientation: CameraOrientation;
  cameraResetCount: number;
  activeRegionId: BodyRegionId | null;
  hoveredRegionId: BodyRegionId | null;

  // 已選局部部位臨床紀錄（含深度、24項通用不適感性質、部位專屬症狀）
  selectedRegions: Record<string, SelectedRegionClinicalRecord>;

  // 模組 C-2：已選全身性症狀 ID 陣列（涵蓋 7 大系統 53 項）
  systemicSymptomIds: string[];

  // 模組 D：輕量化臨床特徵追問
  followUp: ClinicalFollowUpParams;
  isFollowUpModalOpen: boolean;

  // 視角與模式切換 Actions
  setInputMode: (mode: InputViewMode) => void;
  setCameraOrientation: (orientation: CameraOrientation) => void;
  toggleCameraOrientation: () => void;
  triggerCameraReset: () => void;
  setActiveRegion: (regionId: BodyRegionId | null) => void;
  setHoveredRegion: (regionId: BodyRegionId | null) => void;

  // 部位深度、不適感受與專屬症狀 Actions
  setRegionDepthLayer: (regionId: BodyRegionId, depth: SymptomDepthLayer) => void;
  toggleRegionQuality: (regionId: BodyRegionId, qualityId: string) => void;
  toggleRegionSpecificSymptom: (regionId: BodyRegionId, specificId: string) => void;
  quickSelectFromSearch: (params: {
    regionId?: BodyRegionId;
    qualityId?: string;
    specificId?: string;
    systemicId?: string;
  }) => void;
  removeSelectedRegion: (regionId: BodyRegionId) => void;
  toggleSystemicSymptom: (systemicId: string) => void;
  clearAllClinicalInputs: () => void;

  // 追問 Modal Actions
  setFollowUpModalOpen: (open: boolean) => void;
  updateFollowUp: (partial: Partial<ClinicalFollowUpParams>) => void;
  updateVitalSigns: (partial: Partial<ClinicalFollowUpParams['vitals']>) => void;
  toggleModifyingFactor: (factorId: TriggerOrReliefFactorId) => void;
}

const DEFAULT_API_SETTINGS: ApiConnectionSettings = {
  enabled: false,
  apiKey: '',
  modelId: 'gemini-2.5-flash',
  rememberInLocalStorage: false,
};

const DEFAULT_CONTEXT_PROFILE: PatientContextProfile = {
  ageGroup: '18-39',
  biologicalSex: 'male',
  heightCm: undefined,
  weightKg: undefined,
  pregnancyStatus: 'not_applicable',
  smokingStatus: 'never',
  alcoholHabit: 'none',
  betelNutHabit: 'never',
  exerciseFrequency: 'moderate_1_2_week',
  chronicConditions: [],
  customChronicNote: '',
  drugAndFoodAllergies: '',
  familyHistory: [],
  highRiskMedications: [],
  customMedicationNote: '',
  recentEventsTocc: [],
  customToccNote: '',
  updatedAt: new Date().toISOString(),
};

const DEFAULT_FOLLOW_UP: ClinicalFollowUpParams = {
  onsetPattern: 'gradual_hours_days',
  durationLabelZh: '1 ～ 3 天',
  severityScore: 5,
  modifyingFactors: [],
  radiationNote: '',
  vitals: {},
};

function buildOrCleanupRegionRecord(
  regionId: BodyRegionId,
  depthLayer: SymptomDepthLayer,
  qualityIds: string[],
  specificSymptomIds: string[]
): SelectedRegionClinicalRecord | null {
  if (qualityIds.length === 0 && specificSymptomIds.length === 0) {
    return null;
  }
  const regionDef = BODY_REGION_MAP[regionId];
  if (!regionDef) return null;

  const matchedQualities = DISCOMFORT_QUALITIES_CATALOG.filter((q) =>
    qualityIds.includes(q.id)
  );
  const matchedSpecifics = REGION_SPECIFIC_SYMPTOMS.filter((s) =>
    specificSymptomIds.includes(s.id)
  );

  const meshTermsEn = Array.from(
    new Set([
      ...matchedSpecifics.flatMap((s) => s.meshTermsEn),
      ...matchedQualities.map((q) => q.clinicalTermEn),
    ])
  );

  return {
    regionId,
    regionNameZh: regionDef.nameZh,
    depthLayer,
    qualityIds,
    qualityLabelsZh: matchedQualities.map((q) => q.labelZh),
    specificSymptomIds,
    specificSymptomLabelsZh: matchedSpecifics.map((s) => s.labelZh),
    meshTermsEn,
  };
}

export const useDiagnosisStore = create<DiagnosisWorkbenchState>()(
  persist(
    (set, get) => ({
      apiSettings: DEFAULT_API_SETTINGS,
      updateApiSettings: (partial) =>
        set((state) => {
          const next = { ...state.apiSettings, ...partial };
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem(
                'cdss-api-session-v4',
                JSON.stringify(next)
              );
              if (next.rememberInLocalStorage) {
                localStorage.setItem(
                  'cdss-api-local-v4',
                  JSON.stringify(next)
                );
              } else {
                localStorage.removeItem('cdss-api-local-v4');
              }
            } catch {
              // ignore storage quota errors
            }
          }
          return { apiSettings: next };
        }),

      contextProfile: DEFAULT_CONTEXT_PROFILE,
      isProfileExpanded: false,

      updateContextProfile: (partial) =>
        set((state) => {
          const nextSex =
            partial.biologicalSex ?? state.contextProfile.biologicalSex;
          let nextPreg =
            partial.pregnancyStatus ?? state.contextProfile.pregnancyStatus;
          if (nextSex !== 'female') {
            nextPreg = 'not_applicable';
          } else if (nextPreg === 'not_applicable') {
            nextPreg = 'no';
          }
          return {
            contextProfile: {
              ...DEFAULT_CONTEXT_PROFILE,
              ...state.contextProfile,
              ...partial,
              pregnancyStatus: nextPreg,
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      setProfileExpanded: (expanded) => set({ isProfileExpanded: expanded }),

      inputMode: '2d',
      cameraOrientation: 'anterior',
      cameraResetCount: 0,
      activeRegionId: null,
      hoveredRegionId: null,
      selectedRegions: {},
      systemicSymptomIds: [],
      followUp: DEFAULT_FOLLOW_UP,
      isFollowUpModalOpen: false,

      setInputMode: (mode) => set({ inputMode: mode }),
      setCameraOrientation: (orientation) =>
        set({ cameraOrientation: orientation }),
      toggleCameraOrientation: () =>
        set((state) => ({
          cameraOrientation:
            state.cameraOrientation === 'anterior' ? 'posterior' : 'anterior',
        })),
      triggerCameraReset: () =>
        set((state) => ({ cameraResetCount: state.cameraResetCount + 1 })),

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
          if (!existing) {
            // 若尚未勾選具體感受但切換了深度，預設為該部位啟用一項基礎感受以保留深度設定
            const defaultQuality =
              depth === 'superficial'
                ? 'q_sharp_stabbing'
                : depth === 'musculoskeletal'
                ? 'q_deep_soreness'
                : 'q_dull_ache';
            const rec = buildOrCleanupRegionRecord(
              regionId,
              depth,
              [defaultQuality],
              []
            );
            if (!rec) return state;
            return {
              selectedRegions: {
                ...state.selectedRegions,
                [regionId]: rec,
              },
            };
          }

          return {
            selectedRegions: {
              ...state.selectedRegions,
              [regionId]: {
                ...existing,
                depthLayer: depth,
              },
            },
          };
        }),

      toggleRegionQuality: (regionId, qualityId) =>
        set((state) => {
          const regionDef = BODY_REGION_MAP[regionId];
          if (!regionDef) return state;

          const existing = state.selectedRegions[regionId];
          const currentDepth = existing?.depthLayer || regionDef.defaultDepthLayer;
          const currentQualities = existing?.qualityIds || [];
          const currentSpecifics = existing?.specificSymptomIds || [];

          const nextQualities = currentQualities.includes(qualityId)
            ? currentQualities.filter((id) => id !== qualityId)
            : [...currentQualities, qualityId];

          const nextRecord = buildOrCleanupRegionRecord(
            regionId,
            currentDepth,
            nextQualities,
            currentSpecifics
          );

          const copy = { ...state.selectedRegions };
          if (!nextRecord) {
            delete copy[regionId];
          } else {
            copy[regionId] = nextRecord;
          }
          return { selectedRegions: copy };
        }),

      toggleRegionSpecificSymptom: (regionId, specificId) =>
        set((state) => {
          const regionDef = BODY_REGION_MAP[regionId];
          const specItem = REGION_SPECIFIC_SYMPTOMS.find(
            (s) => s.id === specificId
          );
          if (!regionDef || !specItem) return state;

          const existing = state.selectedRegions[regionId];
          const currentDepth =
            existing?.depthLayer || specItem.defaultDepth || regionDef.defaultDepthLayer;
          const currentQualities = existing?.qualityIds || [];
          const currentSpecifics = existing?.specificSymptomIds || [];

          const nextSpecifics = currentSpecifics.includes(specificId)
            ? currentSpecifics.filter((id) => id !== specificId)
            : [...currentSpecifics, specificId];

          const nextRecord = buildOrCleanupRegionRecord(
            regionId,
            currentDepth,
            currentQualities,
            nextSpecifics
          );

          const copy = { ...state.selectedRegions };
          if (!nextRecord) {
            delete copy[regionId];
          } else {
            copy[regionId] = nextRecord;
          }
          return { selectedRegions: copy };
        }),

      quickSelectFromSearch: ({
        regionId,
        qualityId,
        specificId,
        systemicId,
      }) => {
        const state = get();
        if (systemicId) {
          if (!state.systemicSymptomIds.includes(systemicId)) {
            state.toggleSystemicSymptom(systemicId);
          }
          return;
        }
        if (regionId) {
          state.setActiveRegion(regionId);
          const existing = state.selectedRegions[regionId];
          if (specificId) {
            if (!existing || !existing.specificSymptomIds.includes(specificId)) {
              state.toggleRegionSpecificSymptom(regionId, specificId);
            }
          } else if (qualityId) {
            if (!existing || !existing.qualityIds.includes(qualityId)) {
              state.toggleRegionQuality(regionId, qualityId);
            }
          } else if (!existing) {
            // 僅搜尋部位名稱時，開啟該部位面板並預選第一項常見感受
            state.toggleRegionQuality(regionId, 'q_dull_ache');
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

      toggleSystemicSymptom: (systemicId) =>
        set((state) => {
          const exists = state.systemicSymptomIds.includes(systemicId);
          return {
            systemicSymptomIds: exists
              ? state.systemicSymptomIds.filter((id) => id !== systemicId)
              : [...state.systemicSymptomIds, systemicId],
          };
        }),

      clearAllClinicalInputs: () =>
        set({
          selectedRegions: {},
          systemicSymptomIds: [],
          activeRegionId: null,
        }),

      setFollowUpModalOpen: (open) => set({ isFollowUpModalOpen: open }),
      updateFollowUp: (partial) =>
        set((state) => ({
          followUp: { ...state.followUp, ...partial },
        })),
      updateVitalSigns: (partial) =>
        set((state) => ({
          followUp: {
            ...state.followUp,
            vitals: {
              ...(state.followUp.vitals || {}),
              ...partial,
            },
          },
        })),
      toggleModifyingFactor: (factorId) =>
        set((state) => {
          const exists = state.followUp.modifyingFactors.includes(factorId);
          return {
            followUp: {
              ...state.followUp,
              modifyingFactors: exists
                ? state.followUp.modifyingFactors.filter((f) => f !== factorId)
                : [...state.followUp.modifyingFactors, factorId],
            },
          };
        }),
    }),
    {
      name: 'cdss-clinical-diagnosis-store-v4',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        contextProfile: state.contextProfile,
        selectedRegions: state.selectedRegions,
        systemicSymptomIds: state.systemicSymptomIds,
      }),
    }
  )
);
