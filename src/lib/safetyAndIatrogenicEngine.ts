import {
  DiagnosisRequestPayload,
  DiagnosticConfidenceAssessment,
  DifferentialAndAnalysisResult,
  IatrogenicDrugAlertItem,
  PrimaryDiagnosisResult,
  SafetyCheckAlertItem,
  SafetyCheckResult,
  SecondaryDifferentialItem,
  SuspectedDiseaseDiagnosis,
} from '@/types/cdss';
import { evaluateObjectiveVitalSigns } from './vitalSignsEvaluator';

/**
 * 模組 E-1：背景確定性紅旗與危急生命徵象攔截引擎
 */
export function evaluateSilentSafetyCheck(
  payload: DiagnosisRequestPayload
): SafetyCheckResult {
  const vitalEval = evaluateObjectiveVitalSigns(payload.followUp.vitals);
  const alerts: SafetyCheckAlertItem[] = [...vitalEval.criticalAlerts];

  const hasRegion = (id: string) =>
    payload.regionRecords.some((r) => r.regionId === id);
  const hasQuality = (qId: string) =>
    payload.regionRecords.some((r) => r.qualityIds.includes(qId));
  const hasSpecific = (spId: string) =>
    payload.regionRecords.some((r) => r.specificSymptomIds.includes(spId));
  const hasSystemic = (sysId: string) =>
    payload.systemicSymptomIds.includes(sysId);
  const hasDynamicTag = (tag: string) =>
    payload.dynamicAnswers?.answers.some((a) => a.clinicalWeightTag === tag) ||
    false;

  // 1. 急性冠心症 (ACS) / 心肌梗塞 / 主動脈剝離
  if (
    ((hasRegion('chest_left') || hasRegion('chest_right')) &&
      (hasQuality('q_crushing_pressure') ||
        hasSpecific('sp_chest_l_retrosternal_angina') ||
        hasDynamicTag('WEIGHT_CORONARY_ANGINA_ACS')) &&
      (hasSystemic('sys_exertional_dyspnea') ||
        hasSystemic('sys_orthopnea') ||
        hasSpecific('sp_shoulder_l_cardiac_referred') ||
        hasSpecific('sp_arm_l_inner_cardiac_radiation') ||
        payload.followUp.severityScore >= 7)) ||
    hasSpecific('sp_uback_interscapular_tearing') ||
    ((hasRegion('chest_left') || hasRegion('upper_back')) &&
      hasQuality('q_tearing_ripping'))
  ) {
    alerts.push({
      ruleId: 'RF_CARDIOVASCULAR_ACS_DISSECTION',
      suspectedEmergencyConditionZh:
        '疑似急性冠心症（心肌梗塞／不穩定型心絞痛，Acute Coronary Syndrome）或胸主動脈剝離（Aortic Dissection）',
      triggeringEvidenceZh:
        '胸口或上背出現深層重壓緊縮痛／撕裂樣劇痛，或合併左肩臂放射痛、呼吸困難與高疼痛評分',
      immediateActionZh:
        '請立即撥打 119 或由他人護送至急診室，切勿自行駕車；急診需第一時間執行 12 導程心電圖 (ECG)、高敏感度心肌旋轉蛋白 (hs-Troponin) 與胸部電腦斷層血管攝影 (CTA)。',
    });
  }

  // 2. 急性腦中風 / 中樞神經血管與腦膜急症
  if (
    hasSpecific('sp_face_facial_palsy_slurred') ||
    hasSpecific('sp_arm_r_acute_motor_deficit') ||
    hasSpecific('sp_head_thunderclap_explosion') ||
    hasDynamicTag('WEIGHT_CENTRAL_NEURO_EMERGENCY') ||
    (hasRegion('head_cranial') &&
      hasSystemic('sys_high_fever') &&
      hasSpecific('sp_neck_meningeal_stiffness')) ||
    hasSystemic('sys_confusion_slow_response')
  ) {
    alerts.push({
      ruleId: 'RF_NEURO_STROKE_SAH_MENINGITIS',
      suspectedEmergencyConditionZh:
        '疑似急性腦血管病變（腦中風 Acute Stroke／蜘蛛膜下腔出血 SAH）或急性中樞神經感染（Acute Meningitis）',
      triggeringEvidenceZh:
        '出現臉部歪斜口齒不清、單側肢體突發無力、雷擊性爆炸頭痛、高燒伴隨頸部僵硬或意識模糊',
      immediateActionZh:
        '請立即撥打 119 送往具備急診神經影像處置能力之醫院，優先執行腦部無顯影電腦斷層 (Non-contrast Brain CT) 與神經學評估。',
    });
  }

  // 3. 外科急腹症（急性闌尾炎穿孔腹膜炎 / 消化道出血 / 急性胰臟炎）
  if (
    (hasRegion('abd_rlq') &&
      (hasQuality('q_rebound_tenderness') ||
        hasSpecific('sp_rlq_mcburney_migrating') ||
        hasSpecific('sp_rlq_psoas_jarring_pain') ||
        hasDynamicTag('WEIGHT_ACUTE_APPENDICITIS')) &&
      (hasSystemic('sys_high_fever') ||
        hasSystemic('sys_low_grade_fever') ||
        payload.followUp.severityScore >= 7)) ||
    hasSystemic('sys_melena_hematochezia') ||
    hasSpecific('sp_luq_pancreatic_boring_back')
  ) {
    alerts.push({
      ruleId: 'RF_ACUTE_ABDOMEN_GI_BLEED',
      suspectedEmergencyConditionZh:
        '疑似外科急腹症（急性闌尾炎併局部腹膜炎 Acute Appendicitis／急性胰臟炎 Acute Pancreatitis）或消化道活動性出血',
      triggeringEvidenceZh:
        '腹部出現壓痛放開加劇之反彈痛（Blumberg sign）、右下腹轉移定點劇痛併發燒、左上腹穿透後背劇痛，或解黑便／血便',
      immediateActionZh:
        '請儘速前往急診室評估。在醫師完成腹部觸診與影像檢查前請暫時「禁食禁水 (NPO)」，且勿自行服用止痛消炎藥以免掩蓋腹膜炎徵象。',
    });
  }

  // 4. 單側下肢深層靜脈栓塞 (DVT) 併肺栓塞風險（含近期長途飛行／久臥或手術骨折 TOCC 加權）
  const hasImmobilityTocc =
    payload.contextProfile.recentEventsTocc?.includes(
      'long_flight_bedrest_immobility'
    ) ||
    payload.contextProfile.recentEventsTocc?.includes(
      'recent_surgery_trauma_fracture'
    );
  if (
    (hasSpecific('sp_calf_r_unilateral_dvt_swelling') ||
      hasSpecific('sp_calf_l_unilateral_dvt_swelling') ||
      hasDynamicTag('WEIGHT_DVT_VENOUS_THROMBOSIS')) &&
    (hasRegion('chest_left') ||
      hasRegion('chest_right') ||
      hasSystemic('sys_exertional_dyspnea') ||
      hasSystemic('sys_cyanosis') ||
      hasImmobilityTocc)
  ) {
    alerts.push({
      ruleId: 'RF_DVT_PULMONARY_EMBOLISM',
      suspectedEmergencyConditionZh:
        '疑似下肢深層靜脈栓塞（DVT）併發急性肺栓塞（Pulmonary Embolism）高風險',
      triggeringEvidenceZh:
        '單側小腿不對稱腫脹壓痛，且合併胸痛、呼吸急促或近期手術／外傷／長途飛行久臥之血栓危險因子',
      immediateActionZh:
        '請立即前往急診室，切勿推拿或按摩腫脹之下肢，需優先檢驗 D-dimer、下肢靜脈杜卜勒超音波與肺動脈電腦斷層 (CTPA)。',
    });
  }

  // 5. 精神科／身心科危機關懷與緊急支持（自我傷害或輕生念頭）
  if (hasSystemic('sys_psych_self_harm_ideation')) {
    alerts.push({
      ruleId: 'RF_PSYCHIATRIC_SELF_HARM_CARE',
      suspectedEmergencyConditionZh:
        '身心危機關懷與緊急支持（Psychiatric Crisis & Immediate Support）',
      triggeringEvidenceZh:
        '您標記了「自我傷害或輕生念頭」，系統啟動最高優先級之溫暖關懷與專業心理醫療資源提示',
      immediateActionZh:
        '請您務必知道您並不孤單，現在即可撥打衛福部 24 小時免費安心專線「1925（依舊愛我）」、生命線「1995」或張老師「1980」，或由親友陪伴前往各大醫院精神科／身心科急診尋求安全支持。',
    });
  }

  // 6. 眼科急症：急性隅角閉鎖性青光眼 / 視網膜剝離或視網膜中央動脈阻塞（眼中風）
  if (
    hasSpecific('sp_eye_glaucoma_pressure_halo') ||
    hasSpecific('sp_eye_floaters_flashes_retinal') ||
    hasSpecific('sp_eye_blur_sudden_vision_loss')
  ) {
    alerts.push({
      ruleId: 'RF_OPHTHALMOLOGIC_VISION_EMERGENCY',
      suspectedEmergencyConditionZh:
        '疑似眼科視覺急症（急性隅角閉鎖性青光眼 Acute Angle-Closure Glaucoma／視網膜裂孔剝離 Retinal Detachment／視網膜血管阻塞）',
      triggeringEvidenceZh:
        '出現眼球劇烈脹痛伴彩虹光圈嘔吐、飛蚊與閃電閃光暴增或黑幕遮蔽視野、或突發無痛性視力急遽喪失',
      immediateActionZh:
        '請於今日立即前往眼科急診或大型眼科門診進行眼壓測定（Tonometry）與散瞳眼底視網膜檢查，爭取黃金搶救視力時間。',
    });
  }

  // 7. 泌尿科急症：急性陰囊／睪丸劇痛（需黃金 6 小時內排除睪丸扭轉）
  if (hasSpecific('sp_uro_scrotal_testicular_acute_pain')) {
    alerts.push({
      ruleId: 'RF_UROLOGIC_TESTICULAR_TORSION',
      suspectedEmergencyConditionZh:
        '疑似急性陰囊急症（需緊急排除睪丸扭轉 Testicular Torsion 或急性副睪丸炎）',
      triggeringEvidenceZh: '出現單側陰囊或睪丸突發劇烈抽痛與腫大',
      immediateActionZh:
        '睪丸扭轉之黃金搶救時間為發作後 6 小時內，請立即前往急診室安排陰囊彩色杜卜勒超音波（Color Doppler Ultrasound）確認血流。',
    });
  }

  return {
    hasRedFlagAlert: alerts.length > 0,
    alerts,
    vitalSignsAbnormalSummaryZh: vitalEval.abnormalSummaryListZh,
    silentPassSummaryZh:
      alerts.length === 0
        ? '背景急症紅旗與危急生命徵象安全網檢核通過（未偵測到立即致命之紅旗組合）。'
        : `背景安全網偵測到 ${alerts.length} 項需優先排除之急性危急徵象。`,
  };
}

