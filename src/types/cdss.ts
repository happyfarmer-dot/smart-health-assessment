export type AgeGroup = '0-12' | '13-17' | '18-39' | '40-64' | '65+';
export type BiologicalSex = 'male' | 'female' | 'intersex_or_other';
export type PregnancyPossibility = 'no' | 'possible_or_confirmed' | 'not_applicable';

export type SmokingStatus = 'never' | 'former' | 'current';
export type AlcoholHabit = 'none' | 'social_occasional' | 'regular_heavy';
export type BetelNutHabit = 'never' | 'former_or_current';
export type ExerciseFrequency =
  | 'sedentary'
  | 'moderate_1_2_week'
  | 'active_3_plus_week';

export type FamilyHistoryConditionId =
  | 'cvd_coronary'       // 心血管疾病 / 冠心病
  | 'stroke'             // 腦中風
  | 'diabetes'           // 糖尿病
  | 'cancer'             // 惡性腫瘤（癌症）
  | 'autoimmune';        // 自體免疫疾病

export type RecentEventToccId =
  | 'recent_surgery_trauma_fracture' // 近 1 個月內手術／外傷／骨折
  | 'long_flight_bedrest_immobility' // 長途飛行、久坐不動或長期臥床（深部靜脈栓塞／肺栓塞風險）
  | 'recent_travel_infectious_contact'; // 近期國內外旅遊史、山林蚊蟲叮咬或傳染病接觸史

export type ChronicConditionId =
  | 'hypertension'       // 高血壓
  | 'diabetes'           // 糖尿病
  | 'hyperlipidemia'     // 高血脂
  | 'asthma_copd'        // 氣喘或慢性阻塞性肺病
  | 'coronary_heart_dis' // 冠狀動脈心臟病 / 心律不整
  | 'chronic_kidney_dis' // 慢性腎臟病
  | 'liver_disease'      // 慢性肝病 / 肝硬化
  | 'peptic_ulcer_gerd'  // 胃潰瘍 / 胃食道逆流病史
  | 'autoimmune_disease' // 自體免疫疾病
  | 'cancer_history';    // 惡性腫瘤病史

export type HighRiskMedicationId =
  | 'anticoagulants'     // 抗凝血劑 / 抗血小板藥（阿斯匹靈、保栓通、Warfarin、NOAC）
  | 'immunosuppressants' // 免疫抑制劑
  | 'systemic_steroids'  // 類固醇（長期口服或注射）
  | 'antihypertensives'  // 降血壓藥（如 ACEI / ARB / CCB / 利尿劑）
  | 'statins_lipid'      // 降血脂藥（Statins 史他汀類 / 紅麴保健品）
  | 'nsaids_regular'     // 消炎止痛藥 (NSAIDs)
  | 'insulin_oral_hypo'  // 胰島素或口服降血糖藥
  | 'supplements_herbal';// 常規保健品（魚油、銀杏、高劑量維生素等）

export interface PatientContextProfile {
  // 1. 基本體態
  ageGroup?: AgeGroup;
  exactAge?: number;
  biologicalSex?: BiologicalSex;
  heightCm?: number;
  weightKg?: number;
  pregnancyStatus?: PregnancyPossibility;

  // 2. 生活與風險習慣
  smokingStatus?: SmokingStatus;
  alcoholHabit?: AlcoholHabit;
  betelNutHabit?: BetelNutHabit;
  exerciseFrequency?: ExerciseFrequency;

  // 3. 病史、過敏與家族史
  chronicConditions: ChronicConditionId[];
  customChronicNote?: string;
  drugAndFoodAllergies?: string;
  familyHistory: FamilyHistoryConditionId[];

  // 4. 目前用藥與保健品
  highRiskMedications: HighRiskMedicationId[];
  customMedicationNote?: string;

  // 5. 近期特殊事件 (TOCC 與病程背景)
  recentEventsTocc: RecentEventToccId[];
  customToccNote?: string;

  updatedAt: string;
}

