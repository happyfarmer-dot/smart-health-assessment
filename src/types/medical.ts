export type AgeGroup = '0-12' | '13-17' | '18-39' | '40-64' | '65+';
export type BiologicalSex = 'male' | 'female' | 'intersex_or_other';
export type PregnancyPossibility = 'no' | 'possible_or_confirmed' | 'not_applicable';

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
  | 'anticoagulants'     // 抗凝血劑 / 抗血小板藥（如阿斯匹靈、保栓通、Warfarin、NOAC）
  | 'immunosuppressants' // 免疫抑制劑 / 長期口服類固醇
  | 'nsaids_regular'     // 長期或近期頻繁使用止痛消炎藥 (NSAIDs)
  | 'insulin_oral_hypo'  // 胰島素或降血糖藥物
  | 'antihypertensives'; // 降血壓藥物

export interface PatientContextProfile {
  ageGroup?: AgeGroup;
  biologicalSex?: BiologicalSex;
  pregnancyStatus?: PregnancyPossibility;
  chronicConditions: ChronicConditionId[];
  highRiskMedications: HighRiskMedicationId[];
  customMedicationNote?: string;
  updatedAt: string;
}

/** 症狀深度層級：作為後端多專科路由的關鍵權重 */
export type SymptomDepthLayer =
  | 'superficial'        // 皮膚表層（紅疹、水泡、表淺刺痛、搔癢、局部紅腫熱）
  | 'musculoskeletal'    // 肌肉與關節（按壓痛、活動或出力時加劇、關節卡頓腫脹、酸痛）
  | 'deep_visceral';     // 身體深層悶痛（內臟悶痛、絞痛、壓迫感、與姿勢無關之深部不適）

/** 24 個 3D/2D 身體分區 ID */
export type BodyRegionId =
  | 'head_cranial'
  | 'face_sensory'
  | 'neck_throat'
  | 'chest_left'
  | 'chest_right'
  | 'upper_back'
  | 'abd_ruq'
  | 'abd_luq'
  | 'abd_epigastric'
  | 'abd_rlq'
  | 'abd_llq'
  | 'lower_back'
  | 'pelvis_groin'
  | 'buttocks_hip'
  | 'shoulder_r'
  | 'shoulder_l'
  | 'upper_arm_elbow_r'
  | 'upper_arm_elbow_l'
  | 'forearm_wrist_hand_r'
  | 'forearm_wrist_hand_l'
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
  defaultDepthLayer: SymptomDepthLayer;
  colloquialKeywords: string[];
  /** 3D 幾何模型空間配置 (x, y, z) 與碰撞框尺寸 */
  meshConfig: {
    position: [number, number, number];
    scale: [number, number, number];
    shape: 'sphere' | 'box' | 'capsule' | 'cylinder';
    rotation?: [number, number, number];
    colorAccent: string;
  };
}

export interface SymptomOption {
  id: string;
  regionId: BodyRegionId;
  labelZh: string;
  recommendedDepth: SymptomDepthLayer;
  colloquialAliases: string[];
  meshTermsEn: string[];
  isHighRiskIndicator?: boolean;
}

/** 單一身體部位的已選症狀項目 */
export interface SelectedRegionSymptom {
  regionId: BodyRegionId;
  regionNameZh: string;
  depthLayer: SymptomDepthLayer;
  symptomIds: string[];
  symptomLabelsZh: string[];
  meshTermsEn: string[];
}

/** 全身性症狀 ID */
export type SystemicSymptomId =
  | 'fever_high'         // 發燒（體溫 ≥ 38.0°C）
  | 'chills_rigors'      // 畏寒、發抖（寒顫）
  | 'night_sweats'       // 夜間盜汗（睡醒衣服濕透）
  | 'general_fatigue'    // 全身極度無力、倦怠
  | 'weight_loss'        // 非刻意之體重異常減輕
  | 'anorexia_nausea'    // 食慾嚴重不振、噁心想吐
  | 'widespread_rash'    // 全身性或多處皮膚起疹
  | 'cold_sweat_pallor'; // 冒冷汗、臉色蒼白

export interface SystemicSymptomDefinition {
  id: SystemicSymptomId;
  labelZh: string;
  descriptionZh: string;
  colloquialAliases: string[];
  meshTermsEn: string[];
  isRedFlagContributor?: boolean;
}

/** 模組 C：輕量化動態追問（4 題核心臨床特徵） */
export type SymptomDuration =
  | 'hours'
  | 'days_1_3'
  | 'weeks_1_2'
  | 'over_1_month';

