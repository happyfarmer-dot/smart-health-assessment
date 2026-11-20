import {
  DiagnosisRequestPayload,
  DiagnosticConfidenceAssessment,
  DifferentialAndAnalysisResult,
  PrimaryDiagnosisResult,
  SecondaryDifferentialItem,
  SuspectedDiseaseDiagnosis,
} from '@/types/cdss';
import { evaluateIatrogenicDrugCauses } from './safetyAndIatrogenicEngine';
import { evaluateObjectiveVitalSigns } from './vitalSignsEvaluator';

interface DiseaseKnowledgeTemplate {
  diseaseId: string;
  diseaseNameZh: string;
  diseaseNameEn: string;
  targetRegions: string[];
  preferredDepths: string[];
  keyQualities: string[];
  keySpecifics: string[];
  keySystemics: string[];
  dynamicWeightTag?: string;
  involvedSpecialtiesTw: string[];
  typicalSupportZh: string[];
  typicalLackingCheckZh: string[];
  pathophysiologyPlainZh: string;
  confirmatoryTests: Array<{
    testNameZh: string;
    expectedFindingOrPurposeZh: string;
  }>;
  secondaryPair: SecondaryDifferentialItem;
  referredPainInsightZh: string;
}

const CLINICAL_DISEASE_KNOWLEDGE_BASE: DiseaseKnowledgeTemplate[] = [
  // 1. 右上腹：急性膽囊炎 / 膽結石嵌頓絞痛
  {
    diseaseId: 'dx_acute_cholecystitis_biliary_colic',
    diseaseNameZh: '膽石症併發膽道絞痛或急性膽囊炎（小石頭卡住膽囊出口引發收縮絞痛與發炎）',
    diseaseNameEn: 'Symptomatic Cholelithiasis / Acute Cholecystitis',
    targetRegions: ['abd_ruq', 'abd_epigastric', 'shoulder_r', 'upper_back'],
    preferredDepths: ['deep_visceral'],
    keyQualities: ['q_colicky_cramping', 'q_dull_ache', 'q_tenderness_on_palpation'],
    keySpecifics: ['sp_ruq_postprandial_biliary', 'sp_ruq_murphy_inspiratory_arrest', 'sp_shoulder_r_biliary_referred'],
    keySystemics: ['sys_nausea', 'sys_vomiting', 'sys_high_fever', 'sys_low_grade_fever', 'sys_jaundice'],
    dynamicWeightTag: 'WEIGHT_BILIARY_CHOLECYSTITIS',
    involvedSpecialtiesTw: ['肝膽腸胃科', '一般外科'],
    typicalSupportZh: [
      '右上腹（肝膽區）深層絞痛或壓痛，常於進食油膩大餐後誘發',
      '可能透過橫膈膜神經傳導引發右肩或右肩胛骨牽涉痛（Referred Pain）',
    ],
    typicalLackingCheckZh: [
      '若尚未合併高燒（>38°C）、畏寒或眼白皮膚變黃（黃疸），可能仍處於單純膽道絞痛階段而未演變為急性阻塞性膽管炎',
    ],
    pathophysiologyPlainZh:
      '當進食含有油脂的食物時，十二指腸會分泌「膽囊收縮素 (CCK)」刺激膽囊強力收縮排空膽汁；若膽囊內有結石或膽泥卡在膽囊管出口，膽囊內壓力驟升便會引發劇烈右上腹深層絞痛，並刺激右側橫膈膜神經放射至右肩胛。',
    confirmatoryTests: [
      {
        testNameZh: '腹部超音波（Abdominal Ultrasonography）— 首選黃金標準',
        expectedFindingOrPurposeZh: '直接檢視膽囊內是否有高回音結石伴隨後方聲影、膽囊壁是否增厚（>3mm）、膽囊周圍積液或超音波墨菲氏徵象（Sonographic Murphy sign）',
      },
      {
        testNameZh: '血液生化檢驗：肝膽酵素與膽紅素（AST, ALT, ALP, GGT, Total/Direct Bilirubin）＋白血球與 CRP',
        expectedFindingOrPurposeZh: '評估膽道是否阻塞導致膽紅素與鹼性磷酸酶 (ALP/GGT) 上升，以及白血球/CRP 發炎程度',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '急性膽管炎（Acute Cholangitis）或總膽管結石阻塞',
      diseaseNameEn: 'Acute Cholangitis / Choledocholithiasis',
      whyConsiderToRuleOutZh: '若結石掉入總膽管造成膽汁無法排入腸道並合併細菌逆行感染（夏科氏三聯徵：右上腹痛＋高燒畏寒＋黃疸茶色尿），屬需緊急內視鏡引流之急症。',
      keyRuleOutTestZh: '直接膽紅素 (Direct Bilirubin)、磁振膽胰管造影 (MRCP) 或內視鏡逆行性膽胰管攝影 (ERCP)。',
    },
    referredPainInsightZh:
      '右上腹膽囊與肝包膜受橫膈神經（Phrenic nerve, C3-C5）感覺分支支配，該神經與右肩鎖骨上神經共用脊髓節段，因此膽囊發炎常在「右肩關節或右肩胛骨下角」產生深層牽涉痛。',
  },

  // 2. 中上腹：胃食道逆流 (GERD) 與消化性潰瘍 (Peptic Ulcer Disease)
  {
    diseaseId: 'dx_gerd_peptic_ulcer',
    diseaseNameZh: '胃食道逆流症或胃十二指腸消化性潰瘍（胃酸侵蝕食道或胃十二指腸黏膜）',
    diseaseNameEn: 'Gastroesophageal Reflux Disease (GERD) / Peptic Ulcer Disease (PUD)',
    targetRegions: ['abd_epigastric', 'chest_left', 'neck_throat'],
    preferredDepths: ['deep_visceral'],
    keyQualities: ['q_burning', 'q_dull_ache', 'q_foreign_body_sensation'],
    keySpecifics: ['sp_epi_acid_regurgitation_heartburn', 'sp_epi_hunger_nocturnal_ulcer'],
    keySystemics: ['sys_nausea', 'sys_general_bloating', 'sys_anorexia'],
    dynamicWeightTag: 'WEIGHT_PEPTIC_ULCER_GERD',
    involvedSpecialtiesTw: ['肝膽腸胃科'],
    typicalSupportZh: [
      '中上腹（心窩部）或胸骨後灼熱痛（火燒心）、悶脹感或泛酸水',
      '與進食時段（空腹飢餓痛或餐後平躺加劇）具有高度時間關聯性',
    ],
    typicalLackingCheckZh: [
      '若無解黑色柏油便（Melena）、吐咖啡色液體或不明原因體重減輕、吞嚥阻滯感，代表目前較低機率合併潰瘍出血或結構性狹窄',
    ],
    pathophysiologyPlainZh:
      '當下食道括約肌（賁門）張力鬆弛時，胃酸與胃蛋白酶會逆流向上刺激缺乏保護層的食道黏膜引發火燒心與胸口悶痛；若胃或十二指腸黏膜受幽門螺旋桿菌或藥物（如 NSAIDs）破壞，胃酸直接接觸黏膜下神經便會產生週期性的空腹飢餓痛或餐後悶痛。',
    confirmatoryTests: [
      {
        testNameZh: '上消化道內視鏡（胃鏡，Esophagogastroduodenoscopy, EGD）',
        expectedFindingOrPurposeZh: '直接目視食道下段是否有逆流性食道炎糜爛、巴瑞特氏食道，以及胃竇或十二指腸球部是否有潰瘍病灶',
      },
      {
        testNameZh: '幽門螺旋桿菌檢測（碳 13 尿素呼氣試驗 C13-UBT 或糞便抗原檢測）',
        expectedFindingOrPurposeZh: '確認是否有幽門螺旋桿菌（H. pylori）慢性感染導致潰瘍反覆發作',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '非典型下壁心肌缺氧（呈現上腹心窩悶痛表現）或消化性潰瘍穿孔／出血',
      diseaseNameEn: 'Inferior Wall Myocardial Ischemia / Complicated Peptic Ulcer',
      whyConsiderToRuleOutZh: '心臟下壁緊貼橫膈膜與胃底部，部分下壁心肌梗塞患者會以「上腹心窩劇痛併冒冷汗、噁心」表現而易被誤認為胃痛。',
      keyRuleOutTestZh: '若具有三高病史或運動誘發上腹悶痛，需安排 12 導程心電圖 (ECG) 排除下壁心肌缺氧；若疑出血則檢驗全血球計數血紅素 (Hb) 與糞便潛血。',
    },
    referredPainInsightZh:
      '食道下段與心臟在胸腔內共用自主神經傳入路徑（T1-T4 交感神經節），因此嚴重的胃酸逆流或食道痙攣常在「左胸心前區」引發極似心絞痛的深層胸悶，並向上引起「咽喉異物感（喉球症）」。',
  },

  // 3. 右下腹：急性闌尾炎 (Acute Appendicitis)
  {
    diseaseId: 'dx_acute_appendicitis',
    diseaseNameZh: '急性闌尾炎（俗稱急性盲腸炎，闌尾管腔阻塞引發細菌發炎腫脹）',
    diseaseNameEn: 'Acute Appendicitis',
    targetRegions: ['abd_rlq', 'abd_epigastric'],
    preferredDepths: ['deep_visceral'],
    keyQualities: ['q_rebound_tenderness', 'q_sharp_stabbing', 'q_tenderness_on_palpation'],
    keySpecifics: ['sp_rlq_mcburney_migrating', 'sp_rlq_psoas_jarring_pain'],
    keySystemics: ['sys_high_fever', 'sys_low_grade_fever', 'sys_anorexia', 'sys_nausea', 'sys_vomiting'],
    dynamicWeightTag: 'WEIGHT_ACUTE_APPENDICITIS',
    involvedSpecialtiesTw: ['一般外科', '急診醫學科', '肝膽腸胃科'],
    typicalSupportZh: [
      '右下腹（闌尾馬克伯尼點 McBurney point）深層定點疼痛或壓痛',
      '典型轉移痛（最初由中上腹／肚臍周圍悶痛，隨後轉移固定於右下腹）或按壓放開瞬間之反彈痛',
    ],
    typicalLackingCheckZh: [
      '若目前尚未出現高燒、反彈痛或走路震動即痛，可能處於早期黏膜發炎階段，或為迴盲部腸炎／腸系膜淋巴結炎',
    ],
    pathophysiologyPlainZh:
      '闌尾管腔因糞石或淋巴組織增生阻塞後，腔內黏液持續分泌使壓力上升：初期刺激內臟自主神經（T10 節段），大腦會定位在「肚臍周圍或中上腹悶痛」；數小時後發炎穿透闌尾壁刺激右下腹壁層腹膜（Parietal peritoneum）體神經，痛點便會精準轉移並固定在「右下腹」，且腹膜受震動拉扯即引發反彈痛。',
    confirmatoryTests: [
      {
        testNameZh: '腹部與骨盆腔顯影電腦斷層（Abdominal & Pelvic CT with Contrast）或高解析腹部超音波',
        expectedFindingOrPurposeZh: '確認闌尾直徑是否腫大（> 6mm）、管壁增厚強化、周圍脂肪發炎浸潤（Fat stranding）或有無糞石（Appendicolith）與穿孔膿瘍',
      },
      {
        testNameZh: '全血球計數與分類（CBC/DC）＋ C 反應蛋白（CRP）＋ 尿液常規檢查（U/A）',
        expectedFindingOrPurposeZh: '檢視白血球 (WBC) 與嗜中性球比例是否左移升高（Left shift），並透過驗尿排除右側輸尿管結石；育齡女性必驗尿液 β-hCG 排除子宮外孕',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '右側輸尿管結石絞痛、急性迴盲部憩室炎，或（生理女性）右側卵巢囊腫扭轉／子宮外孕',
      diseaseNameEn: 'Right Ureteral Stone / Cecal Diverticulitis / Right Adnexal Torsion or Ectopic Pregnancy',
      whyConsiderToRuleOutZh: '右下腹同時包含盲腸、右側輸尿管與女性右側卵巢輸卵管，臨床表現高度重疊，必須透過影像與驗孕／驗尿精準區分是否需緊急手術。',
      keyRuleOutTestZh: '尿液紅血球潛血（排除結石）、女性血清或尿液 β-hCG 驗孕與婦產科超音波（排除子宮外孕與卵巢扭轉）。',
    },
    referredPainInsightZh:
      '急性闌尾炎是西醫臨床最經典的「內臟痛轉移為體壁痛」範例：早期內臟傳入神經進入胸髓第 10 節（對應肚臍周圍皮節），後期波及右下腹壁層腹膜才轉為右下腹定點劇痛。',
  },

  // 4. 左胸與心前區：冠狀動脈心絞痛 / 心肌缺氧 (Coronary Artery Disease / Angina)
  {
    diseaseId: 'dx_coronary_angina_ischemia',
    diseaseNameZh: '冠狀動脈心肌缺氧／心絞痛（供應心臟肌肉的冠狀動脈狹窄導致血流供需失衡）',
    diseaseNameEn: 'Coronary Artery Disease (CAD) / Angina Pectoris',
    targetRegions: ['chest_left', 'shoulder_l', 'upper_arm_elbow_l', 'face_sensory'],
    preferredDepths: ['deep_visceral'],
    keyQualities: ['q_crushing_pressure', 'q_dull_ache'],
    keySpecifics: ['sp_chest_l_retrosternal_angina', 'sp_chest_l_palpitation_dyspnea', 'sp_shoulder_l_cardiac_referred', 'sp_arm_l_inner_cardiac_radiation'],
    keySystemics: ['sys_exertional_dyspnea', 'sys_palpitations_arrhythmia', 'sys_orthopnea'],
    dynamicWeightTag: 'WEIGHT_CORONARY_ANGINA_ACS',
    involvedSpecialtiesTw: ['心臟血管內科', '急診醫學科'],
    typicalSupportZh: [
      '左胸或胸骨後深層重壓感、緊縮悶塞痛',
      '活動出力時加劇，或伴隨呼吸氣促、心悸、左肩／左上臂內側／下巴放射酸麻',
    ],
    typicalLackingCheckZh: [
      '若疼痛僅在手指按壓胸骨旁特定一點時才痛（壓痛），或僅在姿勢轉動時瞬間刺痛幾秒鐘，則偏向胸壁肌肉軟骨問題而非典型心絞痛',
    ],
    pathophysiologyPlainZh:
      '當冠狀動脈因動脈粥狀硬化斑塊出現狹窄時，在運動、爬樓梯或情緒激動導致心跳加快、心肌耗氧量上升的狀態下，狹窄血管無法及時提供足夠含氧血；心肌細胞缺氧進行無氧代謝產生乳酸與腺苷（Adenosine），刺激心臟交感神經引發胸骨後沉重的壓迫緊縮感。',
    confirmatoryTests: [
      {
        testNameZh: '靜態 12 導程心電圖（12-Lead ECG）＋ 高敏感度心肌旋轉蛋白（hs-Troponin I/T）抽血',
        expectedFindingOrPurposeZh: '檢查是否有 ST 段上升／下降或 T 波倒置等心肌缺血波形，並以 Troponin 排除急性心肌細胞壞死（心肌梗塞）',
      },
      {
        testNameZh: '心臟超音波（Echocardiography）、運動心電圖（Treadmill）或冠狀動脈電腦斷層血管攝影（CCTA）',
        expectedFindingOrPurposeZh: '評估左心室射出分率 (LVEF)、心室壁收縮是否異常，以及冠狀動脈鈣化與狹窄比例',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '急性心包膜炎、肺動脈栓塞，或胸主動脈剝離',
      diseaseNameEn: 'Acute Pericarditis / Pulmonary Embolism / Thoracic Aortic Dissection',
      whyConsiderToRuleOutZh: '同樣位於胸腔深層，若胸痛在平躺深吸氣加劇、前傾緩解需考慮心包膜炎；若突發撕裂痛延伸至上背且雙手血壓不對稱則必須排除主動脈剝離。',
      keyRuleOutTestZh: '血液 D-dimer、胸部 X 光 (CXR) 與胸主動脈／肺動脈顯影電腦斷層 (CTA)。',
    },
    referredPainInsightZh:
      '心臟感覺神經纖維進入脊髓 C8–T5 節段，與左側胸大肌、左肩、左上臂尺側（內側）及下顎頸部皮節在脊髓背角發生匯聚（Convergence-Projection Theory），導致大腦將心肌缺氧誤判為左肩臂或下巴酸痛。',
  },

  // 5. 胸廓與上背肌肉骨骼：肋軟骨炎 / 胸壁肌筋膜疼痛症候群
  {
    diseaseId: 'dx_costochondritis_thoracic_myofascial',
    diseaseNameZh: '肋軟骨炎或胸背部肌筋膜疼痛症候群（連接胸骨與肋骨的軟骨或胸背肌群發炎緊繃）',
    diseaseNameEn: 'Costochondritis / Thoracic Myofascial Pain Syndrome',
    targetRegions: ['chest_left', 'chest_right', 'upper_back'],
    preferredDepths: ['musculoskeletal'],
    keyQualities: ['q_tenderness_on_palpation', 'q_sharp_stabbing', 'q_deep_soreness'],
    keySpecifics: ['sp_chest_l_costal_cartilage', 'sp_uback_rhomboid_myofascial'],
    keySystemics: [],
    dynamicWeightTag: 'WEIGHT_COSTOCHONDRITIS_MYOFASCIAL',
    involvedSpecialtiesTw: ['復健科', '骨科', '家庭醫學科'],
    typicalSupportZh: [
      '標記為「肌肉與關節層級」，且具有明確的局部按壓痛（Tenderness on palpation）',
      '擴胸、轉身、搬物或深呼吸胸廓擴張拉扯時疼痛較明顯',
    ],
    typicalLackingCheckZh: [
      '缺乏運動誘發之胸骨後大範圍重壓窒息感，亦無冒冷汗、平躺呼吸困難或低血氧等心肺衰竭徵象',
    ],
    pathophysiologyPlainZh:
      '胸骨與第 2～5 肋骨交界處的透明軟骨（肋軟骨）或肩胛骨內側菱形肌／斜方肌，常因長時間姿勢不良、劇烈咳嗽震動、搬提重物或單側出力，造成局部微小拉傷與無菌性發炎，因此在手指直接按壓病灶或胸廓擴張拉扯軟骨時會重現刺痛與痠痛。',
    confirmatoryTests: [
      {
        testNameZh: '臨床理學觸診（局部肋軟骨壓痛重現測試）＋ 基礎胸部 X 光（Chest X-Ray）',
        expectedFindingOrPurposeZh: '觸診能100%重現患者主訴之痛點，並透過胸部 X 光確認無氣胸、肋骨骨裂或肺部實質病灶',
      },
      {
        testNameZh: '基礎靜態心電圖（12-Lead ECG）— 針對左胸痛患者之安全排除檢查',
        expectedFindingOrPurposeZh: '在確立為良性肋軟骨炎前，常規確認心電圖無缺血變化以確保安全',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '胸椎皮節帶狀疱疹（皮蛇）前驅期神經痛，或肋間神經痛',
      diseaseNameEn: 'Pre-eruptive Thoracic Herpes Zoster / Intercostal Neuralgia',
      whyConsiderToRuleOutZh: '帶狀疱疹病毒活化初期，在皮膚尚未長出紅疹與水泡前 3～5 天，常先在單側胸壁或上背產生條狀灼熱刺痛或觸電感。',
      keyRuleOutTestZh: '連續觀察單側皮節表面於 3～7 日內是否浮現群聚性紅斑與透明小水泡。',
    },
    referredPainInsightZh:
      '胸椎小面關節或上背膏肓區（菱形肌）的肌筋膜激痛點（Trigger points）常沿著肋間肌筋膜向前胸傳導，造成前後呼應的胸背緊繃痛。',
  },

  // 6. 左下腹与腸道：大腸激躁症 (IBS) 或急性結腸憩室炎 (Diverticulitis)
  {
    diseaseId: 'dx_ibs_or_colonic_diverticulitis',
    diseaseNameZh: '功能性腸道痙攣（大腸激躁症 IBS）或乙狀結腸／降結腸憩室發炎',
    diseaseNameEn: 'Irritable Bowel Syndrome (IBS) / Colonic Diverticulitis',
    targetRegions: ['abd_llq', 'abd_epigastric', 'abd_rlq'],
    preferredDepths: ['deep_visceral'],
    keyQualities: ['q_colicky_cramping', 'q_dull_ache', 'q_tenderness_on_palpation'],
    keySpecifics: ['sp_llq_ibs_bowel_relief', 'sp_llq_diverticulitis_constant', 'sp_epi_periumbilical_gastroenteritis'],
    keySystemics: ['sys_diarrhea', 'sys_constipation', 'sys_general_bloating', 'sys_low_grade_fever'],
    dynamicWeightTag: 'WEIGHT_IBS_COLONIC',
    involvedSpecialtiesTw: ['肝膽腸胃科', '大腸直腸外科'],
    typicalSupportZh: [
      '左下腹或下腹陣發性絞痛、脹氣，伴隨排便頻率或糞便型態改變（腹瀉或便秘）',
      '排便或排氣後腹部脹痛感可獲得部分緩解（典型腸道蠕動性疼痛）',
    ],
    typicalLackingCheckZh: [
      '若左下腹由陣發絞痛轉為「持續不間斷之定點壓痛」且合併發燒（>38°C），則傾向急性結腸憩室炎而非單純腸躁症',
    ],
    pathophysiologyPlainZh:
      '降結腸與乙狀結腸位於左下腹，當腸道神經叢對腸腔氣體擴張過度敏感（內臟高敏感性）或受飲食、壓力刺激時，平滑肌不協調強直收縮便會引發陣發性絞痛；若結腸壁上的囊狀突起（憩室）遭糞石阻塞發炎，則會產生局部持續性左下腹壓痛與發燒。',
    confirmatoryTests: [
      {
        testNameZh: '糞便潛血免疫分析（FOBT / FIT）、糞便常規與血液發炎指數（CBC, CRP）',
        expectedFindingOrPurposeZh: '確認是否有腸道黏膜微出血、白血球發炎反應或感染性腸炎',
      },
      {
        testNameZh: '大腸內視鏡（Colonoscopy）或腹部電腦斷層（若疑似急性憩室炎發作期先做 CT 避免內視鏡穿孔風險）',
        expectedFindingOrPurposeZh: '排除大腸息肉、發炎性腸道疾病 (IBD) 或確認結腸憩室周圍發炎程度',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '發炎性腸道疾病（潰瘍性結腸炎／克隆氏症）或大腸直腸結構性病灶',
      diseaseNameEn: 'Inflammatory Bowel Disease (Ulcerative Colitis / Crohn Disease) or Colorectal Neoplasm',
      whyConsiderToRuleOutZh: '若左下腹痛伴隨慢性血便、黏液便、夜間腹痛痛醒、不明原因體重減輕或缺鐵性貧血，必須透過大腸鏡排除器質性腸道病變。',
      keyRuleOutTestZh: '糞便鈣衛蛋白（Fecal Calprotectin）與全大腸內視鏡切片檢查。',
    },
    referredPainInsightZh:
      '乙狀結腸與直腸受骨盆內臟神經支配，劇烈痙攣時痛感常向下延伸至恥骨上、薦椎尾骨區或左鼠蹊部。',
  },

  // 7. 後腰與骨盆泌尿：泌尿道結石絞痛 (Urolithiasis) / 急性膀胱泌尿道感染 (UTI / Pyelonephritis)
  {
    diseaseId: 'dx_urolithiasis_uti_pyelonephritis',
    diseaseNameZh: '泌尿道結石（腎結石／輸尿管結石絞痛）或急性泌尿道感染（膀胱炎／腎盂腎炎）',
    diseaseNameEn: 'Urolithiasis (Renal / Ureteral Colic) or Acute Urinary Tract Infection (Cystitis / Pyelonephritis)',
    targetRegions: ['lower_back', 'pelvis_groin', 'abd_rlq', 'abd_llq'],
    preferredDepths: ['deep_visceral'],
    keyQualities: ['q_colicky_cramping', 'q_burning', 'q_sharp_stabbing'],
    keySpecifics: ['sp_lback_cva_renal_flank', 'sp_pelvis_suprapubic_uti'],
    keySystemics: ['sys_dysuria', 'sys_frequency_nocturia', 'sys_hematuria_tea_urine', 'sys_high_fever', 'sys_chills_rigors', 'sys_nausea'],
    dynamicWeightTag: 'WEIGHT_UROLITHIASIS_UTI',
    involvedSpecialtiesTw: ['泌尿科', '腎臟內科', '家庭醫學科'],
    typicalSupportZh: [
      '單側後腰（肋脊角腎區）劇烈絞痛／敲擊痛，或恥骨上下腹悶痛',
      '伴隨排尿灼熱疼痛、頻尿尿急、血尿，或疼痛由後腰向下放射至鼠蹊部',
    ],
    typicalLackingCheckZh: [
      '若無畏寒打冷顫與高燒（>38°C），感染通常侷限於下泌尿道（膀胱炎）；一旦合併高燒畏寒與後腰敲擊劇痛，則需高度懷疑細菌上行至腎臟引發急性腎盂腎炎',
    ],
    pathophysiologyPlainZh:
      '當腎盂內的小結石掉入細窄的輸尿管時，輸尿管平滑肌為了排出異物會產生劇烈痙攣蠕動，同時上方尿液受阻造成腎盂急性水腫擴張，拉扯腎包膜神經引發刀割般後腰絞痛；而細菌經尿道進入膀胱黏膜則會引發排尿灼熱與頻尿感。',
    confirmatoryTests: [
      {
        testNameZh: '尿液常規與沉渣鏡檢（Urinalysis & Microscopy）＋ 尿液細菌培養（Urine Culture）',
        expectedFindingOrPurposeZh: '檢驗尿中是否有紅血球（潛血反應，支持結石或發炎）、白血球酯酶（Leukocyte esterase）、亞硝酸鹽（Nitrite）與膿尿（Pyuria）',
      },
      {
        testNameZh: '腎臟與膀胱超音波（Renal & Bladder Ultrasound）、腹部 X 光（KUB）或無顯影螺旋電腦斷層（Non-contrast CT）',
        expectedFindingOrPurposeZh: '直接確認是否有腎水腫（Hydronephrosis）以及輸尿管結石之確切大小與卡住位置',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '阻塞性腎水腫併發敗血性腎盂腎炎，或（老年高血壓患者）腹主動脈瘤擴大',
      diseaseNameEn: 'Obstructive Urosepsis / Abdominal Aortic Aneurysm (AAA)',
      whyConsiderToRuleOutZh: '結石若完全堵住輸尿管又合併細菌感染，可能迅速引發敗血性休克；而 60 歲以上高血壓患者若突發後腰深層撕裂搏動痛則需排除腹主動脈病變。',
      keyRuleOutTestZh: '血液肌酸酐 (Creatinine)、降鈣素原 (Procalcitonin) 與腹部電腦斷層。',
    },
    referredPainInsightZh:
      '輸尿管上段與生殖腺神經同源（T11–L2），結石向下移動刺激髂腹股溝神經與生殖股神經時，痛感會典型地由「單側後腰」斜向下方放射至「同側下腹、鼠蹊部及外生殖器」。',
  },

  // 8. 頭頸神經：偏頭痛 (Migraine) / 緊縮型頭痛 (Tension-Type Headache)
  {
    diseaseId: 'dx_migraine_or_tension_headache',
    diseaseNameZh: '原發性偏頭痛（血管神經性頭痛）或緊縮型張力性頭痛',
    diseaseNameEn: 'Migraine Disorder / Tension-Type Headache (TTH)',
    targetRegions: ['head_cranial', 'face_sensory', 'neck_throat'],
    preferredDepths: ['deep_visceral', 'musculoskeletal'],
    keyQualities: ['q_throbbing_pulsating', 'q_dull_ache', 'q_crushing_pressure'],
    keySpecifics: ['sp_head_unilateral_migraine', 'sp_head_bilateral_band', 'sp_neck_cervical_radiculopathy'],
    keySystemics: ['sys_nausea', 'sys_dizziness_vertigo', 'sys_severe_insomnia'],
    dynamicWeightTag: 'WEIGHT_MIGRAINE',
    involvedSpecialtiesTw: ['神經內科', '家庭醫學科'],
    typicalSupportZh: [
      '頭部單側搏動性抽痛（隨心跳跳動）或雙側緊箍壓迫悶脹痛',
      '可能伴隨噁心想吐、畏光怕吵或後頸肩部肌肉緊繃',
    ],
    typicalLackingCheckZh: [
      '無數秒內爆炸之雷擊性劇痛，亦無單側手腳無力、口齒不清或高燒併頸部僵硬等次發性腦病變警訊',
    ],
    pathophysiologyPlainZh:
      '偏頭痛源於三叉神經血管系統（Trigeminovascular system）活化，釋放 CGRP（抑鈣素基因相關胜肽）等神經胜肽導致腦膜血管擴張與神經源性發炎，產生隨脈搏跳動的抽痛並活化嘔吐中樞；緊縮型頭痛則源於顱周與後頸肌筋膜長時間收縮及中樞痛覺敏感化。',
    confirmatoryTests: [
      {
        testNameZh: '詳細神經學理學檢查（顱神經、肌力、深部肌腱反射、小腦平衡測試）與國際頭痛疾病分類（ICHD-3）臨床診斷準則',
        expectedFindingOrPurposeZh: '原發性偏頭痛與緊縮型頭痛主要依賴典型臨床特徵與正常之神經學理學檢查確立診斷',
      },
      {
        testNameZh: '腦部電腦斷層（Brain CT）或腦部磁振造影（Brain MRI / MRA）— 針對非典型或伴隨警訊者',
        expectedFindingOrPurposeZh: '當頭痛型態改變、50 歲後新發作或伴隨局部神經學徵兆時，用以排除顱內血管瘤、腦腫瘤或慢性硬腦膜下出血',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '顱內血管病變（腦動脈瘤／蜘蛛膜下腔出血）、腦壓異常或頸源性頭痛',
      diseaseNameEn: 'Intracranial Vascular Lesion / Increased ICP / Cervicogenic Headache',
      whyConsiderToRuleOutZh: '任何突發劇烈頭痛或伴隨視力視野改變、清晨痛醒嘔吐之頭痛，皆需排除顱內結構性病灶。',
      keyRuleOutTestZh: '腦部 MRI/MRA 血管攝影與眼底鏡視神經盤水腫檢查。',
    },
    referredPainInsightZh:
      '上段頸椎神經根（C1–C3）與三叉神經脊髓核在延髓與上頸髓發生解剖匯聚（Trigemino-cervical nucleus），因此後頸枕部病變常向前放射至「前額、太陽穴與眼眶後」。',
  },

  // 9. 下背與下肢神經骨骼：腰椎椎間盤突出併坐骨神經痛 / 退化或痛風性關節炎
  {
    diseaseId: 'dx_lumbar_radiculopathy_or_arthritis',
    diseaseNameZh: '腰椎神經根壓迫（椎間盤突出併坐骨神經痛）或急性結晶性／退化性關節滑膜炎',
    diseaseNameEn: 'Lumbar Radiculopathy (Herniated Intervertebral Disc / Sciatica) or Acute Gouty / Osteoarthritis',
    targetRegions: [
      'lower_back',
      'buttocks_hip',
      'thigh_knee_r',
      'thigh_knee_l',
      'calf_ankle_foot_r',
      'calf_ankle_foot_l',
      'forearm_wrist_hand_r',
      'forearm_wrist_hand_l',
    ],
    preferredDepths: ['musculoskeletal', 'deep_visceral'],
    keyQualities: ['q_electric_shooting', 'q_deep_soreness', 's_numbness_hypoesthesia', 'f_stiffness_limited_rom', 'f_swelling_distension'],
    keySpecifics: [
      'sp_lback_lumbar_radiculopathy',
      'sp_butt_piriformis_sciatica',
      'sp_knee_r_oa_meniscus_crepitus',
      'sp_knee_l_oa_meniscus_crepitus',
      'sp_foot_r_first_mtp_podagra_gout',
      'sp_foot_l_first_mtp_podagra_gout',
      'sp_hand_r_carpal_median_nerve',
    ],
    keySystemics: ['sys_polyarthralgia_morning_stiffness'],
    dynamicWeightTag: 'WEIGHT_RADICULOPATHY_CARPAL_NEURO',
    involvedSpecialtiesTw: ['骨科', '復健科', '神經內科', '風濕免疫科'],
    typicalSupportZh: [
      '具有明確的解剖神經皮節放射路徑（如由下背臀部延伸至下肢，或手腕延伸至手指發麻）或特定關節負重／紅腫疼痛',
      '與姿勢改變、彎腰負重、關節活動度受限或局部壓痛高度相關',
    ],
    typicalLackingCheckZh: [
      '若無跨下鞍部麻木與大小便失禁／滯留，代表目前尚未壓迫馬尾神經束（Cauda Equina Syndrome）',
    ],
    pathophysiologyPlainZh:
      '當椎間盤纖維環退化破裂導致髓核向後外側突出（常見於 L4-L5 或 L5-S1），或手腕腕隧道韌帶肥厚時，會直接機械性壓迫並引發神經根化學性發炎，產生沿神經走向的電擊樣酸麻痛；而關節腔內若沉積尿酸鈉鹽結晶或軟骨磨損，則會活化滑膜巨噬細胞釋放發炎介質引起關節紅腫熱痛與活動受限。',
    confirmatoryTests: [
      {
        testNameZh: '脊椎／關節數位 X 光檢查 ＋ 高解析度肌肉骨骼超音波（Musculoskeletal Ultrasound）',
        expectedFindingOrPurposeZh: '評估椎體間隙高度、脊椎滑脫、關節腔積水、滑膜增生、肌腱撕裂或痛風雙軌徵（Double contour sign）',
      },
      {
        testNameZh: '腰椎／頸椎磁振造影（Spine MRI）、神經傳導與肌電圖（NCV / EMG）或血液尿酸／免疫指標（Uric Acid, RF, Anti-CCP, CRP）',
        expectedFindingOrPurposeZh: 'MRI 可直接呈現椎間盤突出壓迫神經根程度；NCV 可量化神經傳導速度減慢位置；抽血與關節液穿刺偏光顯微鏡可確診痛風或自體免疫關節炎',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '下肢深層靜脈栓塞（DVT）、周邊動脈阻塞疾病（PAOD）或馬尾症候群',
      diseaseNameEn: 'Deep Vein Thrombosis (DVT) / Peripheral Arterial Occlusive Disease / Cauda Equina Syndrome',
      whyConsiderToRuleOutZh: '下肢疼痛除骨骼神經外，若呈現單側小腿不對稱水腫發熱需排除靜脈血栓；若行走一段距離小腿即酸痛冰冷（間歇性跛行）則需排除動脈狹窄。',
      keyRuleOutTestZh: '下肢動靜脈杜卜勒血管超音波（Duplex Ultrasound）、踝肱血壓指數（ABI）與血液 D-dimer。',
    },
    referredPainInsightZh:
      '腰椎 L4、L5、S1 神經根匯聚成坐骨神經（Sciatic nerve），因此病灶雖在「腰椎間盤或臀部梨狀肌」，患者常感覺最痛或最麻的位置遠在「大腿後外側、小腿肚或足底」。',
  },

  // 9. 眼部（眼科、神經內科）：急性隅角閉鎖性青光眼 / 視網膜裂孔剝離 / 急性結膜角膜炎
  {
    diseaseId: 'dx_ophthalmology_glaucoma_retinal_keratitis',
    diseaseNameZh: '急性隅角閉鎖性青光眼、視網膜玻璃體病變或急性角結膜炎（眼壓驟升或視網膜／角膜受損）',
    diseaseNameEn: 'Acute Angle-Closure Glaucoma / Retinal Tear or Detachment / Acute Keratoconjunctivitis',
    targetRegions: ['eye_orbital', 'head_cranial'],
    preferredDepths: ['deep_visceral', 'superficial'],
    keyQualities: ['q_throbbing_pulsating', 'q_dull_ache', 's_foreign_body_globus', 'f_redness_erythema', 'f_abnormal_discharge_bleeding'],
    keySpecifics: [
      'sp_eye_blur_sudden_vision_loss',
      'sp_eye_diplopia_double_vision',
      'sp_eye_floaters_flashes_retinal',
      'sp_eye_glaucoma_pressure_halo',
      'sp_eye_redness_photophobia_discharge',
    ],
    keySystemics: ['sys_nausea', 'sys_vomiting', 'sys_xerostomia_dry_eyes'],
    involvedSpecialtiesTw: ['眼科', '神經內科'],
    typicalSupportZh: [
      '眼部與眼眶區出現視力模糊、飛蚊閃光、複視、眼球深層脹痛或紅眼畏光分泌物',
      '眼壓升高刺激三叉神經眼支時，常同時引發同側前額頭痛與反射性噁心嘔吐',
    ],
    typicalLackingCheckZh: [
      '若無瞳孔散大固定、看燈光彩虹光圈或視野黑幕遮擋，則較偏向表層角結膜發炎或乾眼疲勞，但仍須由眼科儀器確認眼壓與眼底',
    ],
    pathophysiologyPlainZh:
      '當眼球前房隅角狹窄閉鎖導致房水無法排出時，眼內壓會在短時間內飆升（常 >40 mmHg），壓迫視神經並刺激三叉神經引發劇烈眼脹痛、同側頭痛與噁心；而玻璃體退化液化時若拉扯視網膜則會產生「閃電閃光感」與大量飛蚊黑點；角膜或結膜若受病毒、細菌或過敏原侵襲則會導致血管充血、畏光與分泌物。',
    confirmatoryTests: [
      {
        testNameZh: '細隙燈生物顯微鏡檢查（Slit-Lamp Biomicroscopy）＋ 眼壓測定（Tonometry）',
        expectedFindingOrPurposeZh: '直接檢視角膜是否破損潰瘍、前房深度是否狹窄、前房發炎細胞，並精確量測眼內壓（正常 10–21 mmHg）以排除急性青光眼',
      },
      {
        testNameZh: '散瞳眼底視網膜檢查（Dilated Fundus Exam）＋ 光學同調斷層掃描（OCT）',
        expectedFindingOrPurposeZh: '檢視視網膜周邊是否有裂孔、剝離、黃斑部水腫或視網膜動靜脈阻塞（眼中風）',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '視神經炎（Optic Neuritis）或顱內動眼神經壓迫病變',
      diseaseNameEn: 'Optic Neuritis / Cranial Nerve III, IV, VI Palsy',
      whyConsiderToRuleOutZh: '若出現眼球轉動疼痛伴隨辨色力減退，或雙眼複視（遮住一隻眼即消失），需排除視神經脫髓鞘發炎或顱內血管瘤／微血管病變壓迫動眼神經。',
      keyRuleOutTestZh: '視野檢查（Visual Field Test）、視覺誘發電位（VEP）與腦部眼眶磁振造影（Brain & Orbit MRI）。',
    },
    referredPainInsightZh:
      '眼球與眼眶受第五對腦神經「三叉神經第一支（眼支 V1）」支配，該神經同時分布於同側前額與頭頂，因此急性眼壓升高常被誤以為是偏頭痛或急性腸胃炎（因合併嘔吐）。',
  },

  // 10a. 耳部與前庭（耳鼻喉科、神經內科）：耳石脫落症 / 梅尼爾氏症 / 突發性耳聾 / 中外耳炎
  {
    diseaseId: 'dx_ear_vestibular_otitis',
    diseaseNameZh: '前庭內耳眩暈症（耳石脫落症／梅尼爾氏症）、突發性耳聾或急性中／外耳炎',
    diseaseNameEn: 'BPPV / Meniere Disease / Sudden Sensorineural Hearing Loss / Otitis Media',
    targetRegions: ['ear_auditory'],
    preferredDepths: ['deep_visceral', 'superficial'],
    keyQualities: ['q_throbbing_pulsating', 'q_dull_ache', 's_foreign_body_globus', 'f_swelling_bloating', 'f_abnormal_discharge_bleeding'],
    keySpecifics: [
      'sp_ear_tinnitus_sudden_hearing_loss',
      'sp_ear_vertigo_meniere_bppv',
      'sp_ear_otalgia_otorrhea_otitis',
      'sp_ear_fullness_eustachian_barotrauma',
      'sp_ear_pulsatile_tinnitus_vascular',
      'sp_ear_auricle_perichondritis_herpes_zoster',
      'sp_ear_conductive_cerumen_impaction',
    ],
    keySystemics: ['sys_dizziness_vertigo', 'sys_nausea', 'sys_low_grade_fever', 'sys_high_fever'],
    involvedSpecialtiesTw: ['耳鼻喉科', '神經內科'],
    typicalSupportZh: [
      '耳部出現耳鳴、耳悶塞感、聽力突然下降、耳流膿痛或姿勢變換誘發之天旋地轉眩暈',
      '內耳前庭半規管受刺激時常伴隨眼震與自律神經反射性噁心想吐',
    ],
    typicalLackingCheckZh: [
      '若無合併複視、講話大舌頭、吞嚥嗆咳或單側手腳無力，則眩暈較偏向「周邊內耳前庭問題」而非中樞小腦／腦幹中風',
    ],
    pathophysiologyPlainZh:
      '內耳半規管內的耳石（碳酸鈣結晶）若脫落滑入半規管，會在轉頭或躺下時帶動內淋巴液產生錯誤旋轉訊號（耳石症 BPPV）；若內淋巴水腫壓迫耳蝸與前庭則會同時引發眩暈、低頻耳鳴與聽力波動（梅尼爾氏症）。',
    confirmatoryTests: [
      {
        testNameZh: '純音聽力檢查（Pure-Tone Audiometry）＋ 眼振電圖／頭位變換前庭測試（Dix-Hallpike Test）',
        expectedFindingOrPurposeZh: '精確量化各頻率聽力閾值（確診突發性耳聾或梅尼爾氏低頻聽損），並透過誘發特徵性眼震定位耳石脫落之半規管',
      },
      {
        testNameZh: '耳鏡顯微檢查（Otoscopy）＋ 中耳鼓室圖檢查（Tympanometry）',
        expectedFindingOrPurposeZh: '直接檢視鼓膜是否充血穿孔、中耳積液或外耳道皮膚腫脹發炎',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '後循環小腦／腦幹缺血性中風（Posterior Circulation Stroke）或聽神經瘤',
      diseaseNameEn: 'Vertebrobasilar Insufficiency / Cerebellar Stroke / Vestibular Schwannoma',
      whyConsiderToRuleOutZh: '若眩暈持續不停且與轉頭姿勢無關，或單側高頻耳鳴／搏動性耳鳴伴隨漸進性聽力喪失，需排除小腦腦幹血管病變或聽神經瘤。',
      keyRuleOutTestZh: '中樞眼震檢查（HINTS Exam）與腦部後顱窩磁振造影（Brain MRI with DWI）。',
    },
    referredPainInsightZh:
      '耳道與中耳受第五、七、九、十對腦神經分支交錯支配，若出現耳廓周圍水泡伴同側臉歪嘴斜，須警覺帶狀皰疹病毒侵犯膝狀神經節（Ramsay Hunt 症候群）。',
  },

  // 10b. 鼻與鼻竇（耳鼻喉科、過敏免疫科）：急性／慢性鼻竇炎、過敏性鼻炎或鼻出血／鼻咽病變
  {
    diseaseId: 'dx_nose_sinusitis_rhinitis',
    diseaseNameZh: '急性／慢性副鼻竇炎、過敏性鼻炎或鼻黏膜出血／鼻中膈病變',
    diseaseNameEn: 'Acute or Chronic Rhinosinusitis / Allergic Rhinitis / Epistaxis',
    targetRegions: ['nose_sinus'],
    preferredDepths: ['deep_visceral', 'superficial'],
    keyQualities: ['q_dull_ache', 'q_throbbing_pulsating', 'f_swelling_bloating', 'f_abnormal_discharge_bleeding'],
    keySpecifics: [
      'sp_nose_purulent_sinusitis_facial_pressure',
      'sp_nose_epistaxis_anosmia_allergy',
      'sp_nose_unilateral_obstruction_blood_discharge',
      'sp_nose_postnasal_drip_night_cough',
      'sp_nose_epistaxis_recurrent_heavy',
      'sp_nose_anosmia_hyposmia',
      'sp_nose_trauma_septal_hematoma',
    ],
    keySystemics: ['sys_low_grade_fever', 'sys_high_fever', 'sys_fatigue_malaise'],
    involvedSpecialtiesTw: ['耳鼻喉科', '過敏免疫風濕科'],
    typicalSupportZh: [
      '鼻與鼻竇區出現黃綠濃涕、低頭前傾時眉心／雙頰壓痛加重、清水鼻涕打噴嚏、鼻涕倒流或流鼻血／嗅覺異常',
      '若單側鼻塞持續惡化或鼻涕反覆帶血絲，臨床上須積極安排鼻咽鏡排除鼻息肉或鼻咽腫瘤',
    ],
    typicalLackingCheckZh: [
      '若無高燒、劇烈臉頰膿腫壓痛或單側血絲鼻涕，多屬於病毒性上呼吸道鼻炎或過敏性鼻炎控制不良',
    ],
    pathophysiologyPlainZh:
      '鼻腔與周圍四對副鼻竇相通，當感冒病毒、細菌或過敏原引起鼻甲黏膜充血水腫時，鼻竇開口會被阻塞，導致分泌物滯留發炎並產生眉心與臉頰深層脹痛（副鼻竇炎）；而鼻中膈前端的 Kiesselbach 血管叢極為表淺，乾燥或高血壓時容易破裂流鼻血。',
    confirmatoryTests: [
      {
        testNameZh: '軟式纖維鼻咽內視鏡檢查（Fiberoptic Nasopharyngoscopy）',
        expectedFindingOrPurposeZh: '直接檢視中鼻道是否有膿性分泌物流出、鼻息肉、鼻中膈彎曲以及鼻咽部黏膜是否異常',
      },
      {
        testNameZh: '鼻竇電腦斷層掃描（Sinus CT）與過敏原特異性 IgE 檢測',
        expectedFindingOrPurposeZh: '針對慢性或反覆發作之鼻竇炎評估各鼻竇腔蓄膿與骨壁狀況，並區分過敏性鼻炎誘因',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '鼻咽部病變（Nasopharyngeal Lesion）或侵襲性黴菌性鼻竇炎',
      diseaseNameEn: 'Nasopharyngeal Neoplasm / Invasive Fungal Sinusitis',
      whyConsiderToRuleOutZh: '單側持續鼻塞、鼻涕帶血絲、單側耳悶或頸部腫塊須優先排除鼻咽病變；免疫低下或糖尿病患合併嚴重鼻竇痛需排除黴菌侵襲。',
      keyRuleOutTestZh: '鼻咽鏡組織切片檢查與鼻竇／顱底顯影劑電腦斷層或 MRI。',
    },
    referredPainInsightZh:
      '上頷竇底部與上排臼齒牙根僅隔一層薄骨板，因此急性上頷竇炎常引發整排上排牙齒悶痛，低頭時特別明顯。',
  },

  // 10c. 喉嚨與咽喉（耳鼻喉科、肝膽腸胃內科）：急性咽喉扁桃腺炎、咽喉逆流 (LPR) 或會厭／聲帶病變
  {
    diseaseId: 'dx_throat_pharyngitis_lpr',
    diseaseNameZh: '急性咽喉扁桃腺炎、咽喉胃酸逆流 (LPR) 或聲帶／深頸部感染病變',
    diseaseNameEn: 'Acute Pharyngotonsillitis / Laryngopharyngeal Reflux (LPR) / Peritonsillar Abscess',
    targetRegions: ['neck_throat'],
    preferredDepths: ['superficial', 'deep_visceral'],
    keyQualities: ['q_sharp_stabbing', 'q_burning_searing', 's_foreign_body_globus', 'f_swelling_bloating'],
    keySpecifics: [
      'sp_neck_dysphagia_odynophagia',
      'sp_throat_hoarseness_globus_lpr',
      'sp_throat_exudative_tonsillitis_fever',
      'sp_throat_peritonsillar_trismus_hot_potato',
      'sp_throat_stridor_airway_obstruction',
      'sp_throat_lpr_acid_reflux_cough',
      'sp_throat_chronic_dysphagia_solid_liquid',
    ],
    keySystemics: ['sys_high_fever', 'sys_low_grade_fever', 'sys_lymphadenopathy'],
    involvedSpecialtiesTw: ['耳鼻喉科', '肝膽腸胃內科'],
    typicalSupportZh: [
      '咽喉部出現吞嚥疼痛、扁桃腺紅腫化膿、聲音沙啞、喉嚨異物卡卡感（臆球症／咽喉逆流）或吸氣喘鳴',
      '若合併張口困難、流口水、講話含糊或吸氣喘鳴，屬潛在上呼吸道阻塞急症，須立即就醫',
    ],
    typicalLackingCheckZh: [
      '若無高燒、扁桃腺化膿、張口困難或進行性固體食物吞嚥困難，則較偏向胃酸咽喉逆流 (LPR) 或過度發聲導致之聲帶水腫',
    ],
    pathophysiologyPlainZh:
      '咽喉黏膜受病毒或 A 型鏈球菌感染時會快速充血水腫與化膿，刺激舌咽神經引起吞嚥劇痛；若發炎擴散至扁桃腺周圍間隙形成膿瘍或波及會厭軟骨，便可能壓迫氣道引發喘鳴；慢性無痛的喉嚨卡卡感與晨起清喉嚨則多與胃酸氣體上衝刺激聲帶（咽喉逆流）有關。',
    confirmatoryTests: [
      {
        testNameZh: '經鼻咽喉光纖內視鏡檢查（Fiberoptic Laryngoscopy）',
        expectedFindingOrPurposeZh: '直接檢視咽喉、扁桃腺、會厭軟骨是否紅腫阻塞，並觀察雙側聲帶運動與是否有結節、息肉或胃酸灼傷',
      },
      {
        testNameZh: 'A 型鏈球菌快篩／喉頭細菌培養 ＋ 必要時上消化道胃鏡檢查',
        expectedFindingOrPurposeZh: '確認是否需使用抗生素治療化膿性扁桃腺炎；若伴隨進行性吞嚥困難或頑固逆流則以胃鏡排除食道病變',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '急性會厭炎／深頸部感染膿瘍（Deep Neck Infection）或食道／下咽病變',
      diseaseNameEn: 'Acute Epiglottitis / Deep Neck Space Infection / Hypopharyngeal-Esophageal Lesion',
      whyConsiderToRuleOutZh: '聲音改變合併吸氣喘鳴、流口水須立刻排除急性會厭炎；長期抽菸喝酒吃檳榔者若聲音沙啞或單側喉痛逾 2 週須排除咽喉腫瘤。',
      keyRuleOutTestZh: '緊急頸部軟組織側面 X 光／增強頸部電腦斷層（Contrast Neck CT）及咽喉內視鏡切片。',
    },
    referredPainInsightZh:
      '扁桃腺窩與下咽同受第九、十對腦神經支配，因此嚴重扁桃腺炎或下咽發炎常伴隨同側「耳朵深處牽涉痛」。',
  },

  // 11. 口腔、牙齒與下顎（牙科／口腔顎面外科）：急性牙髓炎／牙周根尖膿瘍 / 顳顎關節障礙症
  {
    diseaseId: 'dx_dental_pulpitis_periodontal_tmj',
    diseaseNameZh: '急性牙髓炎／牙周根尖膿瘍、顳顎關節障礙症 (TMD) 或口腔黏膜病變',
    diseaseNameEn: 'Acute Pulpitis / Periapical Abscess / Temporomandibular Joint Disorder (TMD)',
    targetRegions: ['oral_dental_jaw', 'face_sensory'],
    preferredDepths: ['deep_visceral', 'musculoskeletal', 'superficial'],
    keyQualities: ['q_throbbing_pulsating', 'q_sharp_stabbing', 'q_electric_shooting', 'f_swelling_bloating', 'f_stiffness_limited_rom'],
    keySpecifics: [
      'sp_oral_toothache_pulpitis_abscess',
      'sp_oral_tmj_trismus_clicking',
      'sp_oral_ulcer_leukoplakia_glossitis',
    ],
    keySystemics: ['sys_low_grade_fever', 'sys_recurrent_oral_ulcers', 'sys_lymphadenopathy'],
    involvedSpecialtiesTw: ['牙科／口腔顎面外科', '耳鼻喉科'],
    typicalSupportZh: [
      '牙齒、牙齦或下顎區出現冷熱刺激劇痛、夜間自發性抽痛、牙齦腫脹出血、張口咀嚼耳前彈響痛或口腔潰瘍',
      '若有嚼檳榔或抽菸習慣且口腔潰瘍超過 2 週未癒合或伴隨白斑，需提高口腔黏膜病變鑑別權重',
    ],
    typicalLackingCheckZh: [
      '若下顎痛在運動爬樓梯時誘發且伴隨胸口壓迫冒冷汗（而無牙齒敲擊痛），需優先排除心肌缺血下巴放射痛',
    ],
    pathophysiologyPlainZh:
      '當深層蛀牙或牙裂使細菌侵入堅硬牙釉質內部的「牙髓腔」時，發炎充血產生的壓力無處釋放，會直接壓迫三叉神經末梢引發劇烈搏動性抽痛（夜間平躺充血時更痛）；而長期咬合不正、夜間磨牙或壓力緊咬牙關則會導致顳顎關節軟骨盤移位與咀嚼肌群痙攣。',
    confirmatoryTests: [
      {
        testNameZh: '牙科根尖周 X 光攝影（Periapical Radiography）＋ 全口環景 X 光（Panoramic X-ray）',
        expectedFindingOrPurposeZh: '檢視深部鄰接面齲齒、牙根尖黑影（骨質吸收膿瘍）、阻生智齒發炎與顳顎關節髁頭結構',
      },
      {
        testNameZh: '牙髓活性測試（Pulp Vitality Test）與口腔顎面黏膜視觸診／切片檢查',
        expectedFindingOrPurposeZh: '判定牙髓神經是否已不可逆壞死；若口腔潰瘍逾 2 週未癒或有硬結白斑則進行組織病理切片',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '三叉神經痛（Trigeminal Neuralgia）或心絞痛下顎放射痛',
      diseaseNameEn: 'Trigeminal Neuralgia / Cardiac Referred Jaw Pain',
      whyConsiderToRuleOutZh: '三叉神經第二、三支電擊痛常被患者誤認為牙痛而拔除健康牙齒；此外心肌缺血亦常透過迷走與頸神經匯聚放射至下巴。',
      keyRuleOutTestZh: '牙科 X 光排除牙源性病灶後，安排神經內科三叉神經評估或 12 導程心電圖 (ECG)。',
    },
    referredPainInsightZh:
      '上排後牙牙根緊貼「上頷鼻竇底部」，且同受三叉神經上頷支支配，因此急性上頷竇炎常引起一整排上排牙齒酸痛；反之牙根尖感染亦可能向上引發牙源性鼻竇炎。',
  },

  // 12. 頸部與甲狀腺（新陳代謝內分泌科、耳鼻喉科）：甲狀腺結節／亞急性甲狀腺炎／頸部淋巴結病變
  {
    diseaseId: 'dx_thyroid_nodule_thyroiditis_lymphadenopathy',
    diseaseNameZh: '甲狀腺結節／亞急性甲狀腺炎或反應性／特異性頸部淋巴結腫大',
    diseaseNameEn: 'Thyroid Nodule / Subacute Thyroiditis / Cervical Lymphadenopathy',
    targetRegions: ['neck_cervical_thyroid', 'neck_throat'],
    preferredDepths: ['deep_visceral', 'musculoskeletal'],
    keyQualities: ['f_hard_lump_nodule', 'q_tenderness_touch', 'f_swelling_bloating'],
    keySpecifics: ['sp_neck_thyroid_anterior_mass'],
    keySystemics: [
      'sys_heat_intolerance_hyperhidrosis',
      'sys_cold_intolerance',
      'sys_unexplained_weight_loss',
      'sys_palpitations_arrhythmia',
      'sys_tremor',
      'sys_lymphadenopathy',
    ],
    involvedSpecialtiesTw: ['新陳代謝內分泌科', '耳鼻喉科', '血液腫瘤科'],
    typicalSupportZh: [
      '前頸部摸到隨吞嚥上下移動之甲狀腺腫塊／壓痛，或側頸部摸到淋巴結腫大',
      '若合併怕熱、多汗、心悸、手抖或體重減輕，高度提示合併甲狀腺功能亢進（Thyrotoxicosis）',
    ],
    typicalLackingCheckZh: [
      '若頸部淋巴結質地柔軟、有壓痛且伴隨近期喉嚨痛感冒，多為良性反應性淋巴結炎；若質地堅硬固定且無痛持續變大則需積極穿刺排查',
    ],
    pathophysiologyPlainZh:
      '甲狀腺位於氣管前方，當濾泡細胞增生形成結節，或因病毒感染後引發「亞急性甲狀腺炎（De Quervain thyroiditis）」時，會造成前頸腫脹壓痛（痛感可放射至下巴或耳部），並使儲存的甲狀腺素釋入血液引發心悸手抖；而頸部富含淋巴結，當頭頸部發炎或免疫系統活化時便會腫大。',
    confirmatoryTests: [
      {
        testNameZh: '高解析度甲狀腺與頸部超音波（Thyroid & Neck Ultrasonography）＋ 細針穿刺細胞學檢查（FNA）',
        expectedFindingOrPurposeZh: '評估甲狀腺結節大小、邊界、微鈣化（TI-RADS 分級）與頸部淋巴結皮髓質結構，必要時以細針抽吸細胞化驗良惡性',
      },
      {
        testNameZh: '血液甲狀腺功能與自體抗體檢驗（TSH, Free T4, Free T3, Anti-TPO, Anti-Tg, ESR）',
        expectedFindingOrPurposeZh: '確認是否合併甲狀腺亢進、低下、橋本氏／葛瑞夫茲氏自體免疫甲狀腺疾病或亞急性發炎高 ESR',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '鼻咽或頭頸部原發病灶轉移之頸部淋巴結或淋巴瘤',
      diseaseNameEn: 'Metastatic Cervical Lymphadenopathy / Lymphoma',
      whyConsiderToRuleOutZh: '若成人側頸出現無痛、堅硬、固定不動且持續超過 2～4 週之腫塊（或伴隨夜間盜汗、體重減輕、單側耳悶鼻血），需由耳鼻喉科與血液腫瘤科優先排除。',
      keyRuleOutTestZh: '鼻咽內視鏡檢查、頸部電腦斷層 (Neck CT) 與淋巴結切片病理檢查。',
    },
    referredPainInsightZh:
      '亞急性甲狀腺炎發炎腫脹時，會刺激支配甲狀腺被膜的頸神經叢分支，疼痛常向上放射至「同側下顎角、耳後或喉嚨」，常被誤以為是單純喉嚨發炎或牙痛。',
  },

  // 13. 乳房與乳腺區（乳房外科、婦產科）：乳房纖維囊腫 / 急性乳腺炎 / 乳房實質腫塊鑑別
  {
    diseaseId: 'dx_breast_fibrocystic_mastitis_neoplasm_workup',
    diseaseNameZh: '乳房纖維囊腫變化／良性纖維腺瘤、急性乳腺炎或乳房實質腫塊鑑別',
    diseaseNameEn: 'Fibrocystic Breast Change / Fibroadenoma / Acute Mastitis / Breast Mass Evaluation',
    targetRegions: ['breast_mammary', 'chest_right', 'chest_left'],
    preferredDepths: ['superficial', 'deep_visceral'],
    keyQualities: ['f_hard_lump_nodule', 'q_tenderness_touch', 'f_swelling_bloating', 'f_abnormal_discharge_bleeding'],
    keySpecifics: [
      'sp_breast_painless_lump_dimpling',
      'sp_breast_cyclical_mastalgia_mastitis',
      'sp_breast_nipple_bloody_discharge',
      'sp_chest_r_breast_mastalgia',
    ],
    keySystemics: ['sys_low_grade_fever', 'sys_high_fever', 'sys_lymphadenopathy'],
    involvedSpecialtiesTw: ['乳房外科', '婦產科'],
    typicalSupportZh: [
      '乳房或腋下區域出現脹痛、摸到結節或硬塊、乳房皮膚變化或乳頭異常分泌物',
      '隨月經週期波動之雙側脹痛多傾向荷爾蒙相關之纖維囊腫變化；紅腫熱痛伴發燒則傾向乳腺炎；無痛堅硬不規則腫塊則需優先超音波影像排查',
    ],
    typicalLackingCheckZh: [
      '單憑觸診無法 100% 區分良性纖維腺瘤、水囊（囊腫）或早期惡性病灶，所有新發現之乳房硬塊或單側血性乳頭分泌物均應接受乳房影像檢查',
    ],
    pathophysiologyPlainZh:
      '乳腺組織受雌激素（Estrogen）與黃體素（Progesterone）週期性調控，月經來潮前乳腺小葉充血水腫易引起週期性乳房脹痛與結節感；若乳管阻塞合併細菌逆行感染則會引發急性乳腺炎紅腫熱痛；而乳管上皮或基質細胞異常增生則會形成良性纖維腺瘤、乳管內乳突瘤或實質腫塊。',
    confirmatoryTests: [
      {
        testNameZh: '高解析度乳房超音波（Breast Ultrasonography）＋ 數位乳房 X 光攝影（Mammography）',
        expectedFindingOrPurposeZh: '超音波可精準區分水泡囊腫（Cyst）與實質固態腫瘤（Solid mass），乳房攝影則可偵測極早期微細鈣化點（Microcalcifications），並以 BI-RADS 分級評估',
      },
      {
        testNameZh: '超音波導引粗針穿刺切片（Core Needle Biopsy）或乳頭分泌物細胞學檢查',
        expectedFindingOrPurposeZh: '若影像呈現 BI-RADS 4 級以上可疑病灶，透過微創粗針取樣進行病理組織學確診',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '乳管內乳突瘤（Intraductal Papilloma）或早期乳腺惡性腫瘤',
      diseaseNameEn: 'Intraductal Papilloma / Breast Carcinoma',
      whyConsiderToRuleOutZh: '單側單一乳孔自發性血水樣分泌物，或界線不清、推不動之無痛硬塊伴腋下淋巴腫大，必須由乳房外科優先以超音波與粗針切片排除惡性可能。',
      keyRuleOutTestZh: '乳房超音波 (Breast Ultrasound)、乳房攝影 (Mammography) 與粗針組織切片。',
    },
    referredPainInsightZh:
      '乳房外上方組織（Tail of Spence）延伸入腋窩並與胸大肌筋膜相鄰，因此乳腺脹痛或腋下前哨淋巴結腫大常同時引起「腋下與上臂內側牽涉痠痛」。',
  },

  // 14. 生殖與泌尿會陰區（泌尿科、婦產科、感染科、皮膚科）：泌尿生殖道感染 / 攝護腺炎 / 陰道外陰炎 / 急性陰囊急症
  {
    diseaseId: 'dx_urogenital_uti_prostatitis_vaginitis_epididymitis',
    diseaseNameZh: '急性泌尿生殖道感染（尿道膀胱炎／攝護腺炎／外陰陰道炎）或陰囊副睪丸病變',
    diseaseNameEn: 'Acute Urethritis & Cystitis / Prostatitis / Vulvovaginitis / Epididymo-orchitis',
    targetRegions: ['urogenital_perineal', 'pelvis_groin'],
    preferredDepths: ['superficial', 'deep_visceral'],
    keyQualities: ['q_burning', 's_itching_pruritus', 'f_swelling_bloating', 'f_abnormal_discharge_bleeding'],
    keySpecifics: [
      'sp_uro_dysuria_discharge_urethritis',
      'sp_uro_vaginal_pruritus_discharge_vulvitis',
      'sp_uro_scrotal_testicular_acute_pain',
      'sp_pelvis_suprapubic_uti',
      'sp_pelvis_gyne_pid_adnexal',
    ],
    keySystemics: ['sys_dysuria', 'sys_frequency_nocturia', 'sys_hematuria_tea_urine', 'sys_low_grade_fever', 'sys_high_fever'],
    involvedSpecialtiesTw: ['泌尿科', '婦產科', '感染科', '皮膚科'],
    typicalSupportZh: [
      '生殖會陰或下腹恥骨區出現排尿灼熱刺痛、頻尿夜尿、尿道或陰道異常分泌物、外陰搔癢或陰囊腫痛',
      '若合併發燒畏寒與後腰肋脊角敲擊痛，提示感染可能已上行至上泌尿道或攝護腺／骨盆腔',
    ],
    typicalLackingCheckZh: [
      '若為單側陰囊突發劇痛（尤其青少年或青壯年），在未經彩色杜卜勒超音波確認睪丸血流正常前，絕不可單純當作發炎觀察，必須先排除睪丸扭轉',
    ],
    pathophysiologyPlainZh:
      '當細菌（如大腸桿菌或特定病原體）、念珠菌或滴蟲經由尿道口或生殖道黏膜入侵時，會引發局部黏膜充血水腫、神經末梢敏感（排尿如刀割灼熱、頻尿尿急）與特徵性分泌物；在男性若逆行進入攝護腺或副睪丸則會引起會陰深層悶痛、排尿不順與陰囊紅腫熱痛。',
    confirmatoryTests: [
      {
        testNameZh: '尿液常規檢查與沉渣鏡檢（Urinalysis & Microscopy）＋ 尿液／分泌物細菌培養或核酸檢測（NAAT / PCR）',
        expectedFindingOrPurposeZh: '檢測尿中白血球酯酶、亞硝酸鹽、膿細胞與紅血球，並精準鑑定致病菌種與抗生素敏感性',
      },
      {
        testNameZh: '婦科內診／陰道抹片鏡檢（女性）或 陰囊／攝護腺彩色杜卜勒超音波（男性）',
        expectedFindingOrPurposeZh: '女性可直接區分念珠菌、細菌性或滴蟲陰道炎及骨盆腔發炎；男性可立即確認睪丸動脈血流（排除扭轉）與攝護腺腫大膿瘍',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '精索／睪丸扭轉（Testicular Torsion）或急性骨盆腔發炎併輸卵管卵巢膿瘍（PID / TOA）',
      diseaseNameEn: 'Testicular Torsion / Pelvic Inflammatory Disease with Tubo-Ovarian Abscess',
      whyConsiderToRuleOutZh: '睪丸扭轉超過 6 小時將導致不可逆缺血壞死；女性若下腹會陰痛合併高燒與子宮頸擺動劇痛則需排除骨盆腔深部膿瘍或子宮外孕。',
      keyRuleOutTestZh: '急診陰囊彩色杜卜勒超音波、女性驗孕 (β-hCG) 與婦科骨盆腔超音波。',
    },
    referredPainInsightZh:
      '會陰、膀胱底與遠端輸尿管同受薦髓（S2-S4 陰部神經 Pudendal nerve）與腰薦神經叢支配，因此下段輸尿管結石或攝護腺發炎常產生「陰囊、陰莖前端或會陰部的劇烈牽涉痛」。',
  },

  // 15. 肛門與直腸區（大腸直腸外科、肝膽腸胃科）：內外痔瘡出血栓塞 / 急性肛裂 / 肛門周圍膿瘍與直腸病灶排查
  {
    diseaseId: 'dx_colorectal_hemorrhoids_fissure_abscess',
    diseaseNameZh: '內外痔瘡併出血或血栓、急性肛裂或肛門直腸周圍膿瘍（大腸直腸外科鑑別）',
    diseaseNameEn: 'Internal/External Hemorrhoids / Acute Anal Fissure / Perianal Abscess & Colorectal Workup',
    targetRegions: ['anal_rectal', 'buttocks_hip', 'abd_llq'],
    preferredDepths: ['superficial', 'deep_visceral'],
    keyQualities: ['q_sharp_stabbing', 'q_tearing_ripping', 'q_throbbing_pulsating', 'f_hard_lump_nodule', 'f_abnormal_discharge_bleeding'],
    keySpecifics: [
      'sp_anal_hemorrhoid_bright_bleeding_prolapse',
      'sp_anal_fissure_tearing_pain',
      'sp_anal_perianal_abscess_tenesmus',
    ],
    keySystemics: ['sys_melena_hematochezia', 'sys_constipation', 'sys_low_grade_fever', 'sys_unexplained_weight_loss'],
    involvedSpecialtiesTw: ['大腸直腸外科', '肝膽腸胃科'],
    typicalSupportZh: [
      '肛門與直腸區出現排便滴鮮血、肛門口脫垂肉球、排便時刀割撕裂劇痛，或肛門旁紅腫熱痛硬塊',
      '鮮紅色且與糞便分開之便後滴血多源自齒狀線附近之內痔靜脈叢或肛裂；若伴隨發燒與持續搏動痛則高度提示肛門周圍膿瘍',
    ],
    typicalLackingCheckZh: [
      '若血色偏暗紅且與糞便混雜、夾雜黏液、大便變細、里急後重（一直想大便卻解不出）或有大腸癌家族史，絕不可僅當作單純痔瘡，必須接受大腸鏡檢查',
    ],
    pathophysiologyPlainZh:
      '肛門墊（Anal cushions）內的動靜脈血管叢若因長期久坐、便秘出力或懷孕腹壓增加而充血曲張鬆弛，便會形成「內外痔瘡」並在排便摩擦時破裂流出鮮血或形成血栓劇痛；若乾燥硬便撐裂肛門齒狀線下方的脆弱上皮則會造成「肛裂」，引發括約肌反射性痙攣與刀割痛；若肛門腺體開口受阻塞感染化膿則會演變為「肛門直腸周圍膿瘍」。',
    confirmatoryTests: [
      {
        testNameZh: '大腸直腸外科肛門指診（Digital Rectal Examination, DRE）＋ 硬式／軟式肛門直腸鏡檢查（Anoscopy / Proctoscopy）',
        expectedFindingOrPurposeZh: '直接檢視齒狀線上下之內外痔瘡分級、肛裂潰瘍裂口、肛門膿瘍廔管開口，並觸診低位直腸是否有腫塊',
      },
      {
        testNameZh: '全大腸內視鏡檢查（Colonoscopy）＋ 糞便潛血免疫檢查（iFOBT）',
        expectedFindingOrPurposeZh: '凡出現便血、排便習慣改變或年齡 ≥45 歲／具家族史者，應透過全大腸鏡完整排除大腸直腸息肉、發炎性腸道疾病或惡性腫瘤',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '大腸直腸息肉／惡性腫瘤（Colorectal Neoplasm）或直腸結腸炎（Ulcerative Proctocolitis）',
      diseaseNameEn: 'Colorectal Adenoma or Carcinoma / Ulcerative Proctitis',
      whyConsiderToRuleOutZh: '臨床上直腸癌或發炎性腸道疾病初期常以「便血或誤以為痔瘡發作」表現，大腸直腸外科專科醫師會透過肛門鏡與全大腸鏡作最嚴謹的把關。',
      keyRuleOutTestZh: '全大腸內視鏡檢查（Colonoscopy）與病灶病理切片。',
    },
    referredPainInsightZh:
      '肛門齒狀線（Dentate line）以上由內臟自主神經支配（對痛覺不敏感但有墜脹里急後重感），齒狀線以下則由體神經「陰部神經分支」支配，對痛覺極度敏銳，且痛感可放射至會陰與尾骶骨。',
  },

  // 16. 精神、情緒與睡眠（精神科／身心科、睡眠醫學科）：焦慮恐慌症 / 憂鬱症 / 自律神經與睡眠障礙
  {
    diseaseId: 'dx_psychiatry_anxiety_panic_depression_insomnia',
    diseaseNameZh: '廣泛性焦慮症／恐慌發作、憂鬱症候群或自律神經失調併睡眠障礙（精神科／身心科鑑別）',
    diseaseNameEn: 'Generalized Anxiety & Panic Disorder / Major Depressive Episode / Autonomic & Sleep Disorder',
    targetRegions: ['head_cranial', 'chest_left', 'neck_throat'],
    preferredDepths: ['deep_visceral', 'superficial'],
    keyQualities: ['q_crushing_pressure', 's_foreign_body_globus', 's_numbness_hypoesthesia'],
    keySpecifics: ['sp_chest_l_palpitation_dyspnea', 'sp_throat_hoarseness_globus_lpr'],
    keySystemics: [
      'sys_psych_depressed_anhedonia',
      'sys_psych_anxiety_panic_attack',
      'sys_psych_restlessness_agitation',
      'sys_psych_insomnia_early_awakening',
      'sys_psych_hyperventilation',
      'sys_psych_ocd_intrusive_thoughts',
      'sys_psych_memory_cognitive_decline',
      'sys_psych_hallucination_delusion',
      'sys_psych_self_harm_ideation',
      'sys_severe_insomnia',
      'sys_palpitations_arrhythmia',
    ],
    involvedSpecialtiesTw: ['精神科／身心科', '神經內科'],
    typicalSupportZh: [
      '勾選了精神身心與睡眠系統指標（如持續情緒低落失去興趣、過度焦慮或突發恐慌、心神不寧、嚴重失眠早醒或過度換氣感）',
      '交感神經與下視丘-腦下垂體-腎上腺軸 (HPA axis) 過度活化時，常同時伴隨胸悶心悸、喉嚨異物感（梅核氣／喉球症）、頭脹腦霧與腸胃蠕動異常等身體化症狀',
    ],
    typicalLackingCheckZh: [
      '西醫精神科診斷鐵則為「先排除器質性生理疾病（Rule out organic causes）」：必須先透過抽血與心電圖排除甲狀腺功能亢進、心律不整、貧血或電解質失衡所引發的假性焦慮或疲倦',
    ],
    pathophysiologyPlainZh:
      '大腦邊緣系統（杏仁核、海馬迴）與前額葉皮質之間的血清素（Serotonin）、正腎上腺素（Norepinephrine）與 GABA 神經傳導物質失衡時，會使大腦警報系統過度敏感。在「恐慌發作」時，交感神經瞬間大量放電引發心跳加速、胸悶與過度換氣（血液二氧化碳過低導致手腳嘴唇發麻）；而在「憂鬱或慢性焦慮」時，則會干擾睡眠結構（入睡困難或清晨早醒）、降低動機並放大全身疼痛訊號。',
    confirmatoryTests: [
      {
        testNameZh: '精神科／身心科專科臨床會談與標準化量表評估（PHQ-9 憂鬱量表、GAD-7 焦慮量表、PSQI 睡眠品質量表）',
        expectedFindingOrPurposeZh: '由精神科專科醫師依 DSM-5 診斷準則評估症狀持續時間、功能影響程度、睡眠結構與心理社會壓力源',
      },
      {
        testNameZh: '器質性排除血液檢驗：甲狀腺功能（TSH, Free T4）、全套血球計數（CBC）、維生素 B12、電解質與靜態心電圖（ECG）',
        expectedFindingOrPurposeZh: '排除甲狀腺亢進（易致心悸焦慮失眠）、甲狀腺低下（易致憂鬱疲倦記憶減退）或心律不整等生理疾病，亦可依需要安排睡眠多項生理檢查（PSG）或自律神經心率變異度（HRV）檢測',
      },
    ],
    secondaryPair: {
      diseaseNameZh: '甲狀腺功能異常（Hyper/Hypothyroidism）或器質性腦部／內分泌疾病引發之次發性情緒睡眠障礙',
      diseaseNameEn: 'Thyroid Dysfunction / Substance or Medical Condition-Induced Mood & Anxiety Disorder',
      whyConsiderToRuleOutZh: '甲狀腺亢進極常模仿恐慌症與焦慮失眠；甲狀腺低下、維生素 B12 缺乏或早期神經退化則常模仿憂鬱症與記憶力減退。',
      keyRuleOutTestZh: '血液 TSH、Free T4、CBC、維生素 B12、空腹血糖與必要時腦部影像檢查。',
    },
    referredPainInsightZh:
      '大腦下行疼痛抑制路徑（Descending pain inhibitory pathway）同樣依賴血清素與正腎上腺素調控；當身心長期處於焦慮、失眠或憂鬱狀態時，脊髓對疼痛訊號的過濾閥門會打開，常導致「頭頸肩背緊繃疼痛、胸口悶塞與腸躁腹痛」同步加劇。',
  },
];

/**
 * 模組 E-2 主引擎：計算診斷信心度、Top 2-3 核心懷疑疾病、藥源性排查與跨專科綜合機制分析
 */
export function runDifferentialDiagnosisEngine(
  payload: DiagnosisRequestPayload
): {
  primaryResult: PrimaryDiagnosisResult;
  differentialResult: DifferentialAndAnalysisResult;
} {
  const vitalEval = evaluateObjectiveVitalSigns(payload.followUp.vitals);
  const iatrogenicAlerts = evaluateIatrogenicDrugCauses(payload);

  const isElderly65Plus =
    payload.contextProfile.ageGroup === '65+' ||
    (typeof payload.contextProfile.exactAge === 'number' &&
      payload.contextProfile.exactAge >= 65);
  const onsetOrder = payload.followUp.regionOnsetOrder || [];
  const hasMigration = Boolean(payload.followUp.hasSymptomMigration);
  const selfTreatments = payload.followUp.selfTreatments || [];
  const treatmentResponse = payload.followUp.treatmentResponse;

  // 1. 對知識庫中所有疾病進行多維度臨床特徵計分
  const scoredDiseases = CLINICAL_DISEASE_KNOWLEDGE_BASE.map((tpl) => {
    let score = 20; // 基礎先驗分
    const matchedSupport: string[] = [];

    for (const rec of payload.regionRecords) {
      if (tpl.targetRegions.includes(rec.regionId)) {
        score += 24;
        matchedSupport.push(
          `解剖部位吻合：標記「${rec.regionNameZh.split('（')[0]}」(${
            rec.depthLayer === 'deep_visceral'
              ? '身體深層'
              : rec.depthLayer === 'musculoskeletal'
              ? '肌肉與關節'
              : '皮膚表層'
          })`
        );

        if (tpl.preferredDepths.includes(rec.depthLayer)) {
          score += 12;
        }

        const matchedQ = rec.qualityIds.filter((q) =>
          tpl.keyQualities.includes(q)
        );
        if (matchedQ.length > 0) {
          score += matchedQ.length * 9;
          matchedSupport.push(
            `不適感受性質吻合：${rec.qualityLabelsZh.join('、')}`
          );
        }

        const matchedSp = rec.specificSymptomIds.filter((sp) =>
          tpl.keySpecifics.includes(sp)
        );
        if (matchedSp.length > 0) {
          score += matchedSp.length * 16;
          matchedSupport.push(
            `特異性臨床表現：${rec.specificSymptomLabelsZh.join('；')}`
          );
        }
      }
    }

    // 全身性症狀加分
    const matchedSys = payload.systemicSymptomIds.filter((s) =>
      tpl.keySystemics.includes(s)
    );
    if (matchedSys.length > 0) {
      score += matchedSys.length * 10;
      matchedSupport.push(`合併全身性指標（共 ${matchedSys.length} 項關聯表現）`);
    }

    // 若使用者僅勾選精神科／全身性症狀而未點選局部部位，提高對應全身/精神科模板分數
    if (
      payload.regionRecords.length === 0 &&
      matchedSys.length > 0 &&
      tpl.diseaseId === 'dx_psychiatry_anxiety_panic_depression_insomnia'
    ) {
      score += 28;
    }

    // Batch B-4：65 歲以上高齡非典型表現強制加權
    if (isElderly65Plus) {
      const hasEpigastricOrChest = payload.regionRecords.some((r) =>
        ['abd_epigastric', 'chest_left', 'shoulder_l', 'upper_back'].includes(
          r.regionId
        )
      );
      const hasAtypicalFatigueOrDyspnea = payload.systemicSymptomIds.some((s) =>
        ['sys_fatigue', 'sys_dyspnea', 'sys_diaphoresis', 'sys_dizziness_syncope'].includes(
          s
        )
      );
      if (
        tpl.diseaseId === 'dx_coronary_angina_ischemia' &&
        (hasEpigastricOrChest || hasAtypicalFatigueOrDyspnea)
      ) {
        score += 14;
        matchedSupport.push(
          '65 歲以上高齡非典型表現警覺：長者心肌缺血可能僅以上腹悶痛、虛弱或微喘表現，提高心血管排除權重'
        );
      }

      const hasElderlyInfectionSign = payload.systemicSymptomIds.some((s) =>
        ['sys_confusion_lethargy', 'sys_fatigue', 'sys_fever', 'sys_chills'].includes(s)
      );
      if (
        (tpl.diseaseId === 'dx_urolithiasis_uti_pyelonephritis' ||
          tpl.diseaseId === 'dx_urogenital_uti_prostatitis_vaginitis_epididymitis') &&
        hasElderlyInfectionSign
      ) {
        score += 10;
        matchedSupport.push(
          '65 歲以上高齡感染症非典型表現警覺：長者泌尿或全身感染常以嗜睡、精神混亂或全身倦怠呈現（未必高燒）'
        );
      }
    }

    // Batch B-5：發作先後順序與疼痛轉移路徑加權
    const epiIdx = onsetOrder.indexOf('abd_epigastric');
    const rlqIdx = onsetOrder.indexOf('abd_rlq');
    const hasClassicAppendicitisMigration =
      hasMigration &&
      ((epiIdx !== -1 && rlqIdx !== -1 && epiIdx < rlqIdx) ||
        payload.regionRecords.some((r) => r.regionId === 'abd_rlq'));
    if (
      tpl.diseaseId === 'dx_acute_appendicitis' &&
      hasClassicAppendicitisMigration
    ) {
      score += 18;
      matchedSupport.push(
        '典型轉移痛順序支持：症狀由原發處（如中上腹／肚臍周圍）轉移並定焦於右下腹，符合急性闌尾炎演變'
      );
    }

    // Batch B-6：已自行處置與用藥反應（Treatment Response）加權
    if (selfTreatments.length > 0 && treatmentResponse) {
      const relieved =
        treatmentResponse === 'significant_relief' ||
        treatmentResponse === 'mild_relief';
      const failedOrWorse =
        treatmentResponse === 'no_effect' || treatmentResponse === 'worsened';

      if (selfTreatments.includes('antacid_ppi') && relieved) {
        if (tpl.diseaseId === 'dx_gerd_peptic_ulcer') {
          score += 14;
          matchedSupport.push('用藥反應支持：服用胃藥／制酸劑後獲得緩解，支持胃酸相關黏膜病變');
        }
      }
      if (selfTreatments.includes('analgesic_nsaids') && failedOrWorse) {
        if (tpl.diseaseId === 'dx_gerd_peptic_ulcer') {
          score += 12;
          matchedSupport.push(
            '用藥反應警訊：服用止痛消炎藥 (NSAIDs) 後無效或反而加重，高度警覺消化性潰瘍惡化風險'
          );
        }
        if (
          tpl.diseaseId === 'dx_coronary_angina_ischemia' ||
          tpl.diseaseId === 'dx_acute_cholecystitis_biliary_colic'
        ) {
          score += 8;
          matchedSupport.push(
            '用藥反應線索：一般止痛消炎藥無法緩解，傾向內臟或血管性病因而非單純肌肉骨骼痛'
          );
        }
        if (tpl.diseaseId === 'dx_costochondritis_thoracic_myofascial') {
          score -= 6;
        }
      }
      if (
        (selfTreatments.includes('ice_pack') ||
          selfTreatments.includes('heat_pack') ||
          selfTreatments.includes('rest_lying')) &&
        relieved
      ) {
        if (
          tpl.diseaseId === 'dx_costochondritis_thoracic_myofascial' ||
          tpl.diseaseId === 'dx_lumbar_radiculopathy_or_arthritis'
        ) {
          score += 10;
          matchedSupport.push('物理處置反應：冰／熱敷或平躺休息後緩解，支持肌肉骨骼與筋膜病因');
        }
      }
      if (selfTreatments.includes('antihistamine') && relieved) {
        if (tpl.diseaseId === 'dx_ent_vestibular_sinusitis_pharyngitis') {
          score += 10;
          matchedSupport.push('用藥反應支持：抗組織胺有效緩解，支持過敏或上呼吸道發炎反應');
        }
      }
    }

    // D-2 動態追問命中加權與陰性排除證據
    const negativeAnswers =
      payload.dynamicAnswers?.answers.filter(
        (a) =>
          a.clinicalWeightTag === 'negative_none_or_uncertain' ||
          a.selectedOptionId === 'negative_none_or_uncertain'
      ) || [];

    if (
      tpl.dynamicWeightTag &&
      payload.dynamicAnswers?.answers.some(
        (a) => a.clinicalWeightTag === tpl.dynamicWeightTag
      )
    ) {
      score += 22;
      const ans = payload.dynamicAnswers.answers.find(
        (a) => a.clinicalWeightTag === tpl.dynamicWeightTag
      );
      if (ans) {
        matchedSupport.push(`動態鑑別追問高度支持：「${ans.selectedOptionLabelZh}」`);
      }
    } else if (tpl.dynamicWeightTag && negativeAnswers.length > 0) {
      score -= 6;
    }

    const normalizedPct = Math.min(95, Math.max(38, score));
    const lackingEvidence = [...tpl.typicalLackingCheckZh];
    if (negativeAnswers.length > 0) {
      lackingEvidence.unshift(
        `動態追問陰性排除（${negativeAnswers.length} 題）：「以上特徵皆不符合／不確定」`
      );
    }

    return {
      tpl,
      rawScore: score,
      normalizedPct,
      matchedSupport:
        matchedSupport.length > 0 ? matchedSupport : tpl.typicalSupportZh,
      lackingEvidence,
    };
  }).sort((a, b) => b.rawScore - a.rawScore);

  const top3 = scoredDiseases.slice(0, 3);

  const topSuspectedDiseases: SuspectedDiseaseDiagnosis[] = top3.map(
    (item, idx) => ({
      diseaseId: item.tpl.diseaseId,
      diseaseNameZh: item.tpl.diseaseNameZh,
      diseaseNameEn: item.tpl.diseaseNameEn,
      probabilityLevel:
        idx === 0 && item.normalizedPct >= 65
          ? '高度懷疑 (High Likelihood)'
          : '中度懷疑 (Moderate Likelihood)',
      clinicalMatchScorePct: item.normalizedPct,
      involvedSpecialtiesTw: item.tpl.involvedSpecialtiesTw,
      clinicalReasoning: {
        supportingEvidenceZh: item.matchedSupport,
        unsupportingOrLackingEvidenceZh: item.lackingEvidence,
      },
      pathophysiologyPlainZh: item.tpl.pathophysiologyPlainZh,
      confirmatoryDiagnosticTests: item.tpl.confirmatoryTests,
    })
  );

  // 2. 計算診斷信心度與關鍵缺漏評估 (Diagnostic Confidence & Missing Info)
  const totalQualitiesSelected = payload.regionRecords.reduce(
    (acc, r) => acc + r.qualityIds.length + r.specificSymptomIds.length,
    0
  );
  const hasVitalsEntered =
    Object.values(payload.followUp.vitals || {}).filter(
      (v) => typeof v === 'number' && !isNaN(v)
    ).length > 0;
  const answeredDynamic =
    payload.dynamicAnswers &&
    !payload.dynamicAnswers.wasSkipped &&
    payload.dynamicAnswers.answers.length > 0;

  let specificityScorePct = 45;
  if (payload.regionRecords.length > 0) specificityScorePct += 15;
  if (totalQualitiesSelected >= 2 || payload.systemicSymptomIds.length >= 2)
    specificityScorePct += 15;
  if (hasVitalsEntered) specificityScorePct += 12;
  if (answeredDynamic) specificityScorePct += 13;
  specificityScorePct = Math.min(95, specificityScorePct);

  const missingInfo: string[] = [];
  if (!hasVitalsEntered) {
    missingInfo.push(
      '尚未輸入客觀生命徵象（如實際耳額溫 °C、血壓 mmHg、心率 bpm 或血氧 SpO2），補充量測值可大幅提升感染與心血管鑑別精準度'
    );
  }
  if (!answeredDynamic) {
    missingInfo.push(
      '本次略過了步驟 D-2 動態鑑別追問；回答誘發時機與疼痛演變追問有助於進一步區分相近疾病'
    );
  }
  missingInfo.push(
    `最終確診仍需依賴醫療院所之客觀理學檢查與儀器檢驗（如：${top3[0]?.tpl.confirmatoryTests[0]?.testNameZh.split('—')[0] || '血液與影像檢查'}）`
  );

  const diagnosticConfidence: DiagnosticConfidenceAssessment = {
    confidenceLevel:
      specificityScorePct >= 78
        ? '高信心度 (High Specificity)'
        : specificityScorePct >= 58
        ? '中度信心度 (Moderate Specificity)'
        : '低信心度 (Non-Specific / Early Stage)',
    specificityScorePct,
    assessmentRationaleZh:
      specificityScorePct >= 75
        ? '您已提供明確的解剖部位、組織深度、疼痛感受性質與臨床追問線索，症狀組合具有較高的器官系統指向性。'
        : '目前標記之症狀組合屬於跨疾病常見或初期非特異性表現，以下列出最可能之鑑別診斷，但仍需透過下方關鍵檢查縮小範圍。',
    missingInformationToNarrowDownZh: missingInfo,
  };

  // 3. 次要鑑別診斷（預設摺疊）與跨專科綜合機制分析（納入完整生理情境卡 BMI / 菸酒檳榔 / 過敏 / 家族史 / TOCC）
  const secondaryDifferentialsCollapsed: SecondaryDifferentialItem[] = top3
    .slice(0, 2)
    .map((item) => item.tpl.secondaryPair);

  // 結合疾病模板專科與使用者標記部位的專屬科別，確保眼科、精神科、牙科、乳房外科、大腸直腸外科等絕不遺漏
  const regionPrimarySpecs = payload.regionRecords.flatMap(
    (r) =>
      CLINICAL_DISEASE_KNOWLEDGE_BASE.find((t) =>
        t.targetRegions.includes(r.regionId)
      )?.involvedSpecialtiesTw || []
  );
  const hasPsychSymptoms = payload.systemicSymptomIds.some((s) =>
    s.startsWith('sys_psych_')
  );

  const participatingSpecialtiesTw = Array.from(
    new Set([
      ...top3.flatMap((item) => item.tpl.involvedSpecialtiesTw),
      ...regionPrimarySpecs,
      ...(hasPsychSymptoms ? ['精神科／身心科'] : []),
    ])
  );

  const vitalsContextParts: string[] = [];
  if (vitalEval.abnormalSummaryListZh.length > 0) {
    vitalsContextParts.push(
      `客觀生命徵象異常加權：${vitalEval.abnormalSummaryListZh.join('；')}`
    );
  } else {
    vitalsContextParts.push(
      '生命徵象評估：目前無已輸入之危急生命徵象異常'
    );
  }

  // 身高體重 BMI 評估
  const h = payload.contextProfile.heightCm;
  const w = payload.contextProfile.weightKg;
  if (h && w && h >= 50 && w >= 10) {
    const bmi = Number((w / ((h / 100) * (h / 100))).toFixed(1));
    vitalsContextParts.push(
      `體態指標：身高 ${h} cm、體重 ${w} kg（BMI ${bmi} kg/m²），已納入代謝、心血管與負重關節鑑別權重`
    );
  }

  // 菸酒檳榔習慣
  const habitNotes: string[] = [];
  if (payload.contextProfile.smokingStatus === 'current')
    habitNotes.push('目前吸菸中');
  else if (payload.contextProfile.smokingStatus === 'former')
    habitNotes.push('曾有吸菸史（已戒）');
  if (payload.contextProfile.alcoholHabit === 'regular_heavy')
    habitNotes.push('經常／重度飲酒');
  if (payload.contextProfile.betelNutHabit === 'former_or_current')
    habitNotes.push('曾嚼或目前嚼食檳榔');
  if (habitNotes.length > 0) {
    vitalsContextParts.push(`生活風險習慣加權：${habitNotes.join('、')}`);
  }

  if (payload.contextProfile.chronicConditions.length > 0) {
    vitalsContextParts.push(
      `慢性病史考量：已納入 ${payload.contextProfile.chronicConditions.length} 項既有病史${
        payload.contextProfile.customChronicNote
          ? `（含自填：${payload.contextProfile.customChronicNote}）`
          : ''
      }`
    );
  }

  if (
    payload.contextProfile.familyHistory &&
    payload.contextProfile.familyHistory.length > 0
  ) {
    vitalsContextParts.push(
      `家族病史加權：具 ${payload.contextProfile.familyHistory.length} 項重大家族病史背景`
    );
  }

  if (payload.contextProfile.drugAndFoodAllergies?.trim()) {
    vitalsContextParts.push(
      `過敏史安全提醒：患者註記對「${payload.contextProfile.drugAndFoodAllergies.trim()}」過敏，臨床檢查（如顯影劑）與開立處方時務必主動避開`
    );
  }

  if (
    payload.contextProfile.recentEventsTocc &&
    payload.contextProfile.recentEventsTocc.length > 0
  ) {
    vitalsContextParts.push(
      `近期特殊事件 (TOCC) 警示：具備近期手術外傷、長途飛行久臥（靜脈血栓／肺栓塞風險）或旅遊接觸史（共 ${payload.contextProfile.recentEventsTocc.length} 項）${
        payload.contextProfile.customToccNote
          ? `（補充：${payload.contextProfile.customToccNote}）`
          : ''
      }`
    );
  }

  if (iatrogenicAlerts.length > 0) {
    vitalsContextParts.push(
      `藥源性交叉比對：偵測到 ${iatrogenicAlerts.length} 項目前用藥與主訴症狀具有潛在藥理關聯`
    );
  }

  if (isElderly65Plus) {
    vitalsContextParts.push(
      '高齡非典型表現加權（65 歲以上）：已主動提高長者「不典型心肌梗塞（僅上腹悶痛／虛弱）」與「不典型感染（嗜睡／意識改變但無高燒）」之鑑別警覺'
    );
  }

  if (selfTreatments.length > 0 || treatmentResponse) {
    vitalsContextParts.push(
      `自行處置與反應：處置（${selfTreatments.join(', ') || '已註記'}），反應（${treatmentResponse || '未指定'}）已納入鑑別權重`
    );
  }

  const sequenceText =
    onsetOrder.length > 1
      ? `（病程先後順序：${onsetOrder
          .map(
            (id, idx) =>
              `${idx + 1}. ${
                payload.regionRecords
                  .find((r) => r.regionId === id)
                  ?.regionNameZh.split('（')[0] || id
              }`
          )
          .join(' → ')}${hasMigration ? '，且具明確疼痛轉移現象' : ''}）`
      : '';

  return {
    primaryResult: {
      diagnosticConfidence,
      topSuspectedDiseases,
      iatrogenicAlerts,
    },
    differentialResult: {
      secondaryDifferentialsCollapsed,
      mdtCrossSpecialtyAnalysis: {
        participatingSpecialtiesTw,
        referredPainAndSystemicLinkZh:
          (top3[0]?.tpl.referredPainInsightZh ||
            '內臟器官感覺神經與體表皮節在脊髓背角常發生匯聚，因此深層病灶可能同時在鄰近或遠端皮節產生牽涉痛。') +
          sequenceText,
        vitalsAndContextWeightAnalysisZh: vitalsContextParts.join('。') + '。',
      },
      supplementaryGuidance: {
        recommendedDepartmentsTw: participatingSpecialtiesTw,
        nonPharmacologicalReliefZh: [
          '在尚未由醫師確立診斷前，請避免自行服用強效止痛消炎藥 (NSAIDs)，以免掩蓋發燒或腹部壓痛等關鍵理學徵象。',
          '保持充分休息並記錄症狀發作時段、誘發姿勢與生命徵象（體溫、血壓、心率）變化，於看診時直接出示本報告之鑑別檢查建議與醫師討論。',
        ],
        escalationRedFlagsZh: [
          '若疼痛程度突然躍升至 8～10 分、出現壓痛放開加劇之反彈痛、持續高燒不退或嘔吐無法進水',
          '若新出現胸口重壓冒冷汗、呼吸困難（或血氧 SpO2 < 92%）、單側手腳無力、口齒不清、視力驟降或解黑便／血便，請立即前往急診',
        ],
      },
    },
  };
}