/** 頂部 API 連線設定條狀態 */
export type GeminiModelOption =
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'gemini-2.0-flash';

export interface ApiConnectionSettings {
  enabled: boolean;
  apiKey: string;
  modelId: GeminiModelOption;
  rememberInLocalStorage: boolean;
}

/** 症狀深度層級 */
export type SymptomDepthLayer =
  | 'superficial'        // 皮膚表層
  | 'musculoskeletal'    // 肌肉與關節
  | 'deep_visceral';     // 身體深層（內臟或深部組織）

/**
 * 32 個全身無死角 3D/2D 解剖分區 ID
 * - 頭頸與五官細分為 8 區：頭顱頭皮、眼部、耳部、鼻與鼻竇、口腔牙齒下顎、喉嚨咽喉、臉部皮膚顏面、頸部甲狀腺頸椎
 * - 胸背軀幹含乳房與乳腺區
 * - 腹部保留五分區
 * - 下背骨盆與私密排泄含：下背腎區、下腹骨盆鼠蹊、臀部坐骨神經、生殖泌尿會陰區、肛門與直腸區
 */
export type BodyRegionId =
  // 1. 頭頸與五官 (8 區)
  | 'head_cranial'
  | 'eye_orbital'
  | 'ear_auditory'
  | 'nose_sinus'
  | 'oral_dental_jaw'
  | 'neck_throat'
  | 'face_sensory'
  | 'neck_cervical_thyroid'
  // 2. 胸部、乳房與上背 (4 區)
  | 'chest_left'
  | 'chest_right'
  | 'breast_mammary'
  | 'upper_back'
  // 3. 腹部精細五分區 (5 區)
  | 'abd_ruq'
  | 'abd_luq'
  | 'abd_epigastric'
  | 'abd_rlq'
  | 'abd_llq'
  // 4. 下背、骨盆與私密排泄區 (5 區)
  | 'lower_back'
  | 'pelvis_groin'
  | 'buttocks_hip'
  | 'urogenital_perineal'
  | 'anal_rectal'
  // 5. 上肢 (6 區)
  | 'shoulder_r'
  | 'shoulder_l'
  | 'upper_arm_elbow_r'
  | 'upper_arm_elbow_l'
  | 'forearm_wrist_hand_r'
  | 'forearm_wrist_hand_l'
  // 6. 下肢 (4 區)
  | 'thigh_knee_r'
  | 'thigh_knee_l'
  | 'calf_ankle_foot_r'
  | 'calf_ankle_foot_l';

export type BodyGroupCategory =
  | 'head_neck'
  | 'chest_back'
  | 'abdomen_five'
  | 'lower_back_pelvis'
  | 'upper_limbs'
  | 'lower_limbs';

export type AnatomicalSide = 'patient_right' | 'patient_left' | 'midline';
export type ViewOrientation = 'anterior' | 'posterior' | 'both';

export interface BodyRegionDefinition {
  id: BodyRegionId;
  nameZh: string;
  shortNameZh: string;
  lateralityLabelZh: string;
  side: AnatomicalSide;
  group: BodyGroupCategory;
  groupNameZh: string;
  viewOrientation: ViewOrientation;
  clinicalFocusZh: string;
  primarySpecialtiesTw: string[];
  defaultDepthLayer: SymptomDepthLayer;
  colloquialKeywords: string[];
  meshConfig: {
    position: [number, number, number];
    scale: [number, number, number];
    shape: 'sphere' | 'box' | 'capsule' | 'cylinder';
    rotation?: [number, number, number];
    colorAccent: string;
  };
}

/** 模組 C-1：通用「不適感與疼痛性質」3 大分類 */
export type DiscomfortQualityCategory =
  | 'pain_qualities'
  | 'abnormal_sensations'
  | 'structural_functional';

export interface DiscomfortQualityItem {
  id: string;
  category: DiscomfortQualityCategory;
  labelZh: string;
  clinicalTermEn: string;
  colloquialAliases: string[];
  isRedFlagWeight?: boolean;
}