export interface FollowUpAnswers {
  duration: SymptomDuration;
  severityScore: number;            // 1 ~ 10 分
  isSuddenOnset: boolean;
  hasRadiation: boolean;
  radiationTargetNote?: string;
}

export interface AssessmentRequestPayload {
  contextProfile: PatientContextProfile;
  regionSymptoms: SelectedRegionSymptom[];
  systemicSymptoms: SystemicSymptomId[];
  followUp: FollowUpAnswers;
  clientTimestamp: string;
}


// ==================== Phase 3 & 4: 紅旗規則、多專科路由、SSE 串流報告與時間軸 Schema ====================

export type TriageLevel =
  | 'red_emergency'
  | 'yellow_prompt_outpatient'
  | 'green_routine_observation';

export interface TriggeredRedFlagItem {
  ruleId: string;
  clinicalCategory: string;
  alertTitleZh: string;
  immediateActionZh: string;
  reasoningZh: string;
}

export interface RedFlagEvaluationResult {
  isRedFlagTriggered: boolean;
  triggeredRules: TriggeredRedFlagItem[];
  checkedRulesCount: number;
  safeMessageZh: string;
}

export interface RecommendedSpecialtyItem {
  specialtyNameTw: string; // 符合台灣醫院分科，如「肝膽腸胃科」、「心臟內科」、「一般外科」、「家庭醫學科」
  priority: 'primary' | 'secondary';
  routingReasonZh: string;
  scoreWeight: number;
}

export interface TriageAndSpecialtyResult {
  triageLevel: TriageLevel;
  triageTitleZh: string;
  triageSummaryZh: string;
  recommendedSpecialties: RecommendedSpecialtyItem[];
}

export interface CommonPossibilityItem {
  conditionLabelZh: string; // 嚴禁確定性診斷，使用「可能相關的常見原因：...」
  specialtyPerspectiveZh: string;
  matchingSymptomsZh: string[];
  likelihoodBadge: '最常見相關' | '常見相關';
}

export interface LessCommonDifferentialItem {
  conditionLabelZh: string;
  whyConsiderZh: string;
  whatDoctorMayCheckZh: string;
}

export interface ClinicalAnalysisResult {
  engineModeUsed: 'deterministic_ebm' | 'gemini_grounded_ai';
  commonPossibilitiesExpanded: CommonPossibilityItem[];
  lessCommonDifferentialCollapsed: LessCommonDifferentialItem[];
  mdtCrossSystemInsightZh: string;
  doctorCheatSheet: {
    summaryText100Words: string;
    suggestedQuestionsForDoctor: string[];
  };
  homeCareAndWatchouts: {
    generalCareTipsZh: string[];
    escalationTriggersZh: string[];
  };
}

export type PubMedEvidenceLevel =
  | 'Practice Guideline'
  | 'Meta-Analysis'
  | 'Systematic Review'
  | 'Randomized Controlled Trial'
  | 'Clinical Study';

export interface VerifiedPubMedArticle {
  pmid: string;
  title: string;
  publicationYear: string;
  journalName: string;
  evidenceLevel: PubMedEvidenceLevel;
  pubmedUrl: string;
  plainLanguageTakeawayZh: string;
}

export interface PubMedEvidenceResult {
  status: 'verified_live' | 'pending_phase4' | 'api_unreachable_fallback';
  executedQuery: string;
  articles: VerifiedPubMedArticle[];
  fallbackNoticeZh?: string;
}

/** 4 階段串流事件聯集 */
export type AssessmentSSEEvent =
  | { stage: 1; event: 'red_flag_check'; data: RedFlagEvaluationResult }
  | { stage: 2; event: 'triage_and_specialty'; data: TriageAndSpecialtyResult }
  | { stage: 3; event: 'clinical_analysis'; data: ClinicalAnalysisResult }
  | { stage: 4; event: 'pubmed_evidence'; data: PubMedEvidenceResult };

/** 模組 G：病程時間軸節點 */
export interface TimelineAssessmentNode {
  nodeId: string;
  recordedAt: string;
  dayLabelZh: string;
  userNote?: string;
  requestSnapshot: AssessmentRequestPayload;
  reportSnapshot: {
    redFlag: RedFlagEvaluationResult;
    triage: TriageAndSpecialtyResult;
    clinical: ClinicalAnalysisResult;
    pubmed?: PubMedEvidenceResult;
  };
}
