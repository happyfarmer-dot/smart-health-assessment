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
      score += matchedSys.length * 8;
      matchedSupport.push(`合併全身性指標（共 ${matchedSys.length} 項關聯表現）`);
    }

    // D-2 動態追問命中加權
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
    }

    const normalizedPct = Math.min(94, Math.max(38, score));
    return {
      tpl,
      rawScore: score,
      normalizedPct,
      matchedSupport:
        matchedSupport.length > 0 ? matchedSupport : tpl.typicalSupportZh,
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
        unsupportingOrLackingEvidenceZh: item.tpl.typicalLackingCheckZh,
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
  if (totalQualitiesSelected >= 2) specificityScorePct += 15;
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

  // 3. 次要鑑別診斷（預設摺疊）與跨專科綜合機制分析
  const secondaryDifferentialsCollapsed: SecondaryDifferentialItem[] = top3
    .slice(0, 2)
    .map((item) => item.tpl.secondaryPair);

  const participatingSpecialtiesTw = Array.from(
    new Set(top3.flatMap((item) => item.tpl.involvedSpecialtiesTw))
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
  if (payload.contextProfile.chronicConditions.length > 0) {
    vitalsContextParts.push(
      `慢性病史考量：已納入 ${payload.contextProfile.chronicConditions.length} 項既有病史對血管與代謝風險之加權`
    );
  }
  if (iatrogenicAlerts.length > 0) {
    vitalsContextParts.push(
      `藥源性交叉比對：偵測到 ${iatrogenicAlerts.length} 項目前用藥與主訴症狀具有潛在藥理關聯`
    );
  }

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
          top3[0]?.tpl.referredPainInsightZh ||
          '內臟器官感覺神經與體表皮節在脊髓背角常發生匯聚，因此深層病灶可能同時在鄰近或遠端皮節產生牽涉痛。',
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
          '若新出現胸口重壓冒冷汗、呼吸困難（或血氧 SpO2 < 92%）、單側手腳無力、口齒不清、意識嗜睡或解黑便／血便，請立即前往急診',
        ],
      },
    },
  };
}