/** 各部位專屬臨床症狀項目 */
export interface RegionSpecificSymptomItem {
  id: string;
  regionId: BodyRegionId;
  labelZh: string;
  defaultDepth: SymptomDepthLayer;
  colloquialAliases: string[];
  meshTermsEn: string[];
  isRedFlagWeight?: boolean;
}

/** 單一部位已選取的完整臨床資料 */
export interface SelectedRegionClinicalRecord {
  regionId: BodyRegionId;
  regionNameZh: string;
  depthLayer: SymptomDepthLayer;
  qualityIds: string[];
  qualityLabelsZh: string[];
  specificSymptomIds: string[];
  specificSymptomLabelsZh: string[];
  meshTermsEn: string[];
}

/** 模組 C-2：高完整度「全身性症狀」7 大系統分類（新增獨立精神科／身心科與睡眠分類） */
export type SystemicCategoryKey =
  | 'temp_metabolic'
  | 'psychiatry_sleep'
  | 'neuro_psychiatric'
  | 'cardio_respiratory'
  | 'gi_excretory'
  | 'skin_mucosa_appearance'
  | 'immune_lymphatic';

export interface SystemicSymptomItem {
  id: string;
  categoryId: SystemicCategoryKey;
  labelZh: string;
  colloquialAliases: string[];
  meshEn: string;
  isRedFlagWeight?: boolean;
}

export interface SystemicCategoryGroup {
  categoryId: SystemicCategoryKey;
  categoryNameZh: string;
  subtitleZh: string;
  items: SystemicSymptomItem[];
}

/** 模組 D-1：基礎病程與客觀生命徵象 */
export type OnsetPattern =
  | 'sudden_acute'          // 突發劇烈
  | 'gradual_hours_days'    // 數小時至數天漸進
  | 'chronic_weeks_months'; // 數天至數週慢性演變

export type TriggerOrReliefFactorId =
  | 'worse_after_meal_fatty' // 飯後或油膩飲食後加劇
  | 'worse_on_empty_stomach' // 空腹或半夜加劇
  | 'worse_with_exertion'    // 活動或運動時加劇
  | 'worse_with_deep_breath' // 深呼吸或咳嗽時加劇
  | 'worse_when_lying_flat'  // 平躺時加劇（坐起前傾緩解）
  | 'worse_with_posture_press'// 按壓或姿勢改變時加劇
  | 'relieved_by_rest'       // 休息靜臥後緩解
  | 'relieved_by_bowel_gas'; // 排便或排氣後緩解

export interface ObjectiveVitalSigns {
  temperatureC?: number;
  systolicBp?: number;
  diastolicBp?: number;
  heartRateBpm?: number;
  spo2Pct?: number;
  bloodGlucoseMgDl?: number;
  glucoseTiming?: 'fasting' | 'postprandial';
}

export interface ClinicalFollowUpParams {
  onsetPattern: OnsetPattern;
  durationLabelZh: string;
  severityScore: number;            // 1 ~ 10 分
  modifyingFactors: TriggerOrReliefFactorId[];
  radiationNote?: string;
  vitals: ObjectiveVitalSigns;
}

/** 模組 D-2：AI 動態鑑別追問 (Hypothesis-Driven Follow-up) */
export interface DynamicFollowUpQuestion {
  questionId: string;
  targetHypothesisZh: string;
  questionTextZh: string;
  options: Array<{
    optionId: string;
    labelZh: string;
    clinicalWeightTag: string;
  }>;
}

export interface DynamicFollowUpAnswerItem {
  questionId: string;
  questionTextZh: string;
  selectedOptionId: string;
  selectedOptionLabelZh: string;
  clinicalWeightTag: string;
}

export interface DiagnosisRequestPayload {
  contextProfile: PatientContextProfile;
  regionRecords: SelectedRegionClinicalRecord[];
  systemicSymptomIds: string[];
  followUp: ClinicalFollowUpParams;
  dynamicAnswers?: {
    wasSkipped: boolean;
    answers: DynamicFollowUpAnswerItem[];
  };
  clientTimestamp: string;
}

