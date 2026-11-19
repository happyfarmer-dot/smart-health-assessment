import {
  AssessmentRequestPayload,
  RedFlagEvaluationResult,
  TriggeredRedFlagItem,
} from '@/types/medical';

interface RedFlagRuleDefinition {
  ruleId: string;
  clinicalCategory: string;
  alertTitleZh: string;
  immediateActionZh: string;
  reasoningZh: string;
  match: (payload: AssessmentRequestPayload) => boolean;
}

function hasRegion(payload: AssessmentRequestPayload, regionId: string): boolean {
  return payload.regionSymptoms.some((r) => r.regionId === regionId);
}

function hasSymptomId(payload: AssessmentRequestPayload, symptomId: string): boolean {
  return payload.regionSymptoms.some((r) => r.symptomIds.includes(symptomId));
}

function hasSystemic(payload: AssessmentRequestPayload, sysId: string): boolean {
  return payload.systemicSymptoms.includes(sysId as any);
}

export const RED_FLAG_RULES: RedFlagRuleDefinition[] = [
  // 1. 急性冠心症 / 心肌梗塞 / 主動脈剝離
  {
    ruleId: 'RF_ACS_AORTIC',
    clinicalCategory: '心血管急症鑑別（急性冠心症／主動脈剝離）',
    alertTitleZh: '胸口深層不適合併高風險徵兆（呼吸困難／冒冷汗／放射痛）',
    immediateActionZh:
      '請立即前往急診室或撥打 119 送醫，切勿自行開車或騎車前往。在醫護人員評估前請保持靜臥休息。',
    reasoningZh:
      '左胸或胸口深層壓迫悶痛若合併呼吸困難、冒冷汗、上背撕裂痛，或疼痛延伸至左肩／左上臂／下巴，在現代實證西醫中需優先透過急診 12 導程心電圖與心肌酵素抽血排除急性冠狀動脈問題或大血管急症。',
    match: (p) => {
      const hasChestDeep = p.regionSymptoms.some(
        (r) =>
          (r.regionId === 'chest_left' || r.regionId === 'chest_right') &&
          (r.depthLayer === 'deep_visceral' ||
            r.symptomIds.includes('chest_l_crushing_pain') ||
            r.symptomIds.includes('chest_l_dyspnea'))
      );
      const hasBackTear = hasSymptomId(p, 'uback_tearing_pain');
      if (hasBackTear && (p.followUp.isSuddenOnset || p.followUp.severityScore >= 7)) {
        return true;
      }
      if (!hasChestDeep) return false;

      const hasDyspnea = hasSymptomId(p, 'chest_l_dyspnea');
      const hasColdSweat = hasSystemic(p, 'cold_sweat_pallor');
      const hasRadiation =
        p.followUp.hasRadiation ||
        hasSymptomId(p, 'shoulder_l_cardiac_referred') ||
        hasSymptomId(p, 'arm_l_inner_radiation') ||
        hasSymptomId(p, 'face_jaw_radiation');
      const isHighRiskCardioContext =
        (p.contextProfile.ageGroup === '40-64' ||
          p.contextProfile.ageGroup === '65+') &&
        (p.contextProfile.chronicConditions.includes('hypertension') ||
          p.contextProfile.chronicConditions.includes('diabetes') ||
          p.contextProfile.chronicConditions.includes('coronary_heart_dis')) &&
        p.followUp.severityScore >= 7;

      return hasDyspnea || hasColdSweat || hasRadiation || isHighRiskCardioContext;
    },
  },

  // 2. 急性腦中風 FAST 徵兆
  {
    ruleId: 'RF_STROKE_FAST',
    clinicalCategory: '急性中樞神經血管急症（腦中風 FAST 徵兆）',
    alertTitleZh: '臉部不對稱、口齒不清或單側肢體突發無力麻木',
    immediateActionZh:
      '請立即撥打 119 送往具備急性腦中風處置能力之醫院急診，並記下「最後一次看到正常狀態的時間」。',
    reasoningZh:
      '單側臉麻嘴歪、講話不清或單側手腳突然無力，為典型神經學急性警訊（FAST），及早由急診進行腦部電腦斷層評估對預後至關重要。',
    match: (p) => {
      const hasFaceFast = hasSymptomId(p, 'face_droop_numbness');
      const hasUnilateralLimbWeakness =
        hasSymptomId(p, 'arm_r_sudden_weakness') ||
        hasSymptomId(p, 'arm_l_sudden_weakness') ||
        hasSymptomId(p, 'knee_r_sudden_weakness') ||
        hasSymptomId(p, 'knee_l_sudden_weakness');

      return (
        hasFaceFast ||
        (hasUnilateralLimbWeakness &&
          (p.followUp.isSuddenOnset || p.followUp.severityScore >= 6))
      );
    },
  },

  // 3. 雷擊性劇烈頭痛 / 腦膜炎警訊
  {
    ruleId: 'RF_THUNDERCLAP_MENINGITIS',
    clinicalCategory: '神經急症鑑別（蜘蛛膜下腔出血／急性中樞神經感染）',
    alertTitleZh: '突發雷擊般爆炸性頭痛，或頭痛合併高燒與頸部僵硬',
    immediateActionZh:
      '請立即由家人陪同前往急診室或撥打 119 進行腦部影像與神經學檢查。',
    reasoningZh:
      '在數秒至數分鐘內達到最高痛感的「雷擊性頭痛」，或頭痛同時伴隨高燒（≥38°C）與頸部僵硬無法低頭，屬於必須由急診優先排除腦血管出血或腦膜發炎的紅旗警訊。',
    match: (p) => {
      const hasHead = hasRegion(p, 'head_cranial');
      const hasThunderclap =
        hasSymptomId(p, 'head_thunderclap') ||
        (hasHead && p.followUp.isSuddenOnset && p.followUp.severityScore >= 8);
      const hasMeningealTriad =
        hasHead &&
        hasSystemic(p, 'fever_high') &&
        hasSymptomId(p, 'neck_stiff_meningeal');

      return hasThunderclap || hasMeningealTriad;
    },
  },

  // 4. 右下腹劇痛 / 反彈痛 / 合併發燒（急性闌尾炎與腹膜炎風險）
  {
    ruleId: 'RF_ACUTE_RLQ_APPENDICITIS',
    clinicalCategory: '外科急腹症鑑別（急性闌尾炎／局部腹膜炎）',
    alertTitleZh: '右下腹定點劇痛、按壓反彈痛或合併發燒',
    immediateActionZh:
      '建議儘速前往急診或一般外科門診評估。在醫師檢查前請暫時「禁食禁水」，並避免自行服用強效止痛退燒藥以免掩蓋腹部觸診徵象。',
    reasoningZh:
      '右下腹深層疼痛若伴隨按壓放開瞬間的反彈痛、由肚臍周圍轉移至右下腹，或合併發燒與嚴重疼痛（≥7分），需優先由醫師透過觸診、抽血與腹部超音波／電腦斷層排除急性闌尾炎。',
    match: (p) => {
      const hasRLQ = hasRegion(p, 'abd_rlq');
      if (!hasRLQ) return false;

      const hasRebound = hasSymptomId(p, 'rlq_rebound_tenderness');
      const hasMigratingSharp = hasSymptomId(p, 'rlq_migrating_sharp_pain');
      const hasFever = hasSystemic(p, 'fever_high');
      const isSevere = p.followUp.severityScore >= 7;

      return (
        hasRebound ||
        (hasMigratingSharp && (hasFever || isSevere)) ||
        (hasRLQ && hasFever && isSevere)
      );
    },
  },

  // 5. 上消化道出血或抗凝血劑高危出血警訊
  {
    ruleId: 'RF_GI_BLEED_ANTICOAG',
    clinicalCategory: '消化道出血／高風險抗凝血用藥警示',
    alertTitleZh: '疑似消化道出血徵象（黑便／吐血）或服用抗凝血劑期間之急性劇痛',
    immediateActionZh:
      '請立即前往急診就醫，並攜帶您目前服用的藥物清單（特別是抗凝血劑或消炎止痛藥）供急診醫師評估。',
    reasoningZh:
      '解黑色柏油便或吐血代表上消化道可能有活動性出血；若同時正在服用抗凝血劑或抗血小板藥物，更需立即由急診監測血紅素與凝血功能。',
    match: (p) => {
      const hasTarryBlood = hasSymptomId(p, 'epi_tarry_stool_blood');
      const onAnticoag =
        p.contextProfile.highRiskMedications.includes('anticoagulants');

      if (hasTarryBlood) return true;
      if (
        onAnticoag &&
        (hasRegion(p, 'head_cranial') ||
          hasRegion(p, 'abd_epigastric') ||
          hasRegion(p, 'abd_ruq') ||
          hasRegion(p, 'abd_rlq')) &&
        p.followUp.severityScore >= 7
      ) {
        return true;
      }
      return false;
    },
  },

  // 6. 生理女性可能懷孕期間之急腹症（子宮外孕破裂風險）
  {
    ruleId: 'RF_ECTOPIC_PREGNANCY',
    clinicalCategory: '婦產科急症鑑別（疑似子宮外孕或孕期急腹症）',
    alertTitleZh: '可能懷孕期間出現下腹／單側下腹劇痛或異常出血',
    immediateActionZh:
      '請立即前往設有婦產科急診之醫院就醫，並主動告知醫護人員「目前可能懷孕或已懷孕」。',
    reasoningZh:
      '育齡女性於可能懷孕期間若出現右下腹、左下腹或恥骨上深層疼痛合併陰道出血、頭暈或冒冷汗，必須第一時間由婦產科透過超音波排除子宮外孕或黃體囊腫破裂。',
    match: (p) => {
      const isPregnantPossible =
        p.contextProfile.biologicalSex === 'female' &&
        p.contextProfile.pregnancyStatus === 'possible_or_confirmed';
      if (!isPregnantPossible) return false;

      const hasLowerAbd =
        hasRegion(p, 'abd_rlq') ||
        hasRegion(p, 'abd_llq') ||
        hasRegion(p, 'pelvis_groin');
      const hasGyneBleed = hasSymptomId(p, 'pelvis_gyne_bleeding_pain');
      const hasColdSweat = hasSystemic(p, 'cold_sweat_pallor');

      return (
        hasLowerAbd &&
        (hasGyneBleed || hasColdSweat || p.followUp.severityScore >= 6)
      );
    },
  },

  // 7. 單側小腿腫痛合併呼吸困難（深層靜脈栓塞併肺栓塞風險）
  {
    ruleId: 'RF_DVT_PE',
    clinicalCategory: '血管栓塞急症鑑別（下肢深層靜脈栓塞 DVT 併肺栓塞風險）',
    alertTitleZh: '單側小腿明顯腫脹疼痛，且合併胸悶或呼吸不順',
    immediateActionZh:
      '請立即前往急診室評估，切勿用力按摩或揉捏腫脹的小腿，以免血栓脫落。',
    reasoningZh:
      '單側（左腿或右腿不對稱）小腿紅腫緊繃壓痛為下肢深層靜脈栓塞（DVT）典型表現；若同時出現胸痛或喘，需立即由急診排除血栓回流至肺部血管之風險。',
    match: (p) => {
      const hasRightDvt = hasSymptomId(p, 'calf_r_dvt_swelling');
      const hasLeftDvt = hasSymptomId(p, 'calf_l_dvt_swelling');
      const isUnilateralDvt =
        (hasRightDvt && !hasLeftDvt) || (hasLeftDvt && !hasRightDvt);
      const hasChestOrDyspnea =
        hasRegion(p, 'chest_left') ||
        hasRegion(p, 'chest_right') ||
        hasSymptomId(p, 'chest_l_dyspnea');

      return isUnilateralDvt && hasChestOrDyspnea;
    },
  },
];