/**
 * 模組 E-2 子引擎：藥源性症狀排查（Iatrogenic Cause Check）
 */
export function evaluateIatrogenicDrugCauses(
  payload: DiagnosisRequestPayload
): IatrogenicDrugAlertItem[] {
  const alerts: IatrogenicDrugAlertItem[] = [];
  const meds = payload.contextProfile.highRiskMedications;
  const hasRegion = (id: string) =>
    payload.regionRecords.some((r) => r.regionId === id);
  const hasSystemic = (id: string) => payload.systemicSymptomIds.includes(id);

  // 1. NSAIDs 消炎止痛藥 / 抗凝血劑 / 類固醇 -> 藥物性胃黏膜損傷、消化性潰瘍或消化道出血
  if (
    (meds.includes('nsaids_regular') ||
      meds.includes('anticoagulants') ||
      meds.includes('systemic_steroids')) &&
    (hasRegion('abd_epigastric') ||
      hasRegion('abd_luq') ||
      hasSystemic('sys_melena_hematochezia') ||
      hasSystemic('sys_nausea'))
  ) {
    alerts.push({
      medicationId: 'nsaids_anticoag_steroid_gi',
      medicationNameZh: '消炎止痛藥 (NSAIDs) ／ 抗凝血抗血小板劑 ／ 類固醇',
      suspectedSideEffectMechanismZh:
        'NSAIDs 與類固醇會抑制胃十二指腸黏膜之前列腺素（Prostaglandin）合成，削弱胃壁保護屏障並導致藥物性胃炎或消化性潰瘍；若併用抗凝血劑則會顯著增加消化道微血管滲血或黑便風險。',
      matchingUserSymptomsZh: [
        ...(hasRegion('abd_epigastric') ? ['中上腹／心窩部不適'] : []),
        ...(hasSystemic('sys_melena_hematochezia') ? ['解黑便或血便'] : []),
        ...(hasSystemic('sys_nausea') ? ['噁心反胃'] : []),
      ],
      clinicalAdviceZh:
        '若正在服用消炎止痛藥建議暫停並諮詢醫師改用不傷胃之替代方案；但若為心血管預防用之「抗凝血／抗血小板藥物」，切勿自行貿然停藥，應攜帶藥單由醫師評估加開質子幫浦抑制劑 (PPI) 保護胃黏膜。',
    });
  }

  // 2. Statins 降血脂藥或紅麴保健品 -> 史他汀相關肌肉病變 (Statin-Associated Muscle Symptoms, SAMS)
  if (
    meds.includes('statins_lipid') &&
    (hasSystemic('sys_generalized_myalgia') ||
      hasSystemic('sys_extreme_fatigue') ||
      hasSystemic('sys_hematuria_tea_urine') ||
      hasRegion('thigh_knee_r') ||
      hasRegion('thigh_knee_l') ||
      hasRegion('shoulder_r') ||
      hasRegion('shoulder_l'))
  ) {
    alerts.push({
      medicationId: 'statins_myopathy',
      medicationNameZh: '降血脂藥（Statins 史他汀類）或紅麴保健品（含 Monacolin K）',
      suspectedSideEffectMechanismZh:
        'Statin 類藥物與紅麴成分可能影響骨骼肌細胞粒線體輔酶 Q10 代謝，引發對稱性近端大肌群（大腿、小腿、肩臂）深層痠痛、無力或抽筋（SAMS），極少數嚴重者若伴隨深茶色尿需排除橫紋肌溶解症。',
      matchingUserSymptomsZh: [
        ...(hasSystemic('sys_generalized_myalgia') ? ['全身肌肉痠痛'] : []),
        ...(hasRegion('thigh_knee_r') || hasRegion('thigh_knee_l')
          ? ['下肢大腿肌群痠痛無力']
          : []),
        ...(hasSystemic('sys_hematuria_tea_urine') ? ['深茶色尿警訊'] : []),
      ],
      clinicalAdviceZh:
        '建議於門診抽血檢測「肌酸磷化酶 (CK / CPK)」與肝腎功能，由醫師評估是否調整降血脂藥劑量或轉換藥物種類。',
    });
  }

  // 3. 降血壓藥 (ACEI 乾咳 / CCB 下肢水腫 / 姿態性低血壓頭暈)
  if (
    meds.includes('antihypertensives') &&
    (hasRegion('neck_throat') ||
      hasRegion('chest_right') ||
      hasSystemic('sys_dizziness_vertigo') ||
      hasSystemic('sys_orthostatic_presyncope') ||
      hasSystemic('sys_general_lower_limb_edema') ||
      hasRegion('calf_ankle_foot_r') ||
      hasRegion('calf_ankle_foot_l'))
  ) {
    alerts.push({
      medicationId: 'antihypertensives_side_effects',
      medicationNameZh: '降血壓藥物（ACEI / ARB / 鈣離子通道阻斷劑 CCB / 利尿劑）',
      suspectedSideEffectMechanismZh:
        'ACEI 類降壓藥會使支氣管緩激肽（Bradykinin）堆積而引起無痰乾咳與喉嚨搔癢；CCB 類（如 Amlodipine）常因周邊小動脈擴張引起雙側腳踝小腿水腫；而降壓過度則易引起起身眼前發黑或頭暈。',
      matchingUserSymptomsZh: [
        ...(hasSystemic('sys_dizziness_vertigo') ||
        hasSystemic('sys_orthostatic_presyncope')
          ? ['頭暈／起身眼前發黑']
          : []),
        ...(hasSystemic('sys_general_lower_limb_edema') ||
        hasRegion('calf_ankle_foot_r')
          ? ['下肢或足踝水腫']
          : []),
        ...(hasRegion('neck_throat') || hasRegion('chest_right')
          ? ['咽喉異物感或乾咳']
          : []),
      ],
      clinicalAdviceZh:
        '請持續記錄每日早晚居家血壓數值，回診時主動告知處方醫師上述症狀，醫師可輕易透過更換不同機轉之降壓藥解除副作用。',
    });
  }

  // 4. 胰島素或口服降血糖藥 -> 藥物性低血糖交感神經與中樞反應
  if (
    meds.includes('insulin_oral_hypo') &&
    (hasSystemic('sys_tremor') ||
      hasSystemic('sys_palpitations_arrhythmia') ||
      hasSystemic('sys_dizziness_vertigo') ||
      hasSystemic('sys_extreme_fatigue') ||
      hasSystemic('sys_confusion_slow_response'))
  ) {
    alerts.push({
      medicationId: 'hypoglycemic_agent_reaction',
      medicationNameZh: '胰島素或口服降血糖藥物（如 Sulfonylureas 等）',
      suspectedSideEffectMechanismZh:
        '當進食量減少、延遲用餐或運動量增加時，降血糖藥物可能使血糖降至 70 mg/dL 以下，刺激腎上腺素釋放引發手抖、心悸、冒汗、飢餓感與頭暈疲倦。',
      matchingUserSymptomsZh: [
        ...(hasSystemic('sys_tremor') ? ['手抖／肢體震顫'] : []),
        ...(hasSystemic('sys_palpitations_arrhythmia') ? ['心悸'] : []),
        ...(hasSystemic('sys_dizziness_vertigo') ? ['頭暈虛弱'] : []),
      ],
      clinicalAdviceZh:
        '發作當下請立即使用血糖機量測指尖血糖；若確認 < 70 mg/dL 請立即補充 15g 速效糖分，並於回診時與新陳代謝科醫師討論調整藥物劑量。',
    });
  }

  return alerts;
}