// ==================== Phase 3 & 4: 臨床疾病鑑別診斷報告與 SSE 事件 Schema ====================

export interface SafetyCheckAlertItem {
  ruleId: string;
  suspectedEmergencyConditionZh: string;
  triggeringEvidenceZh: string;
  immediateActionZh: string;
}

export interface SafetyCheckResult {
  hasRedFlagAlert: boolean;
  alerts: SafetyCheckAlertItem[];
  vitalSignsAbnormalSummaryZh: string[];
  silentPassSummaryZh: string;
}

export interface DiagnosticConfidenceAssessment {
  confidenceLevel:
    | '高信心度 (High Specificity)'
    | '中度信心度 (Moderate Specificity)'
    | '低信心度 (Non-Specific / Early Stage)';
  specificityScorePct: number;
  assessmentRationaleZh: string;
  missingInformationToNarrowDownZh: string[];
}

export interface IatrogenicDrugAlertItem {
  medicationId: string;
  medicationNameZh: string;
  suspectedSideEffectMechanismZh: string;
  matchingUserSymptomsZh: string[];
  clinicalAdviceZh: string;
}

export interface SuspectedDiseaseDiagnosis {
  diseaseId: string;
  diseaseNameZh: string;
  diseaseNameEn: string;
  probabilityLevel: '高度懷疑 (High Likelihood)' | '中度懷疑 (Moderate Likelihood)';
  clinicalMatchScorePct: number;
  involvedSpecialtiesTw: string[];
  clinicalReasoning: {
    supportingEvidenceZh: string[];
    unsupportingOrLackingEvidenceZh: string[];
  };
  pathophysiologyPlainZh: string;
  confirmatoryDiagnosticTests: Array<{
    testNameZh: string;
    expectedFindingOrPurposeZh: string;
  }>;
}

export interface PrimaryDiagnosisResult {
  diagnosticConfidence: DiagnosticConfidenceAssessment;
  topSuspectedDiseases: SuspectedDiseaseDiagnosis[];
  iatrogenicAlerts: IatrogenicDrugAlertItem[];
}

export interface SecondaryDifferentialItem {
  diseaseNameZh: string;
  diseaseNameEn: string;
  whyConsiderToRuleOutZh: string;
  keyRuleOutTestZh: string;
}

export interface DifferentialAndAnalysisResult {
  secondaryDifferentialsCollapsed: SecondaryDifferentialItem[];
  mdtCrossSpecialtyAnalysis: {
    participatingSpecialtiesTw: string[];
    referredPainAndSystemicLinkZh: string;
    vitalsAndContextWeightAnalysisZh: string;
  };
  supplementaryGuidance: {
    recommendedDepartmentsTw: string[];
    nonPharmacologicalReliefZh: string[];
    escalationRedFlagsZh: string[];
  };
}

export type EvidenceLevelTag =
  | 'Practice Guideline'
  | 'Meta-Analysis'
  | 'Systematic Review'
  | 'RCT'
  | 'Observational';

export interface VerifiedPubMedItem {
  pmid: string;
  title: string;
  publicationYear: string;
  journalName: string;
  evidenceLevel: EvidenceLevelTag;
  pubmedUrl: string;
  plainClinicalTakeawayZh: string;
}

export interface PubMedResearchResult {
  status: 'verified_live' | 'pending_connection';
  executedQuery: string;
  articles: VerifiedPubMedItem[];
  fallbackNoticeZh?: string;
}

export type DiagnosisSSEEvent =
  | { event: 'safety_check'; data: SafetyCheckResult }
  | { event: 'primary_diagnosis'; data: PrimaryDiagnosisResult }
  | { event: 'differential_and_analysis'; data: DifferentialAndAnalysisResult }
  | { event: 'pubmed_research'; data: PubMedResearchResult };
