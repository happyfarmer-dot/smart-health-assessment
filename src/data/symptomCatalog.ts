import {
  BodyRegionId,
  SymptomOption,
  SystemicSymptomDefinition,
  SymptomDepthLayer,
} from '@/types/medical';

export const DEPTH_LAYER_META: Record<
  SymptomDepthLayer,
  {
    labelZh: string;
    shortLabelZh: string;
    descriptionZh: string;
    badgeColor: string;
    specialtyHintZh: string;
  }
> = {
  superficial: {
    labelZh: '皮膚表層',
    shortLabelZh: '表層皮膚',
    descriptionZh: '紅疹、水泡、表淺刺痛、搔癢、皮膚表面紅腫溫熱或傷口',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    specialtyHintZh: '優先導向：皮膚科、家庭醫學科、一般外科（表淺感染）',
  },
  musculoskeletal: {
    labelZh: '肌肉與關節',
    shortLabelZh: '肌肉關節',
    descriptionZh: '按壓會痛、轉動或出力時加劇、關節卡頓腫脹、酸痛拉傷感',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    specialtyHintZh: '優先導向：骨科、復健科、風濕免疫科',
  },
  deep_visceral: {
    labelZh: '身體深層悶痛',
    shortLabelZh: '深層內臟',
    descriptionZh: '深部悶痛、絞痛、壓迫感、抽痛，按壓表皮不一定痛且與姿勢較無關',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    specialtyHintZh: '優先導向：各對應內臟專科（心臟、胸腔、肝膽腸胃、神經、泌尿、婦產）',
  },
};

export const SYSTEMIC_SYMPTOMS: SystemicSymptomDefinition[] = [
  {
    id: 'fever_high',
    labelZh: '發燒（體溫 ≥ 38.0°C）',
    descriptionZh: '耳溫或額溫達 38°C 以上，或明顯全身發燙',
    colloquialAliases: ['發燒', '高燒', '體溫高', '全身發燙', '燒到38度'],
    meshTermsEn: ['Fever', 'Pyrexia'],
    isRedFlagContributor: true,
  },
  {
    id: 'chills_rigors',
    labelZh: '畏寒、發抖（寒顫）',
    descriptionZh: '即使蓋被子仍覺得冷、甚至不自主打冷顫',
    colloquialAliases: ['畏寒', '發冷', '打冷顫', '發抖', '忽冷忽熱'],
    meshTermsEn: ['Chills', 'Shivering'],
  },
  {
    id: 'cold_sweat_pallor',
    labelZh: '冒冷汗、臉色蒼白',
    descriptionZh: '無運動卻突然全身冒冷汗、皮膚濕冷或臉色發白',
    colloquialAliases: ['冒冷汗', '冷汗', '臉色蒼白', '盜冷汗', '全身濕冷'],
    meshTermsEn: ['Sweating, Cold', 'Pallor'],
    isRedFlagContributor: true,
  },
  {
    id: 'general_fatigue',
    labelZh: '全身極度無力、倦怠',
    descriptionZh: '休息後仍無法緩解的全身疲憊或四肢癱軟感',
    colloquialAliases: ['全身無力', '疲倦', '倦怠', '沒力氣', '虛弱', '累'],
    meshTermsEn: ['Fatigue', 'Asthenia'],
  },
  {
    id: 'anorexia_nausea',
    labelZh: '食慾不振、噁心想吐',
    descriptionZh: '吃不下東西、反胃、嘔吐或看到食物就想吐',
    colloquialAliases: ['想吐', '噁心', '嘔吐', '食慾不振', '吃不下', '反胃'],
    meshTermsEn: ['Nausea', 'Vomiting', 'Anorexia'],
  },
  {
    id: 'weight_loss',
    labelZh: '體重異常減輕',
    descriptionZh: '未刻意減肥或節食，近半年體重下降超過 5%',
    colloquialAliases: ['體重減輕', '變瘦', '暴瘦', '體重下降'],
    meshTermsEn: ['Weight Loss'],
  },
  {
    id: 'night_sweats',
    labelZh: '夜間盜汗',
    descriptionZh: '睡覺時大量流汗，甚至弄濕睡衣或床單',
    colloquialAliases: ['盜汗', '夜間流汗', '睡覺流汗'],
    meshTermsEn: ['Night Sweats'],
  },
  {
    id: 'widespread_rash',
    labelZh: '全身性起疹或搔癢',
    descriptionZh: '跨越多個身體部位的紅疹、蕁麻疹風疹塊或皮膚搔癢',
    colloquialAliases: ['全身起疹', '過敏起疹', '蕁麻疹', '全身癢', '紅疹'],
    meshTermsEn: ['Exanthema', 'Urticaria', 'Pruritus'],
  },
];

