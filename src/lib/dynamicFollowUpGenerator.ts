import {
  DiagnosisRequestPayload,
  DynamicFollowUpQuestion,
} from '@/types/cdss';

/**
 * 模組 D-2：AI 動態鑑別追問生成器（Hypothesis-Driven Follow-up Generator）
 * 根據使用者目前已選的解剖部位、深度、24 項不適感受、44 項全身症狀與 D-1 生命徵象，
 * 動態鎖定目前最需區分的潛在鑑別診斷，生成 2～3 題「關鍵區分題（單選／是非題）」。
 */
export function generateHypothesisDrivenQuestions(
  payload: Pick<
    DiagnosisRequestPayload,
    'contextProfile' | 'regionRecords' | 'systemicSymptomIds' | 'followUp'
  >
): {
  clinicalContextSummaryZh: string;
  questions: DynamicFollowUpQuestion[];
} {
  const questions: DynamicFollowUpQuestion[] = [];
  const regionIds = payload.regionRecords.map((r) => r.regionId);

  const hasRegion = (id: string) => regionIds.includes(id as any);

  // 1. 右上腹 (abd_ruq) 或中上腹 (abd_epigastric) 鑑別追問：膽道疾病 vs 消化性潰瘍 vs 急性胰臟炎
  if (hasRegion('abd_ruq') || hasRegion('abd_epigastric') || hasRegion('abd_luq')) {
    questions.push({
      questionId: 'dfq_upper_abd_meal_biliary',
      targetHypothesisZh:
        '旨在區分【急性膽囊炎／膽結石絞痛】、【胃十二指腸消化性潰瘍】與【急性胰臟炎】',
      questionTextZh:
        '請問您的上腹部疼痛與「進食時間或食物種類」是否有明顯關聯？或伴隨疼痛放射至後背／右肩胛？',
      options: [
        {
          optionId: 'opt_fatty_ruq_shoulder',
          labelZh: '進食油膩食物後 30～60 分鐘明顯誘發或加劇，且可能延伸至右肩胛或右上背',
          clinicalWeightTag: 'WEIGHT_BILIARY_CHOLECYSTITIS',
        },
        {
          optionId: 'opt_hunger_night_ulcer',
          labelZh: '空腹飢餓或半夜時最痛（吃一點東西或喝水可稍微緩解），或伴隨胃酸逆流火燒心',
          clinicalWeightTag: 'WEIGHT_PEPTIC_ULCER_GERD',
        },
        {
          optionId: 'opt_boring_back_pancreas',
          labelZh: '持續劇烈鑽頂痛並直接穿透至正後背，平躺時更痛、身體前傾抱膝時稍緩解',
          clinicalWeightTag: 'WEIGHT_ACUTE_PANCREATITIS',
        },
        {
          optionId: 'opt_none_upper_abd',
          labelZh: '與進食無明顯固定關聯，主要為陣發性腸鳴絞痛或腹脹',
          clinicalWeightTag: 'WEIGHT_GASTROENTERITIS_FUNCTIONAL',
        },
      ],
    });
  }

  // 2. 右下腹 (abd_rlq) 或左下腹/骨盆 (abd_llq / pelvis_groin) 鑑別追問：急性闌尾炎 vs 泌尿道結石/感染 vs 腸道/婦科疾病
  if (hasRegion('abd_rlq') || hasRegion('abd_llq') || hasRegion('pelvis_groin')) {
    questions.push({
      questionId: 'dfq_lower_abd_appendicitis_uro',
      targetHypothesisZh:
        '旨在區分【急性闌尾炎（盲腸炎）】、【輸尿管結石／泌尿道感染】與【結腸憩室炎／腸躁症】',
      questionTextZh:
        '關於下腹部的疼痛演變，下列哪一項描述最符合您目前的真實狀況？',
      options: [
        {
          optionId: 'opt_migrating_jarring_rlq',
          labelZh: '疼痛最初從上腹或肚臍周圍開始，隨後轉移並固定在右下腹，走路震動或按壓放開瞬間劇痛',
          clinicalWeightTag: 'WEIGHT_ACUTE_APPENDICITIS',
        },
        {
          optionId: 'opt_flank_groin_hematuria',
          labelZh: '疼痛從單側後腰（腎區）一路向下放射至鼠蹊部，或伴隨排尿灼熱、頻尿、血尿',
          clinicalWeightTag: 'WEIGHT_UROLITHIASIS_UTI',
        },
        {
          optionId: 'opt_bowel_relief_colonic',
          labelZh: '與排便習慣連動（伴隨腹瀉或便秘），在排便或排氣之後腹痛會明顯減輕',
          clinicalWeightTag: 'WEIGHT_IBS_COLONIC',
        },
        {
          optionId: 'opt_gyne_or_constant',
          labelZh: '持續性下腹定點悶痛或墜脹（若為生理女性伴隨非經期出血或分泌物異常）',
          clinicalWeightTag: 'WEIGHT_DIVERTICULITIS_OR_GYNE',
        },
      ],
    });
  }

  // 3. 左胸/右胸/上背 (chest_left / chest_right / upper_back) 鑑別追問：冠狀動脈心絞痛 vs 胸膜肺部疾病 vs 肋軟骨/胃食道逆流
  if (hasRegion('chest_left') || hasRegion('chest_right') || hasRegion('upper_back')) {
    questions.push({
      questionId: 'dfq_chest_cardiac_pleuritic',
      targetHypothesisZh:
        '旨在區分【冠狀動脈心肌缺氧（心絞痛）】、【胸膜炎／氣胸／肺栓塞】與【肋軟骨炎／胃食道逆流】',
      questionTextZh:
        '請問您的胸口或上背不適，在什麼情況下最容易被誘發，且伴隨哪種特徵？',
      options: [
        {
          optionId: 'opt_exertion_pressure_radiation',
          labelZh: '快走、爬樓梯或出力時胸口像被石頭重壓，並延伸至左肩、左上臂或下巴（休息數分鐘稍緩）',
          clinicalWeightTag: 'WEIGHT_CORONARY_ANGINA_ACS',
        },
        {
          optionId: 'opt_deep_breath_cough_sharp',
          labelZh: '深吸氣、咳嗽或平躺時出現尖銳刺痛，或伴隨呼吸急促、咳嗽有痰',
          clinicalWeightTag: 'WEIGHT_PLEURISY_PERICARDITIS_PULM',
        },
        {
          optionId: 'opt_palpation_point_rib',
          labelZh: '用手指按壓胸骨旁或肋骨特定一點時才痛，或轉身、擴胸拉扯時才痛',
          clinicalWeightTag: 'WEIGHT_COSTOCHONDRITIS_MYOFASCIAL',
        },
        {
          optionId: 'opt_acid_postmeal_gerd',
          labelZh: '餐後或平躺時胸骨後有灼熱火燒感、泛酸水或喉嚨卡卡感',
          clinicalWeightTag: 'WEIGHT_GERD_ESOPHAGEAL',
        },
      ],
    });
  }

  // 4. 頭頸與五官 (head_cranial / face_sensory / neck_throat) 鑑別追問
  if (
    questions.length < 3 &&
    (hasRegion('head_cranial') || hasRegion('face_sensory') || hasRegion('neck_throat'))
  ) {
    questions.push({
      questionId: 'dfq_head_neuro_vestibular',
      targetHypothesisZh:
        '旨在區分【偏頭痛／緊縮型頭痛】、【中樞神經血管／腦膜病變】與【內耳前庭眩暈／鼻竇炎】',
      questionTextZh:
        '請問您的頭頸或五官不適，是否伴隨以下特定的神經學或感官特徵？',
      options: [
        {
          optionId: 'opt_thunderclap_focal_neuro',
          labelZh: '在數秒內突然爆發至生平最劇烈痛感，或伴隨單側手腳無力麻木、說話不清、複視、無法低頭',
          clinicalWeightTag: 'WEIGHT_CENTRAL_NEURO_EMERGENCY',
        },
        {
          optionId: 'opt_pulsating_photophobia_nausea',
          labelZh: '單側或雙側隨脈搏跳動抽痛，看到強光或聽到噪音會更不舒服，且伴隨噁心感',
          clinicalWeightTag: 'WEIGHT_MIGRAINE',
        },
        {
          optionId: 'opt_positional_vertigo_tinnitus',
          labelZh: '轉頭或翻身時出現短暫天旋地轉（眩暈），或伴隨耳鳴、耳悶、鼻塞流濃涕',
          clinicalWeightTag: 'WEIGHT_VESTIBULAR_ENT_SINUS',
        },
        {
          optionId: 'opt_tight_band_neck_strain',
          labelZh: '整圈頭部像戴了緊帽子般悶脹，且後頸與雙肩肌肉非常緊繃痠痛',
          clinicalWeightTag: 'WEIGHT_TENSION_CERVICOGENIC',
        },
      ],
    });
  }

  // 5. 四肢與下背關節 (lower_back / upper_limbs / lower_limbs) 鑑別追問
  if (
    questions.length < 3 &&
    (hasRegion('lower_back') ||
      hasRegion('buttocks_hip') ||
      hasRegion('shoulder_r') ||
      hasRegion('shoulder_l') ||
      hasRegion('forearm_wrist_hand_r') ||
      hasRegion('forearm_wrist_hand_l') ||
      hasRegion('thigh_knee_r') ||
      hasRegion('thigh_knee_l') ||
      hasRegion('calf_ankle_foot_r') ||
      hasRegion('calf_ankle_foot_l'))
  ) {
    questions.push({
      questionId: 'dfq_limb_spine_vascular_joint',
      targetHypothesisZh:
        '旨在區分【脊椎神經根壓迫／周邊神經夾擠】、【結晶性／自體免疫關節炎（如痛風／類風濕）】與【下肢深層靜脈栓塞 (DVT)】',
      questionTextZh:
        '針對您標記的腰背或四肢不適，下列哪一項外觀或誘發表現最吻合？',
      options: [
        {
          optionId: 'opt_radicular_shooting_numb',
          labelZh: '呈現電擊般酸麻痛（如從下背臀部延伸至腿部，或手腕延伸至前三指半夜麻醒）',
          clinicalWeightTag: 'WEIGHT_RADICULOPATHY_CARPAL_NEURO',
        },
        {
          optionId: 'opt_acute_red_hot_joint_gout',
          labelZh: '關節（如大拇趾、足背、膝或手指）出現明顯紅、腫、熱、痛，或早晨起床僵硬超過 30 分鐘',
          clinicalWeightTag: 'WEIGHT_GOUT_INFLAMMATORY_ARTHRITIS',
        },
        {
          optionId: 'opt_unilateral_calf_dvt',
          labelZh: '只有「單側小腿」出現明顯不對稱的水腫、皮膚緊繃發溫與小腿肚深壓痛',
          clinicalWeightTag: 'WEIGHT_DVT_VENOUS_THROMBOSIS',
        },
        {
          optionId: 'opt_mechanical_tendon_strain',
          labelZh: '局部無紅腫發燙，僅在特定角度出力、舉手、擰物或上下樓梯負重時才感到痠痛',
          clinicalWeightTag: 'WEIGHT_MECHANICAL_TENDINOPATHY_OA',
        },
      ],
    });
  }

  // 6. 保底通用全身與發炎／內分泌／藥源性鑑別追問（確保始終有 2～3 題精準問題）
  if (questions.length < 2) {
    questions.push({
      questionId: 'dfq_systemic_infection_autoimmune',
      targetHypothesisZh:
        '旨在區分【急性感染症（病毒／細菌）】、【內分泌代謝失調（甲狀腺／血糖）】與【自體免疫／慢性發炎】',
      questionTextZh:
        '除了目前勾選的症狀外，近期是否有出現以下時間節律或接觸史特徵？',
      options: [
        {
          optionId: 'opt_acute_contact_fever',
          labelZh: '近 1～5 天內曾接觸感冒發燒親友、生冷不潔飲食，或伴隨畏寒、全身倦怠痠痛',
          clinicalWeightTag: 'WEIGHT_ACUTE_INFECTION',
        },
        {
          optionId: 'opt_metabolic_weight_palpitation',
          labelZh: '近數週出現體重明顯改變、怕熱多汗或怕冷、手抖心悸或口渴多尿',
          clinicalWeightTag: 'WEIGHT_ENDOCRINE_METABOLIC',
        },
        {
          optionId: 'opt_new_med_or_supplement',
          labelZh: '症狀是在「近期開始服用或調整某種處方藥物／止痛藥／保健品」之後才出現的',
          clinicalWeightTag: 'WEIGHT_IATROGENIC_DRUG_INDUCED',
        },
        {
          optionId: 'opt_stress_sleep_functional',
          labelZh: '近期工作壓力大、睡眠品質不佳，且各項症狀在放鬆休息時會明顯減輕',
          clinicalWeightTag: 'WEIGHT_AUTONOMIC_FUNCTIONAL',
        },
      ],
    });
  }

  return {
    clinicalContextSummaryZh: `系統已根據您標記的 ${payload.regionRecords.length} 處解剖部位深度、不適感受與 ${payload.systemicSymptomIds.length} 項全身表現，鎖定潛在鑑別診斷並生成以下關鍵區分題：`,
    questions: questions.slice(0, 3),
  };
}
