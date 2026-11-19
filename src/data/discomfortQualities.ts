import {
  BodyRegionId,
  DiscomfortQualityCategory,
  DiscomfortQualityItem,
  RegionSpecificSymptomItem,
  SymptomDepthLayer,
} from '@/types/cdss';

export const DEPTH_LAYER_CONFIG: Record<
  SymptomDepthLayer,
  {
    labelZh: string;
    shortLabelZh: string;
    descriptionZh: string;
    badgeStyle: string;
  }
> = {
  superficial: {
    labelZh: '皮膚表層',
    shortLabelZh: '皮膚表層',
    descriptionZh: '表皮、真皮或皮下淺層組織（如皮疹、水泡、表淺刺痛、搔癢、表面紅腫破皮）',
    badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  musculoskeletal: {
    labelZh: '肌肉與關節',
    shortLabelZh: '肌肉與關節',
    descriptionZh: '骨骼、關節囊、肌腱韌帶或筋膜（如壓痛、出力或轉動受限、關節僵硬痠痛）',
    badgeStyle: 'bg-sky-100 text-sky-900 border-sky-300',
  },
  deep_visceral: {
    labelZh: '身體深層（內臟或深部組織）',
    shortLabelZh: '身體深層',
    descriptionZh: '胸腹腔內臟器官、深部血管或中樞神經（如深層悶痛、絞痛、重壓感、反彈痛）',
    badgeStyle: 'bg-rose-100 text-rose-900 border-rose-300',
  },
};

export const DISCOMFORT_CATEGORY_META: Record<
  DiscomfortQualityCategory,
  { titleZh: string; subtitleZh: string }
> = {
  pain_qualities: {
    titleZh: '1. 疼痛性質類（Pain Qualities）',
    subtitleZh: '請勾選最符合您疼痛感受的性質（可複選，為鑑別內臟、神經或肌肉病灶之核心依據）',
  },
  abnormal_sensations: {
    titleZh: '2. 異常感覺類（Sensory & Paresthesia）',
    subtitleZh: '非典型疼痛之神經傳導、溫度或異物感受',
  },
  structural_functional: {
    titleZh: '3. 結構與功能類（Structural & Functional）',
    subtitleZh: '外觀變化、腫塊、關節活動度或肌力異常',
  },
};

/**
 * 模組 C-1：各部位通用「不適感與疼痛性質」複選庫（3 大類共 24 項完整實作）
 */
export const DISCOMFORT_QUALITIES_CATALOG: DiscomfortQualityItem[] = [
  // ==================== 1. 疼痛類 (11 項) ====================
  {
    id: 'q_dull_ache',
    category: 'pain_qualities',
    labelZh: '鈍痛／悶痛',
    clinicalTermEn: 'Dull pain / Aching',
    colloquialAliases: ['悶痛', '鈍痛', '悶悶的痛', '隱隱作痛'],
  },
  {
    id: 'q_sharp_stabbing',
    category: 'pain_qualities',
    labelZh: '銳痛／刺痛／針扎感',
    clinicalTermEn: 'Sharp / Stabbing pain',
    colloquialAliases: ['刺痛', '銳痛', '針扎感', '像針刺'],
  },
  {
    id: 'q_throbbing_pulsating',
    category: 'pain_qualities',
    labelZh: '抽痛／搏動性痛（隨心跳跳動）',
    clinicalTermEn: 'Throbbing / Pulsating pain',
    colloquialAliases: ['抽痛', '搏動性痛', '血管跳動痛', '一跳一跳的痛'],
  },
  {
    id: 'q_colicky_cramping',
    category: 'pain_qualities',
    labelZh: '陣發性絞痛／痙攣痛',
    clinicalTermEn: 'Colicky / Cramping pain',
    colloquialAliases: ['絞痛', '痙攣痛', '一陣一陣絞痛', '肚子絞痛'],
  },
  {
    id: 'q_burning',
    category: 'pain_qualities',
    labelZh: '灼熱痛／火燒感',
    clinicalTermEn: 'Burning pain',
    colloquialAliases: ['灼熱痛', '火燒感', '火燒心', '熱辣辣的痛'],
  },
  {
    id: 'q_tearing_ripping',
    category: 'pain_qualities',
    labelZh: '撕裂樣劇痛',
    clinicalTermEn: 'Tearing / Ripping pain',
    colloquialAliases: ['撕裂痛', '刀割痛', '像被撕開一樣痛'],
    isRedFlagWeight: true,
  },
  {
    id: 'q_crushing_pressure',
    category: 'pain_qualities',
    labelZh: '重壓感／緊縮壓迫痛',
    clinicalTermEn: 'Crushing / Pressure-like pain',
    colloquialAliases: ['重壓感', '壓迫痛', '像大石頭壓住', '緊縮痛'],
    isRedFlagWeight: true,
  },
  {
    id: 'q_deep_soreness',
    category: 'pain_qualities',
    labelZh: '深層痠痛／疲勞痛',
    clinicalTermEn: 'Deep soreness / Fatigue ache',
    colloquialAliases: ['痠痛', '酸痛', '深層痠軟', '疲勞痠痛'],
  },
  {
    id: 'q_electric_shooting',
    category: 'pain_qualities',
    labelZh: '電擊樣痛／神經放射痛',
    clinicalTermEn: 'Electric-shock / Shooting neuropathic pain',
    colloquialAliases: ['電擊痛', '觸電感', '神經抽痛', '放射痛'],
  },
  {
    id: 'q_tenderness_on_palpation',
    category: 'pain_qualities',
    labelZh: '按壓才痛（壓痛）',
    clinicalTermEn: 'Tenderness on palpation',
    colloquialAliases: ['壓痛', '按壓會痛', '摸到才痛'],
  },
  {
    id: 'q_rebound_tenderness',
    category: 'pain_qualities',
    labelZh: '反彈痛（壓下去放開更痛）',
    clinicalTermEn: 'Rebound tenderness',
    colloquialAliases: ['反彈痛', '壓下去放開劇痛', '腹膜炎徵象'],
    isRedFlagWeight: true,
  },

  // ==================== 2. 異常感覺類 (6 項) ====================
  {
    id: 's_numbness_hypoesthesia',
    category: 'abnormal_sensations',
    labelZh: '麻木／感覺遲鈍',
    clinicalTermEn: 'Numbness / Hypoesthesia',
    colloquialAliases: ['麻木', '發麻', '沒知覺', '感覺變鈍'],
  },
  {
    id: 's_pins_needles_formication',
    category: 'abnormal_sensations',
    labelZh: '針刺麻／蟻走感',
    clinicalTermEn: 'Paresthesia / Formication',
    colloquialAliases: ['針刺麻', '蟻走感', '像螞蟻在爬', '麻刺感'],
  },
  {
    id: 's_itching_pruritus',
    category: 'abnormal_sensations',
    labelZh: '搔癢感',
    clinicalTermEn: 'Pruritus / Itching',
    colloquialAliases: ['癢', '搔癢', '發癢', '奇癢無比'],
  },
  {
    id: 's_local_heat_warmth',
    category: 'abnormal_sensations',
    labelZh: '發熱／局部發燙',
    clinicalTermEn: 'Localized warmth / Calor',
    colloquialAliases: ['局部發燙', '紅腫熱', '摸起來燙燙的'],
  },
  {
    id: 's_local_coldness',
    category: 'abnormal_sensations',
    labelZh: '局部冰冷感',
    clinicalTermEn: 'Localized coldness',
    colloquialAliases: ['冰冷感', '手腳冰冷', '末梢發冷'],
  },
  {
    id: 's_foreign_body_sensation',
    category: 'abnormal_sensations',
    labelZh: '異物感／卡卡的',
    clinicalTermEn: 'Foreign body sensation / Globus',
    colloquialAliases: ['異物感', '卡卡的', '吞嚥卡住', '有東西梗住'],
  },

  // ==================== 3. 結構與功能類 (7 項) ====================
  {
    id: 'f_swelling_distension',
    category: 'structural_functional',
    labelZh: '腫脹／發脹緊繃感',
    clinicalTermEn: 'Swelling / Edema / Distension',
    colloquialAliases: ['腫脹', '水腫', '發脹', '鼓脹緊繃'],
  },
  {
    id: 'f_hard_lump_nodule',
    category: 'structural_functional',
    labelZh: '硬塊／結節感',
    clinicalTermEn: 'Palpable mass / Nodule',
    colloquialAliases: ['硬塊', '腫塊', '結節', '摸到一顆東西'],
  },
  {
    id: 'f_stiffness_limited_rom',
    category: 'structural_functional',
    labelZh: '關節或肌肉僵硬／活動受限',
    clinicalTermEn: 'Stiffness / Limited range of motion',
    colloquialAliases: ['僵硬', '活動受限', '舉不起來', '彎不下去', '卡住'],
  },
  {
    id: 'f_weakness_paresis',
    category: 'structural_functional',
    labelZh: '無力／使不上力',
    clinicalTermEn: 'Motor weakness / Paresis',
    colloquialAliases: ['無力', '使不上力', '軟腳', '抬不起來', '握不住'],
    isRedFlagWeight: true,
  },
  {
    id: 'f_cramp_fasciculation',
    category: 'structural_functional',
    labelZh: '抽筋／肌肉不自主跳動',
    clinicalTermEn: 'Muscle cramp / Fasciculation',
    colloquialAliases: ['抽筋', '肌肉跳動', '痙攣'],
  },
  {
    id: 'f_erythema_bruise_blister',
    category: 'structural_functional',
    labelZh: '紅腫／瘀青／破皮水泡',
    clinicalTermEn: 'Erythema / Ecchymosis / Vesicles',
    colloquialAliases: ['紅腫', '水泡', '皮蛇水泡', '破皮潰瘍', '瘀青'],
  },
  {
    id: 'f_abnormal_discharge_bleeding',
    category: 'structural_functional',
    labelZh: '異常分泌物／出血',
    clinicalTermEn: 'Abnormal discharge / Bleeding',
    colloquialAliases: ['流血', '出血', '流膿', '異常分泌物'],
  },
];

/**
 * 24 區專屬附加臨床症狀庫（補充通用不適感之外的器官特異性表現）
 */
export const REGION_SPECIFIC_SYMPTOMS: RegionSpecificSymptomItem[] = [
  // 1. 頭部與顱骨 head_cranial
  {
    id: 'sp_head_unilateral_migraine',
    regionId: 'head_cranial',
    labelZh: '單側太陽穴或眼眶後反覆頭痛（常伴隨畏光、怕吵或噁心）',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['偏頭痛', '太陽穴痛', '頭痛想吐'],
    meshTermsEn: ['Migraine Disorders', 'Headache'],
  },
  {
    id: 'sp_head_bilateral_band',
    regionId: 'head_cranial',
    labelZh: '雙側或整圈頭部緊箍壓迫感（常於下午或壓力疲勞時明顯）',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['緊縮型頭痛', '頭脹痛', '後腦緊繃'],
    meshTermsEn: ['Tension-Type Headache'],
  },
  {
    id: 'sp_head_thunderclap_explosion',
    regionId: 'head_cranial',
    labelZh: '數秒內達最高強度的爆炸性雷擊頭痛（生平最劇烈）',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['雷擊頭痛', '頭快炸開', '突發劇烈頭痛'],
    meshTermsEn: ['Thunderclap Headache', 'Subarachnoid Hemorrhage'],
    isRedFlagWeight: true,
  },

  // 2. 臉部與五官 face_sensory
  {
    id: 'sp_face_vision_blur_photophobia',
    regionId: 'face_sensory',
    labelZh: '視力模糊、視野缺損、複視（看東西兩個影）或眼壓脹痛',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['視力模糊', '眼睛痛', '看東西兩個影', '青光眼'],
    meshTermsEn: ['Vision Disorders', 'Diplopia', 'Eye Pain'],
  },
  {
    id: 'sp_face_tinnitus_hearing_ear',
    regionId: 'face_sensory',
    labelZh: '耳鳴、耳悶塞感、聽力下降或內耳旋轉性眩暈',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['耳鳴', '耳悶', '聽不清楚', '梅尼爾氏症'],
    meshTermsEn: ['Tinnitus', 'Meniere Disease', 'Hearing Loss'],
  },
  {
    id: 'sp_face_sinus_congestion',
    regionId: 'face_sensory',
    labelZh: '鼻塞、黃綠色濃鼻涕倒流、眉心或雙頰鼻竇區脹痛',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['鼻竇炎', '鼻塞', '流濃鼻涕', '鼻涕倒流'],
    meshTermsEn: ['Sinusitis', 'Rhinitis'],
  },
  {
    id: 'sp_face_facial_palsy_slurred',
    regionId: 'face_sensory',
    labelZh: '單側嘴角歪斜流口水、眼皮無法閉合或說話大舌頭（口齒不清）',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['臉歪嘴斜', '顏面神經麻痺', '口齒不清', '講話大舌頭'],
    meshTermsEn: ['Facial Paralysis', 'Bell Palsy', 'Dysarthria', 'Stroke'],
    isRedFlagWeight: true,
  },
  {
    id: 'sp_face_tmj_jaw_pain',
    regionId: 'face_sensory',
    labelZh: '張口咀嚼時耳前顳顎關節彈響疼痛，或下巴莫名酸痛悶脹',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['下巴痛', '顳顎關節痛', '咬東西痛'],
    meshTermsEn: ['Temporomandibular Joint Disorders', 'Facial Pain'],
  },

  // 3. 頸部與咽喉 neck_throat
  {
    id: 'sp_neck_dysphagia_odynophagia',
    regionId: 'neck_throat',
    labelZh: '吞嚥困難、吞口水劇痛、喉嚨灼熱紅腫或聲音沙啞',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['吞嚥困難', '喉嚨痛', '扁桃腺發炎', '聲音沙啞'],
    meshTermsEn: ['Deglutition Disorders', 'Pharyngitis', 'Tonsillitis'],
  },
  {
    id: 'sp_neck_meningeal_stiffness',
    regionId: 'neck_throat',
    labelZh: '後頸極度僵硬、低頭時下巴無法碰觸胸口（腦膜刺激徵兆）',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['頸部僵硬', '無法低頭'],
    meshTermsEn: ['Meningism', 'Meningitis'],
    isRedFlagWeight: true,
  },
  {
    id: 'sp_neck_thyroid_anterior_mass',
    regionId: 'neck_throat',
    labelZh: '前頸甲狀腺區腫大（隨吞嚥上下移動）或側頸淋巴結腫塊',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['甲狀腺腫大', '大脖子', '頸部淋巴腫塊'],
    meshTermsEn: ['Goiter', 'Thyroid Diseases', 'Lymphadenopathy'],
  },
  {
    id: 'sp_neck_cervical_radiculopathy',
    regionId: 'neck_throat',
    labelZh: '後頸椎轉動受限痠痛，並向肩膀或上肢放射發麻',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['頸椎病', '落枕', '頸椎壓迫神經'],
    meshTermsEn: ['Cervical Radiculopathy', 'Neck Pain'],
  },

  // 4. 左胸與心前區 chest_left
  {
    id: 'sp_chest_l_retrosternal_angina',
    regionId: 'chest_left',
    labelZh: '左胸或胸骨後深層壓迫悶塞感（運動、爬樓梯或情緒激動時誘發）',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['心口悶', '胸悶', '心絞痛', '胸口壓迫感'],
    meshTermsEn: ['Angina Pectoris', 'Myocardial Ischemia', 'Chest Pain'],
    isRedFlagWeight: true,
  },
  {
    id: 'sp_chest_l_palpitation_dyspnea',
    regionId: 'chest_left',
    labelZh: '左胸心悸、心跳漏拍感或呼吸不順、吸不到氣',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['心悸', '呼吸不順', '喘不過氣'],
    meshTermsEn: ['Palpitations', 'Dyspnea', 'Arrhythmias, Cardiac'],
  },
  {
    id: 'sp_chest_l_pericardial_positional',
    regionId: 'chest_left',
    labelZh: '平躺或深吸氣時左胸刺痛加劇，坐起身體前傾時稍微緩解',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['平躺胸痛', '心包膜炎'],
    meshTermsEn: ['Pericarditis', 'Pleurisy'],
  },
  {
    id: 'sp_chest_l_costal_cartilage',
    regionId: 'chest_left',
    labelZh: '胸骨邊緣肋軟骨定點壓痛，擴胸或按壓時明顯',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['肋軟骨炎', '按壓胸口痛'],
    meshTermsEn: ['Costochondritis'],
  },

  // 5. 右胸與胸廓 chest_right
  {
    id: 'sp_chest_r_pleuritic_cough',
    regionId: 'chest_right',
    labelZh: '深呼吸或咳嗽時右胸深層刺痛加劇，伴隨咳嗽或濃痰',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['深呼吸胸痛', '咳嗽胸痛', '肺炎', '肋膜炎'],
    meshTermsEn: ['Pleurisy', 'Pneumonia', 'Pneumothorax'],
  },
  {
    id: 'sp_chest_r_breast_mastalgia',
    regionId: 'chest_right',
    labelZh: '乳房局部脹痛、摸到結節硬塊或乳頭異常分泌物',
    defaultDepth: 'superficial',
    colloquialAliases: ['乳房痛', '乳房硬塊', '乳腺炎'],
    meshTermsEn: ['Mastodynia', 'Breast Diseases'],
  },

  // 6. 上背部與肩胛區 upper_back
  {
    id: 'sp_uback_interscapular_tearing',
    regionId: 'upper_back',
    labelZh: '兩肩胛骨之間突發刀割或撕裂般劇痛（可向下背延伸）',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['後背撕裂痛', '主動脈剝離痛'],
    meshTermsEn: ['Aneurysm, Dissecting', 'Back Pain'],
    isRedFlagWeight: true,
  },
  {
    id: 'sp_uback_rhomboid_myofascial',
    regionId: 'upper_back',
    labelZh: '肩胛骨內側（膏肓區）深層緊繃痠痛，按壓有明顯激痛點',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['膏肓痛', '肩胛骨痛', '上背肌筋膜炎'],
    meshTermsEn: ['Myofascial Pain Syndromes'],
  },

  // 7. 右上腹 abd_ruq (腹部五區之 1)
  {
    id: 'sp_ruq_postprandial_biliary',
    regionId: 'abd_ruq',
    labelZh: '進食油膩大餐後右上腹劇烈絞痛或悶脹（可放射至右肩胛或右背）',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['右上腹痛', '膽結石痛', '膽囊炎', '吃完油膩肚子痛'],
    meshTermsEn: ['Cholecystitis, Acute', 'Cholelithiasis', 'Biliary Colic'],
  },
  {
    id: 'sp_ruq_murphy_inspiratory_arrest',
    regionId: 'abd_ruq',
    labelZh: '深吸氣並按壓右肋骨下緣時，因劇痛而突然停止吸氣（墨菲氏徵象）',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['吸氣右上腹痛', '右肋下壓痛'],
    meshTermsEn: ['Cholecystitis', 'Cholangitis'],
  },

  // 8. 左上腹 abd_luq (腹部五區之 2)
  {
    id: 'sp_luq_pancreatic_boring_back',
    regionId: 'abd_luq',
    labelZh: '左上腹與上腹持續鑽頂般劇痛，並直接穿透放射至左後背（彎腰抱膝稍緩）',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['左上腹痛到後背', '胰臟炎痛'],
    meshTermsEn: ['Pancreatitis', 'Abdominal Pain'],
    isRedFlagWeight: true,
  },
  {
    id: 'sp_luq_splenic_flexure_gas',
    regionId: 'abd_luq',
    labelZh: '左肋下緣飽脹悶痛、排氣或排便後脹感減輕',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['左上腹脹氣', '胃脾區悶脹'],
    meshTermsEn: ['Dyspepsia', 'Colonic Diseases, Functional'],
  },

  // 9. 中上腹與肚臍周圍 abd_epigastric (腹部五區之 3)
  {
    id: 'sp_epi_acid_regurgitation_heartburn',
    regionId: 'abd_epigastric',
    labelZh: '胸骨下心窩處灼熱泛酸（火燒心）、平躺或吃甜食咖啡後胃酸逆流',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['火燒心', '胃酸逆流', '胃食道逆流', '吐酸水'],
    meshTermsEn: ['Gastroesophageal Reflux', 'Heartburn'],
  },
  {
    id: 'sp_epi_hunger_nocturnal_ulcer',
    regionId: 'abd_epigastric',
    labelZh: '空腹或半夜時上腹悶痛明顯（進食稍緩解），或餐後立即上腹脹痛',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['胃潰瘍', '十二指腸潰瘍', '空腹胃痛', '胃痛'],
    meshTermsEn: ['Peptic Ulcer', 'Gastritis'],
  },
  {
    id: 'sp_epi_periumbilical_gastroenteritis',
    regionId: 'abd_epigastric',
    labelZh: '肚臍周圍陣發性腸絞痛、腸鳴咕嚕叫，伴隨水瀉或噁心',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['肚臍周圍痛', '急性腸胃炎', '吃壞肚子'],
    meshTermsEn: ['Gastroenteritis'],
  },

  // 10. 右下腹 abd_rlq (腹部五區之 4)
  {
    id: 'sp_rlq_mcburney_migrating',
    regionId: 'abd_rlq',
    labelZh: '疼痛最初在肚臍周圍或上腹，數小時後轉移並固定於右下腹（闌尾點）',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['右下腹痛', '盲腸炎', '闌尾炎', '痛點轉移到右下腹'],
    meshTermsEn: ['Appendicitis'],
    isRedFlagWeight: true,
  },
  {
    id: 'sp_rlq_psoas_jarring_pain',
    regionId: 'abd_rlq',
    labelZh: '走路震動、咳嗽或伸直右大腿時右下腹劇痛加劇',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['走路右下腹痛', '右下腹反彈痛'],
    meshTermsEn: ['Appendicitis', 'Peritonitis'],
    isRedFlagWeight: true,
  },

  // 11. 左下腹 abd_llq (腹部五區之 5)
  {
    id: 'sp_llq_diverticulitis_constant',
    regionId: 'abd_llq',
    labelZh: '左下腹定點持續壓痛（非單純排便前絞痛），或伴隨發燒與排便改變',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['左下腹定點痛', '大腸憩室炎'],
    meshTermsEn: ['Diverticulitis, Colonic', 'Colitis'],
  },
  {
    id: 'sp_llq_ibs_bowel_relief',
    regionId: 'abd_llq',
    labelZh: '左下腹反覆悶絞痛，與排便頻率或糞便軟硬度改變連動（排便後緩解）',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['腸躁症', '便秘左下腹痛', '大腸激躁症'],
    meshTermsEn: ['Irritable Bowel Syndrome'],
  },

  // 12. 下背與後腰腎區 lower_back
  {
    id: 'sp_lback_cva_renal_flank',
    regionId: 'lower_back',
    labelZh: '單側後腰肋骨下緣（腎區）突發刀割般劇烈絞痛，並向鼠蹊部或下腹放射',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['腎結石痛', '後腰劇痛', '腎盂腎炎', '敲擊後腰痛'],
    meshTermsEn: ['Renal Colic', 'Nephrolithiasis', 'Pyelonephritis'],
  },
  {
    id: 'sp_lback_lumbar_radiculopathy',
    regionId: 'lower_back',
    labelZh: '彎腰搬物或久坐後下背劇痛，且酸麻感向下延伸過臀部至大腿／小腿',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['椎間盤突出', '閃到腰', '腰痛麻到腳'],
    meshTermsEn: ['Intervertebral Disc Displacement', 'Low Back Pain', 'Sciatica'],
  },

  // 13. 下腹恥骨上與鼠蹊部 pelvis_groin
  {
    id: 'sp_pelvis_suprapubic_uti',
    regionId: 'pelvis_groin',
    labelZh: '恥骨上下腹悶脹墜痛，伴隨頻尿、尿急、排尿灼熱刺痛或尿道口不適',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['膀胱炎', '泌尿道感染', '尿道炎', '小腹痛頻尿'],
    meshTermsEn: ['Cystitis', 'Urinary Tract Infections'],
  },
  {
    id: 'sp_pelvis_inguinal_hernia_bulge',
    regionId: 'pelvis_groin',
    labelZh: '站立、咳嗽或腹部出力時鼠蹊部鼓起軟腫塊（平躺時可能縮小或卡住劇痛）',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['腹股溝疝氣', '鼠蹊部腫塊', '墜腸'],
    meshTermsEn: ['Hernia, Inguinal'],
  },
  {
    id: 'sp_pelvis_gyne_pid_adnexal',
    regionId: 'pelvis_groin',
    labelZh: '骨盆下腹深層抽痛墜脹，伴隨異常陰道出血、分泌物異味或性交疼痛',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['骨盆腔發炎', '卵巢囊腫痛', '子宮外孕痛', '非經期出血腹痛'],
    meshTermsEn: ['Pelvic Inflammatory Disease', 'Ovarian Cysts', 'Pregnancy, Ectopic'],
  },

  // 14. 臀部與髖後側 buttocks_hip
  {
    id: 'sp_butt_piriformis_sciatica',
    regionId: 'buttocks_hip',
    labelZh: '久坐時臀部深處壓痛，並觸發沿大腿後側向下放射之坐骨神經麻痛',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['坐骨神經痛', '梨狀肌症候群', '屁股麻痛'],
    meshTermsEn: ['Piriformis Muscle Syndrome', 'Sciatica'],
  },
  {
    id: 'sp_butt_anorectal_hemorrhoid_fissure',
    regionId: 'buttocks_hip',
    labelZh: '排便時肛門刀割撕裂痛、便後滴鮮血或肛門旁摸到腫痛結節',
    defaultDepth: 'superficial',
    colloquialAliases: ['痔瘡', '肛裂', '肛門膿瘍', '便血'],
    meshTermsEn: ['Hemorrhoids', 'Fissure in Ano', 'Abscess'],
  },

  // 15. 右肩關節 shoulder_r
  {
    id: 'sp_shoulder_r_rotator_frozen',
    regionId: 'shoulder_r',
    labelZh: '右肩主動與被動上舉、外旋或向後扣背角度明顯受限，夜間壓迫疼痛',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['右五十肩', '右旋轉肌袖肌腱炎', '右肩夾擠'],
    meshTermsEn: ['Bursitis', 'Rotator Cuff Injuries', 'Shoulder Pain'],
  },
  {
    id: 'sp_shoulder_r_biliary_referred',
    regionId: 'shoulder_r',
    labelZh: '右肩與右肩胛深層悶痛（轉動肩膀時不影響痛感，常伴隨右上腹不適）',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['右肩牽涉痛', '膽囊反射右肩痛'],
    meshTermsEn: ['Referred Pain', 'Cholecystitis'],
  },

  // 16. 左肩關節 shoulder_l
  {
    id: 'sp_shoulder_l_rotator_frozen',
    regionId: 'shoulder_l',
    labelZh: '左肩上舉或活動時疼痛卡頓、夜間側睡壓迫左肩痛',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['左五十肩', '左旋轉肌痛'],
    meshTermsEn: ['Rotator Cuff Injuries', 'Shoulder Pain'],
  },
  {
    id: 'sp_shoulder_l_cardiac_referred',
    regionId: 'shoulder_l',
    labelZh: '與關節活動無關之左肩深層酸麻重壓感（尤其伴隨胸悶或冒冷汗時）',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['心絞痛放射左肩', '胸悶傳到左肩'],
    meshTermsEn: ['Angina Pectoris', 'Referred Pain'],
    isRedFlagWeight: true,
  },

  // 17. 右上臂與手肘 upper_arm_elbow_r
  {
    id: 'sp_arm_r_lateral_epicondylitis',
    regionId: 'upper_arm_elbow_r',
    labelZh: '右手肘外側骨突處壓痛，擰毛巾、轉門把或提物時疼痛加劇',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['右網球肘', '右手肘肌腱炎'],
    meshTermsEn: ['Tennis Elbow', 'Elbow Tendinopathy'],
  },
  {
    id: 'sp_arm_r_acute_motor_deficit',
    regionId: 'upper_arm_elbow_r',
    labelZh: '右上肢突發無力、雙手平舉時右手不自主下垂或伴隨單側麻木',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['右手突然無力', '右側偏癱徵兆'],
    meshTermsEn: ['Hemiplegia', 'Paresis', 'Stroke'],
    isRedFlagWeight: true,
  },

  // 18. 左上臂與手肘 upper_arm_elbow_l
  {
    id: 'sp_arm_l_lateral_epicondylitis',
    regionId: 'upper_arm_elbow_l',
    labelZh: '左手肘外側或內側肌腱壓痛、出力提物時酸痛',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['左網球肘', '左手肘痛'],
    meshTermsEn: ['Tennis Elbow'],
  },
  {
    id: 'sp_arm_l_inner_cardiac_radiation',
    regionId: 'upper_arm_elbow_l',
    labelZh: '左上臂內側延伸至無名指／小指方向之莫名酸麻悶痛（伴隨胸口壓迫）',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['左手臂內側放射痛', '心肌梗塞左臂痛'],
    meshTermsEn: ['Myocardial Infarction', 'Angina Pectoris'],
    isRedFlagWeight: true,
  },

  // 19. 右前臂、手腕與手指 forearm_wrist_hand_r
  {
    id: 'sp_hand_r_carpal_median_nerve',
    regionId: 'forearm_wrist_hand_r',
    labelZh: '右手拇指、食指、中指與半邊無名指發麻刺痛（夜間或騎車握把時麻醒，甩手稍緩）',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['右腕隧道症候群', '右手麻', '正中神經壓迫'],
    meshTermsEn: ['Carpal Tunnel Syndrome'],
  },
  {
    id: 'sp_hand_r_dequervain_trigger',
    regionId: 'forearm_wrist_hand_r',
    labelZh: '右手腕拇指側肌腱劇痛（媽媽手）或手指彎曲後彈直卡住（板機指）',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['右媽媽手', '板機指', '腱鞘炎'],
    meshTermsEn: ['De Quervain Disease', 'Trigger Finger Disorder'],
  },
  {
    id: 'sp_hand_r_small_joint_synovitis',
    regionId: 'forearm_wrist_hand_r',
    labelZh: '手指近端指間或掌指關節腫脹溫熱，早晨起床僵硬超過 30 分鐘',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['類風濕性關節炎', '手指關節晨僵'],
    meshTermsEn: ['Arthritis, Rheumatoid', 'Osteoarthritis'],
  },

  // 20. 左前臂、手腕與手指 forearm_wrist_hand_l
  {
    id: 'sp_hand_l_carpal_median_nerve',
    regionId: 'forearm_wrist_hand_l',
    labelZh: '左手前三指發麻刺痛、握力減弱（腕隧道正中神經受壓）',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['左腕隧道症候群', '左手麻'],
    meshTermsEn: ['Carpal Tunnel Syndrome'],
  },
  {
    id: 'sp_hand_l_dequervain_synovitis',
    regionId: 'forearm_wrist_hand_l',
    labelZh: '左手腕肌腱疼痛（媽媽手）或手指小關節對稱腫痛晨僵',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['左媽媽手', '左手指關節炎'],
    meshTermsEn: ['De Quervain Disease', 'Arthritis, Rheumatoid'],
  },

  // 21. 右大腿與膝關節 thigh_knee_r
  {
    id: 'sp_knee_r_oa_meniscus_crepitus',
    regionId: 'thigh_knee_r',
    labelZh: '上下樓梯或蹲下站起時右膝關節酸痛軟腳、有摩擦喀喀聲或關節積水腫脹',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['右膝退化性關節炎', '右膝半月板損傷', '右膝蓋痛'],
    meshTermsEn: ['Osteoarthritis, Knee', 'Tibial Meniscus Injuries'],
  },

  // 22. 左大腿與膝關節 thigh_knee_l
  {
    id: 'sp_knee_l_oa_meniscus_crepitus',
    regionId: 'thigh_knee_l',
    labelZh: '上下樓梯或負重時左膝關節疼痛、腫脹或彎曲伸直受限',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['左膝退化性關節炎', '左膝蓋痛'],
    meshTermsEn: ['Osteoarthritis, Knee'],
  },

  // 23. 右小腿、腳踝與足部 calf_ankle_foot_r
  {
    id: 'sp_calf_r_unilateral_dvt_swelling',
    regionId: 'calf_ankle_foot_r',
    labelZh: '右小腿單側明顯不對稱腫脹、皮膚緊繃發溫且小腿肚深壓劇痛',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['右下肢深層靜脈栓塞', '右小腿單側水腫血栓'],
    meshTermsEn: ['Venous Thrombosis'],
    isRedFlagWeight: true,
  },
  {
    id: 'sp_foot_r_first_mtp_podagra_gout',
    regionId: 'calf_ankle_foot_r',
    labelZh: '右腳大拇趾根部關節或足背於夜間／清晨突發極度紅腫熱痛（連碰被單都痛）',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['右腳痛風', '急性痛風性關節炎', '右大拇趾紅腫痛'],
    meshTermsEn: ['Gout', 'Arthritis, Gouty'],
  },
  {
    id: 'sp_foot_r_plantar_fasciitis_sprain',
    regionId: 'calf_ankle_foot_r',
    labelZh: '早晨下床第一步右腳跟底刺痛（走幾步稍緩），或右腳踝外側翻船扭傷腫痛',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['右足底筋膜炎', '右腳踝扭傷'],
    meshTermsEn: ['Fasciitis, Plantar', 'Ankle Injuries'],
  },

  // 24. 左小腿、腳踝與足部 calf_ankle_foot_l
  {
    id: 'sp_calf_l_unilateral_dvt_swelling',
    regionId: 'calf_ankle_foot_l',
    labelZh: '左小腿單側明顯不對稱腫脹、緊繃發熱且小腿肚深層壓痛',
    defaultDepth: 'deep_visceral',
    colloquialAliases: ['左下肢深層靜脈栓塞', '左小腿單側水腫血栓'],
    meshTermsEn: ['Venous Thrombosis'],
    isRedFlagWeight: true,
  },
  {
    id: 'sp_foot_l_first_mtp_podagra_gout',
    regionId: 'calf_ankle_foot_l',
    labelZh: '左腳大拇趾根部關節或足背突發極度紅腫熱劇痛（典型急性痛風表現）',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['左腳痛風', '左大拇趾紅腫痛'],
    meshTermsEn: ['Gout', 'Arthritis, Gouty'],
  },
  {
    id: 'sp_foot_l_plantar_fasciitis_sprain',
    regionId: 'calf_ankle_foot_l',
    labelZh: '早晨下床左腳後跟踩地刺痛（足底筋膜炎），或左腳踝韌帶扭傷',
    defaultDepth: 'musculoskeletal',
    colloquialAliases: ['左足底筋膜炎', '左腳踝扭傷'],
    meshTermsEn: ['Fasciitis, Plantar', 'Ankle Injuries'],
  },
];

export function getSpecificSymptomsByRegion(
  regionId: BodyRegionId
): RegionSpecificSymptomItem[] {
  return REGION_SPECIFIC_SYMPTOMS.filter((s) => s.regionId === regionId);
}