export const REGION_SYMPTOM_OPTIONS: SymptomOption[] = [
  // 1. 頭部與顱骨 head_cranial
  {
    id: 'head_throbbing_pain',
    regionId: 'head_cranial',
    labelZh: '單側或雙側搏動性抽痛（像血管在跳）',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['偏頭痛', '太陽穴抽痛', '血管跳痛'],
    meshTermsEn: ['Headache', 'Migraine Disorders'],
  },
  {
    id: 'head_tight_band',
    regionId: 'head_cranial',
    labelZh: '整顆頭緊箍悶脹痛（像戴緊帽子）',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['緊縮型頭痛', '頭脹痛', '後腦緊繃痛'],
    meshTermsEn: ['Tension-Type Headache'],
  },
  {
    id: 'head_thunderclap',
    regionId: 'head_cranial',
    labelZh: '突發雷擊般爆炸性劇烈頭痛',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['雷擊頭痛', '突然劇烈頭痛', '頭快炸開'],
    meshTermsEn: ['Thunderclap Headache', 'Subarachnoid Hemorrhage'],
    isHighRiskIndicator: true,
  },
  {
    id: 'head_dizziness_vertigo',
    regionId: 'head_cranial',
    labelZh: '頭暈、天旋地轉（眩暈）或站不穩',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['頭暈', '眩暈', '天旋地轉', '暈眩', '站不穩'],
    meshTermsEn: ['Dizziness', 'Vertigo'],
  },
  {
    id: 'head_scalp_rash',
    regionId: 'head_cranial',
    labelZh: '頭皮表層紅疹、毛囊痛或帶狀水泡刺痛',
    recommendedDepth: 'superficial',
    colloquialAliases: ['頭皮痛', '頭皮長疹子', '頭皮刺痛'],
    meshTermsEn: ['Scalp Dermatoses'],
  },

  // 2. 臉部與五官 face_sensory
  {
    id: 'face_droop_numbness',
    regionId: 'face_sensory',
    labelZh: '單側臉麻、嘴角歪斜或講話口齒不清',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['臉歪嘴斜', '臉麻', '口齒不清', '講話大舌頭', '中風徵兆'],
    meshTermsEn: ['Facial Paralysis', 'Dysarthria', 'Stroke'],
    isHighRiskIndicator: true,
  },
  {
    id: 'face_jaw_radiation',
    regionId: 'face_sensory',
    labelZh: '下巴或下顎莫名酸痛悶脹（非牙齒蛀牙痛）',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['下巴痛', '下顎悶痛', '牙床悶痛'],
    meshTermsEn: ['Facial Pain', 'Mandibular Pain'],
    isHighRiskIndicator: true,
  },
  {
    id: 'face_sinus_nasal',
    regionId: 'face_sensory',
    labelZh: '鼻塞、黃綠濃鼻涕或臉頰眉心壓痛',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['鼻竇炎', '鼻塞', '流鼻水', '臉頰痛'],
    meshTermsEn: ['Sinusitis', 'Rhinitis'],
  },
  {
    id: 'face_eye_ear',
    regionId: 'face_sensory',
    labelZh: '眼睛紅痛視力模糊、或耳鳴耳朵痛',
    recommendedDepth: 'superficial',
    colloquialAliases: ['眼睛痛', '視力模糊', '耳鳴', '耳朵痛'],
    meshTermsEn: ['Eye Pain', 'Tinnitus', 'Earache'],
  },

  // 3. 頸部與咽喉 neck_throat
  {
    id: 'neck_sore_throat',
    regionId: 'neck_throat',
    labelZh: '喉嚨痛、吞嚥疼痛或異物卡頓感',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['喉嚨痛', '吞嚥困難', '喉嚨卡卡', '扁桃腺發炎'],
    meshTermsEn: ['Pharyngitis', 'Deglutition Disorders'],
  },
  {
    id: 'neck_stiff_meningeal',
    regionId: 'neck_throat',
    labelZh: '頸部異常僵硬、低頭下巴無法碰到胸口',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['頸部僵硬', '脖子硬', '低頭困難'],
    meshTermsEn: ['Neck Stiffness', 'Meningism'],
    isHighRiskIndicator: true,
  },
  {
    id: 'neck_muscle_strain',
    regionId: 'neck_throat',
    labelZh: '後頸肌肉緊繃酸痛、轉頭受限（如落枕）',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['落枕', '脖子痠痛', '肩頸僵硬', '頸椎痛'],
    meshTermsEn: ['Neck Pain', 'Cervicalgia'],
  },
  {
    id: 'neck_lump_lymph',
    regionId: 'neck_throat',
    labelZh: '頸部摸到腫塊或淋巴結腫大按壓痛',
    recommendedDepth: 'superficial',
    colloquialAliases: ['脖子腫塊', '淋巴結腫大', '甲狀腺腫'],
    meshTermsEn: ['Lymphadenopathy', 'Neck Mass'],
  },

  // 4. 左胸與心前區 chest_left
  {
    id: 'chest_l_crushing_pain',
    regionId: 'chest_left',
    labelZh: '左胸或胸口深層壓迫悶痛（像大石頭壓住）',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['心口悶', '胸悶', '胸口壓迫', '左胸悶痛', '心絞痛'],
    meshTermsEn: ['Chest Pain', 'Angina Pectoris', 'Myocardial Infarction'],
    isHighRiskIndicator: true,
  },
  {
    id: 'chest_l_dyspnea',
    regionId: 'chest_left',
    labelZh: '呼吸困難、喘不過氣或吸不到空氣',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['喘不過氣', '呼吸困難', '胸悶氣短', '很喘'],
    meshTermsEn: ['Dyspnea'],
    isHighRiskIndicator: true,
  },
  {
    id: 'chest_l_palpitation',
    regionId: 'chest_left',
    labelZh: '心悸、心跳忽快忽慢或漏拍感',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['心悸', '心跳很快', '心律不整', '心臟亂跳'],
    meshTermsEn: ['Palpitations', 'Arrhythmias, Cardiac'],
  },
  {
    id: 'chest_l_costochondritis',
    regionId: 'chest_left',
    labelZh: '按壓胸骨旁或轉身擴胸時定點刺痛',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['肋軟骨痛', '按壓胸口痛', '胸壁拉傷'],
    meshTermsEn: ['Costochondritis', 'Musculoskeletal Pain'],
  },
  {
    id: 'chest_l_skin_zoster',
    regionId: 'chest_left',
    labelZh: '左胸皮膚表面條狀刺痛、紅疹或水泡',
    recommendedDepth: 'superficial',
    colloquialAliases: ['胸口皮蛇', '胸口起疹子', '胸部皮膚刺痛'],
    meshTermsEn: ['Herpes Zoster', 'Thoracic Dermatoses'],
  },

  // 5. 右胸與胸廓 chest_right
  {
    id: 'chest_r_pleuritic',
    regionId: 'chest_right',
    labelZh: '深呼吸或咳嗽時右胸深層刺痛加劇',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['深呼吸右胸痛', '咳嗽胸痛', '右胸刺痛'],
    meshTermsEn: ['Pleurisy', 'Chest Pain'],
  },
  {
    id: 'chest_r_cough_sputum',
    regionId: 'chest_right',
    labelZh: '持續咳嗽、有濃痰或胸腔悶塞感',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['咳嗽', '有痰', '久咳不癒', '氣管癢'],
    meshTermsEn: ['Cough', 'Respiratory Tract Infections'],
  },
  {
    id: 'chest_r_muscle_rib',
    regionId: 'chest_right',
    labelZh: '右側肋骨或胸肌按壓痛、搬重物後拉傷',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['右肋骨痛', '右胸肌肉痛'],
    meshTermsEn: ['Rib Fractures', 'Intercostal Neuralgia'],
  },
  {
    id: 'chest_r_skin_rash',
    regionId: 'chest_right',
    labelZh: '右胸皮膚紅腫、水泡或乳房表淺腫痛',
    recommendedDepth: 'superficial',
    colloquialAliases: ['右胸紅疹', '右乳房痛'],
    meshTermsEn: ['Mastodynia', 'Exanthema'],
  },

  // 6. 上背部與肩胛區 upper_back
  {
    id: 'uback_tearing_pain',
    regionId: 'upper_back',
    labelZh: '上背突發刀割或撕裂般劇痛',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['後背撕裂痛', '背痛徹心'],
    meshTermsEn: ['Back Pain', 'Aneurysm, Dissecting'],
    isHighRiskIndicator: true,
  },
  {
    id: 'uback_myofascial',
    regionId: 'upper_back',
    labelZh: '肩胛骨內側（膏肓區）緊繃酸痛、按壓有激痛點',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['膏肓痛', '上背痠痛', '肩胛骨痛', '筋膜炎'],
    meshTermsEn: ['Myofascial Pain Syndromes', 'Back Pain'],
  },
  {
    id: 'uback_zoster_rash',
    regionId: 'upper_back',
    labelZh: '背部皮膚單側灼熱刺痛、紅斑或群聚水泡',
    recommendedDepth: 'superficial',
    colloquialAliases: ['背部皮蛇', '背部長水泡', '背部痘痘紅疹'],
    meshTermsEn: ['Herpes Zoster'],
  },

  // 7. 右上腹 abd_ruq (腹部五區之 1)
  {
    id: 'ruq_biliary_colic',
    regionId: 'abd_ruq',
    labelZh: '右上腹深層絞痛或脹痛（尤其進食油膩食物後加劇）',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['右上腹痛', '膽結石痛', '吃完油膩肚子痛', '右上肚子絞痛'],
    meshTermsEn: ['Biliary Colic', 'Cholecystitis, Acute', 'Cholelithiasis'],
  },
  {
    id: 'ruq_jaundice_tea_urine',
    regionId: 'abd_ruq',
    labelZh: '右上腹悶痛合併眼白皮膚變黃或深茶色尿',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['黃疸', '眼白變黃', '茶色尿', '肝區痛'],
    meshTermsEn: ['Jaundice', 'Cholestasis'],
    isHighRiskIndicator: true,
  },
  {
    id: 'ruq_muscle_strain',
    regionId: 'abd_ruq',
    labelZh: '右上腹壁肌肉出力或仰臥起坐時拉傷按壓痛',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['右上腹肌痛', '右肋緣肌肉痛'],
    meshTermsEn: ['Abdominal Wall'],
  },

  // 8. 左上腹 abd_luq (腹部五區之 2)
  {
    id: 'luq_gastric_distension',
    regionId: 'abd_luq',
    labelZh: '左上腹悶脹、飽脹感或頻繁打嗝排氣',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['左上腹痛', '左肋下脹氣', '胃脹'],
    meshTermsEn: ['Dyspepsia', 'Gastritis'],
  },
  {
    id: 'luq_radiating_back',
    regionId: 'abd_luq',
    labelZh: '左上腹持續劇痛並穿透放射至後背',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['左上腹痛到後背', '胰臟痛'],
    meshTermsEn: ['Pancreatitis', 'Abdominal Pain'],
    isHighRiskIndicator: true,
  },

  // 9. 中上腹與肚臍周圍 abd_epigastric (腹部五區之 3)
  {
    id: 'epi_burning_acid',
    regionId: 'abd_epigastric',
    labelZh: '中上腹（心窩）灼熱感、泛酸水或火燒心',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['火燒心', '胃酸逆流', '吐酸水', '胃灼熱', '胃食道逆流'],
    meshTermsEn: ['Gastroesophageal Reflux', 'Heartburn'],
  },
  {
    id: 'epi_ulcer_hunger_pain',
    regionId: 'abd_epigastric',
    labelZh: '上腹飢餓痛、半夜悶痛或進食後脹痛',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['胃痛', '胃潰瘍', '空腹胃痛', '心窩痛'],
    meshTermsEn: ['Peptic Ulcer', 'Gastritis', 'Epigastric Pain'],
  },
  {
    id: 'epi_periumbilical_cramps',
    regionId: 'abd_epigastric',
    labelZh: '肚臍周圍陣發性絞痛、腸鳴或伴隨腹瀉',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['肚臍周圍痛', '腸胃炎', '肚子絞痛', '拉肚子'],
    meshTermsEn: ['Gastroenteritis', 'Abdominal Cramps'],
  },
  {
    id: 'epi_tarry_stool_blood',
    regionId: 'abd_epigastric',
    labelZh: '上腹不適合併解黑色柏油便或吐咖啡色液體／鮮血',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['黑便', '解黑便', '吐血', '胃出血'],
    meshTermsEn: ['Gastrointestinal Hemorrhage', 'Melena'],
    isHighRiskIndicator: true,
  },

  // 10. 右下腹 abd_rlq (腹部五區之 4)
  {
    id: 'rlq_migrating_sharp_pain',
    regionId: 'abd_rlq',
    labelZh: '右下腹持續定點劇痛（或由肚臍周圍轉移至右下腹）',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['右下腹痛', '盲腸炎', '闌尾炎', '痛點轉移到右下腹'],
    meshTermsEn: ['Appendicitis', 'Abdominal Pain, Right Lower Quadrant'],
    isHighRiskIndicator: true,
  },
  {
    id: 'rlq_rebound_tenderness',
    regionId: 'abd_rlq',
    labelZh: '按壓右下腹放開瞬間劇痛（反彈痛）或走路震動即痛',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['反彈痛', '右下腹按壓痛', '肚子變硬'],
    meshTermsEn: ['Peritonitis', 'Appendicitis'],
    isHighRiskIndicator: true,
  },
  {
    id: 'rlq_mild_bowel_gas',
    regionId: 'abd_rlq',
    labelZh: '右下腹輕微悶脹、排便或排氣後可緩解',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['右下腹脹氣', '腸躁症'],
    meshTermsEn: ['Irritable Bowel Syndrome'],
  },

  // 11. 左下腹 abd_llq (腹部五區之 5)
  {
    id: 'llq_constipation_cramp',
    regionId: 'abd_llq',
    labelZh: '左下腹悶痛脹氣、伴隨排便習慣改變（便秘或腹瀉）',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['左下腹痛', '便秘肚子痛', '宿便痛'],
    meshTermsEn: ['Constipation', 'Irritable Bowel Syndrome'],
  },
  {
    id: 'llq_diverticulitis_pain',
    regionId: 'abd_llq',
    labelZh: '左下腹持續壓痛或伴隨血便、發燒',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['憩室炎', '左下腹劇痛', '血便'],
    meshTermsEn: ['Diverticulitis, Colonic', 'Colitis'],
  },

  // 12. 下背與後腰腎區 lower_back
  {
    id: 'lback_mechanical_strain',
    regionId: 'lower_back',
    labelZh: '彎腰、搬重物或久坐後下背肌肉酸痛緊繃',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['腰痛', '閃到腰', '下背痛', '腰肌勞損'],
    meshTermsEn: ['Low Back Pain'],
  },
  {
    id: 'lback_flank_renal_colic',
    regionId: 'lower_back',
    labelZh: '單側後腰（肋骨下緣腎區）突發劇烈絞痛或敲擊痛',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['腎結石痛', '後腰劇痛', '腎臟痛', '腰子痛'],
    meshTermsEn: ['Renal Colic', 'Nephrolithiasis', 'Pyelonephritis'],
  },

  // 13. 下腹恥骨與鼠蹊部 pelvis_groin
  {
    id: 'pelvis_dysuria_frequency',
    regionId: 'pelvis_groin',
    labelZh: '排尿灼熱刺痛、頻尿、尿急或尿液混濁帶血',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['尿道炎', '膀胱炎', '頻尿', '尿尿痛', '血尿'],
    meshTermsEn: ['Urinary Tract Infections', 'Cystitis', 'Dysuria'],
  },
  {
    id: 'pelvis_gyne_bleeding_pain',
    regionId: 'pelvis_groin',
    labelZh: '下腹深層抽痛合併異常陰道出血或分泌物異常',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['小腹痛', '經痛', '非經期出血', '骨盆腔痛'],
    meshTermsEn: ['Pelvic Pain', 'Uterine Hemorrhage', 'Dysmenorrhea'],
  },
  {
    id: 'pelvis_groin_hernia_node',
    regionId: 'pelvis_groin',
    labelZh: '鼠蹊部（腹股溝）站立或用力時鼓起腫塊、或淋巴腫痛',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['疝氣', '鼠蹊部腫塊', '跨下痛'],
    meshTermsEn: ['Hernia, Inguinal'],
  },
  {
    id: 'pelvis_skin_tinea',
    regionId: 'pelvis_groin',
    labelZh: '鼠蹊部皮膚表層紅疹、搔癢或脫屑',
    recommendedDepth: 'superficial',
    colloquialAliases: ['股癬', '跨下癢', '鼠蹊部紅疹'],
    meshTermsEn: ['Tinea Cruris', 'Intertrigo'],
  },

  // 14. 臀部與髖後側 buttocks_hip
  {
    id: 'butt_sciatica',
    regionId: 'buttocks_hip',
    labelZh: '臀部深處酸麻電擊感，並向下延伸至大腿或小腿',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['坐骨神經痛', '屁股麻到腳', '梨狀肌痛'],
    meshTermsEn: ['Sciatica', 'Piriformis Muscle Syndrome'],
  },
  {
    id: 'butt_perianal_hemorrhoid',
    regionId: 'buttocks_hip',
    labelZh: '肛門周圍腫痛、排便擦拭有鮮血或摸到突起物',
    recommendedDepth: 'superficial',
    colloquialAliases: ['痔瘡', '便血', '肛門痛'],
    meshTermsEn: ['Hemorrhoids'],
  },

  // 15. 右肩關節 shoulder_r
  {
    id: 'shoulder_r_rom_pain',
    regionId: 'shoulder_r',
    labelZh: '右肩上舉、穿衣或向後扣背時角度受限與疼痛',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['右肩痛', '右五十肩', '右手舉不高', '右旋轉肌痛'],
    meshTermsEn: ['Shoulder Pain', 'Rotator Cuff Injuries', 'Bursitis'],
  },
  {
    id: 'shoulder_r_referred_deep',
    regionId: 'shoulder_r',
    labelZh: '右肩深層悶痛（轉動肩膀時不特別痛，可能伴隨右上腹不適）',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['右肩反射痛', '右肩莫名悶痛'],
    meshTermsEn: ['Shoulder Pain', 'Referred Pain'],
  },

  // 16. 左肩關節 shoulder_l
  {
    id: 'shoulder_l_rom_pain',
    regionId: 'shoulder_l',
    labelZh: '左肩上舉或活動時關節肌肉疼痛、卡頓',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['左肩痛', '左五十肩', '左手舉不高'],
    meshTermsEn: ['Shoulder Pain', 'Rotator Cuff Injuries'],
  },
  {
    id: 'shoulder_l_cardiac_referred',
    regionId: 'shoulder_l',
    labelZh: '左肩深層酸麻悶脹（與姿勢無關，或伴隨胸悶喘）',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['胸悶傳到左肩', '左肩莫名麻痛'],
    meshTermsEn: ['Angina Pectoris', 'Shoulder Pain'],
    isHighRiskIndicator: true,
  },

  // 17. 右上臂與手肘 upper_arm_elbow_r
  {
    id: 'arm_r_elbow_tendon',
    regionId: 'upper_arm_elbow_r',
    labelZh: '右手肘外側或內側按壓痛、擰毛巾或提重物時疼痛',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['右手肘痛', '右網球肘', '高爾夫球肘'],
    meshTermsEn: ['Tennis Elbow', 'Elbow Tendinopathy'],
  },
  {
    id: 'arm_r_sudden_weakness',
    regionId: 'upper_arm_elbow_r',
    labelZh: '右上肢突發無力、平舉時會不自主垂落或麻木',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['右手臂無力', '右手抬不起來', '右側手麻無力'],
    meshTermsEn: ['Paresis', 'Hemiplegia', 'Stroke'],
    isHighRiskIndicator: true,
  },

  // 18. 左上臂與手肘 upper_arm_elbow_l
  {
    id: 'arm_l_elbow_tendon',
    regionId: 'upper_arm_elbow_l',
    labelZh: '左手肘按壓痛或出力時肌肉肌腱酸痛',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['左手肘痛', '左網球肘'],
    meshTermsEn: ['Tennis Elbow', 'Arm Pain'],
  },
  {
    id: 'arm_l_inner_radiation',
    regionId: 'upper_arm_elbow_l',
    labelZh: '左上臂內側莫名酸麻悶痛（尤其伴隨胸口不適時）',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['左手臂內側麻痛', '胸痛傳到左手'],
    meshTermsEn: ['Angina Pectoris', 'Referred Pain'],
    isHighRiskIndicator: true,
  },
  {
    id: 'arm_l_sudden_weakness',
    regionId: 'upper_arm_elbow_l',
    labelZh: '左上肢突發無力、無法握物或單側麻木',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['左手臂無力', '左手抬不起來'],
    meshTermsEn: ['Paresis', 'Stroke'],
    isHighRiskIndicator: true,
  },

  // 19. 右前臂、手腕與手指 forearm_wrist_hand_r
  {
    id: 'hand_r_carpal_numb',
    regionId: 'forearm_wrist_hand_r',
    labelZh: '右手掌與前三指發麻（騎車、用滑鼠或半夜易麻醒）',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['右手麻', '右腕隧道症候群', '右手指麻'],
    meshTermsEn: ['Carpal Tunnel Syndrome', 'Paresthesia'],
  },
  {
    id: 'hand_r_wrist_joint',
    regionId: 'forearm_wrist_hand_r',
    labelZh: '右手腕大拇指側肌腱痛（媽媽手）或手指關節晨間僵硬腫痛',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['右手腕痛', '右媽媽手', '右手指關節痛', '板機指'],
    meshTermsEn: ['De Quervain Disease', 'Arthritis'],
  },
  {
    id: 'hand_r_skin_eczema',
    regionId: 'forearm_wrist_hand_r',
    labelZh: '右手部皮膚乾燥龜裂、汗疱疹小水泡或紅癢',
    recommendedDepth: 'superficial',
    colloquialAliases: ['富貴手', '汗疱疹', '手部濕疹'],
    meshTermsEn: ['Hand Dermatoses', 'Eczema, Dyshidrotic'],
  },

  // 20. 左前臂、手腕與手指 forearm_wrist_hand_l
  {
    id: 'hand_l_carpal_numb',
    regionId: 'forearm_wrist_hand_l',
    labelZh: '左手掌或手指發麻、刺痛感',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['左手麻', '左腕隧道症候群', '左手指麻'],
    meshTermsEn: ['Carpal Tunnel Syndrome', 'Paresthesia'],
  },
  {
    id: 'hand_l_wrist_joint',
    regionId: 'forearm_wrist_hand_l',
    labelZh: '左手腕或手指關節腫脹疼痛、活動卡頓',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['左手腕痛', '左媽媽手', '左手指關節痛'],
    meshTermsEn: ['De Quervain Disease', 'Arthritis'],
  },
  {
    id: 'hand_l_skin_eczema',
    regionId: 'forearm_wrist_hand_l',
    labelZh: '左手皮膚紅疹、水泡或脫皮搔癢',
    recommendedDepth: 'superficial',
    colloquialAliases: ['左手濕疹', '左手紅疹'],
    meshTermsEn: ['Hand Dermatoses'],
  },

  // 21. 右大腿與膝關節 thigh_knee_r
  {
    id: 'knee_r_joint_pain',
    regionId: 'thigh_knee_r',
    labelZh: '右膝上下樓梯、蹲下站起時關節疼痛、腫脹或有摩擦聲',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['右膝蓋痛', '右膝退化', '右膝腫脹'],
    meshTermsEn: ['Osteoarthritis, Knee', 'Arthralgia'],
  },
  {
    id: 'knee_r_sudden_weakness',
    regionId: 'thigh_knee_r',
    labelZh: '右下肢突發無力、走路拖步或單側感覺喪失',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['右腳無力', '右腿麻木無力'],
    meshTermsEn: ['Paresis', 'Stroke'],
    isHighRiskIndicator: true,
  },

  // 22. 左大腿與膝關節 thigh_knee_l
  {
    id: 'knee_l_joint_pain',
    regionId: 'thigh_knee_l',
    labelZh: '左膝上下樓梯、運動或負重時關節疼痛腫脹',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['左膝蓋痛', '左膝退化', '左膝腫脹'],
    meshTermsEn: ['Osteoarthritis, Knee', 'Arthralgia'],
  },
  {
    id: 'knee_l_sudden_weakness',
    regionId: 'thigh_knee_l',
    labelZh: '左下肢突發無力、站立不穩或單側麻木',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['左腳無力', '左腿麻木無力'],
    meshTermsEn: ['Paresis', 'Stroke'],
    isHighRiskIndicator: true,
  },

  // 23. 右小腿、腳踝與足部 calf_ankle_foot_r
  {
    id: 'calf_r_dvt_swelling',
    regionId: 'calf_ankle_foot_r',
    labelZh: '右小腿單側明顯腫脹、緊繃發熱或捏壓小腿肚劇痛',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['右小腿水腫', '右小腿腫痛', '右腳單側腫'],
    meshTermsEn: ['Venous Thrombosis', 'Edema'],
    isHighRiskIndicator: true,
  },
  {
    id: 'foot_r_ankle_plantar',
    regionId: 'calf_ankle_foot_r',
    labelZh: '右腳踝扭傷腫痛、或早晨下床右腳後跟踩地刺痛（足底筋膜）',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['右腳踝扭傷', '右足底筋膜炎', '右腳底痛'],
    meshTermsEn: ['Ankle Injuries', 'Fasciitis, Plantar'],
  },
  {
    id: 'foot_r_gout_toe',
    regionId: 'calf_ankle_foot_r',
    labelZh: '右腳大拇趾關節或足背突發紅腫熱劇痛（疑似痛風發作）',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['右腳痛風', '右腳大拇指痛'],
    meshTermsEn: ['Gout', 'Arthritis, Gouty'],
  },
  {
    id: 'foot_r_cellulitis_skin',
    regionId: 'calf_ankle_foot_r',
    labelZh: '右小腿或右足皮膚表面紅腫發燙擴散、或香港腳水泡脫皮',
    recommendedDepth: 'superficial',
    colloquialAliases: ['右腳蜂窩性組織炎', '右腳皮膚紅腫', '香港腳'],
    meshTermsEn: ['Cellulitis', 'Tinea Pedis'],
  },

  // 24. 左小腿、腳踝與足部 calf_ankle_foot_l
  {
    id: 'calf_l_dvt_swelling',
    regionId: 'calf_ankle_foot_l',
    labelZh: '左小腿單側明顯腫脹、緊繃發熱或壓痛',
    recommendedDepth: 'deep_visceral',
    colloquialAliases: ['左小腿水腫', '左小腿腫痛', '左腳單側腫'],
    meshTermsEn: ['Venous Thrombosis', 'Edema'],
    isHighRiskIndicator: true,
  },
  {
    id: 'foot_l_ankle_plantar',
    regionId: 'calf_ankle_foot_l',
    labelZh: '左腳踝扭傷、或左腳底筋膜踩地疼痛',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['左腳踝扭傷', '左足底筋膜炎', '左腳底痛'],
    meshTermsEn: ['Ankle Injuries', 'Fasciitis, Plantar'],
  },
  {
    id: 'foot_l_gout_toe',
    regionId: 'calf_ankle_foot_l',
    labelZh: '左腳大拇趾關節突發紅腫熱劇痛（疑似痛風）',
    recommendedDepth: 'musculoskeletal',
    colloquialAliases: ['左腳痛風', '左腳大拇指痛'],
    meshTermsEn: ['Gout', 'Arthritis, Gouty'],
  },
  {
    id: 'foot_l_cellulitis_skin',
    regionId: 'calf_ankle_foot_l',
    labelZh: '左小腿或左足皮膚表面紅腫發燙或表皮感染',
    recommendedDepth: 'superficial',
    colloquialAliases: ['左腳蜂窩性組織炎', '左腳皮膚紅腫'],
    meshTermsEn: ['Cellulitis', 'Tinea Pedis'],
  },
];

export function getSymptomsByRegion(regionId: BodyRegionId): SymptomOption[] {
  return REGION_SYMPTOM_OPTIONS.filter((s) => s.regionId === regionId);
}