/**
 * 模組 D：確定性急症紅旗攔截引擎（純函數，於呼叫任何 LLM 前毫秒級執行）
 */
export function evaluateRedFlags(
  payload: AssessmentRequestPayload
): RedFlagEvaluationResult {
  const triggered: TriggeredRedFlagItem[] = [];

  for (const rule of RED_FLAG_RULES) {
    if (rule.match(payload)) {
      triggered.push({
        ruleId: rule.ruleId,
        clinicalCategory: rule.clinicalCategory,
        alertTitleZh: rule.alertTitleZh,
        immediateActionZh: rule.immediateActionZh,
        reasoningZh: rule.reasoningZh,
      });
    }
  }

  return {
    isRedFlagTriggered: triggered.length > 0,
    triggeredRules: triggered,
    checkedRulesCount: RED_FLAG_RULES.length,
    safeMessageZh:
      triggered.length === 0
        ? `已完成 ${RED_FLAG_RULES.length} 項急症紅旗規則篩檢（心血管、腦中風 FAST、雷擊頭痛、急性闌尾炎、消化道出血、婦科急腹症、靜脈栓塞），目前未發現需立即撥打 119 之典型危急組合。`
        : `偵測到 ${triggered.length} 項需優先排除之急症紅旗警訊，請優先遵循下方緊急就醫指引！`,
  };
}
