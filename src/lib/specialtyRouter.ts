import {
  AssessmentRequestPayload,
  BodyRegionId,
  RecommendedSpecialtyItem,
  RedFlagEvaluationResult,
  SymptomDepthLayer,
  TriageAndSpecialtyResult,
  TriageLevel,
} from '@/types/medical';

interface SpecialtyRouteEntry {
  specialtyNameTw: string;
  weight: number;
  reasonZh: string;
}

/**
 * 24 區 × 3 種深度層級 (皮膚表層 / 肌肉與關節 / 身體深層悶痛)
 * 對應台灣醫院標準門診分科之確定性權重矩陣
 */
const REGION_DEPTH_SPECIALTY_MATRIX: Record<
  BodyRegionId,
  Record<SymptomDepthLayer, SpecialtyRouteEntry[]>
> = {
  head_cranial: {
    deep_visceral: [
      {
        specialtyNameTw: '神經內科',
        weight: 10,
        reasonZh: '評估偏頭痛、血管性頭痛、眩暈或中樞神經功能',
      },
      {
        specialtyNameTw: '家庭醫學科',
        weight: 6,
        reasonZh: '整合評估血壓、睡眠壓力與全身性引起之頭痛頭暈',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '神經內科',
        weight: 8,
        reasonZh: '評估緊縮型頭痛與顱周筋膜張力',
      },
      {
        specialtyNameTw: '復健科',
        weight: 7,
        reasonZh: '處理枕部與肩頸肌肉筋膜緊繃引發之張力型頭痛',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 10,
        reasonZh: '評估頭皮毛囊炎、脂漏性皮膚炎或頭部帶狀疱疹',
      },
    ],
  },

  face_sensory: {
    deep_visceral: [
      {
        specialtyNameTw: '耳鼻喉科',
        weight: 9,
        reasonZh: '評估鼻竇炎、內耳前庭眩暈、耳鳴與顏面深部結構',
      },
      {
        specialtyNameTw: '神經內科',
        weight: 9,
        reasonZh: '評估顏面神經麻痺、三叉神經痛或中樞神經徵兆',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '牙科／口腔顎面外科',
        weight: 9,
        reasonZh: '評估顳顎關節障礙或咀嚼肌群疼痛',
      },
      {
        specialtyNameTw: '耳鼻喉科',
        weight: 6,
        reasonZh: '排除耳前與顏面周邊發炎',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '眼科／耳鼻喉科',
        weight: 9,
        reasonZh: '針對眼睛紅痛視力變化由眼科評估；耳鼻表淺問題由耳鼻喉科評估',
      },
      {
        specialtyNameTw: '皮膚科',
        weight: 7,
        reasonZh: '評估臉部皮膚紅疹、過敏或表皮感染',
      },
    ],
  },

  neck_throat: {
    deep_visceral: [
      {
        specialtyNameTw: '耳鼻喉科',
        weight: 10,
        reasonZh: '內視鏡與理學檢查咽喉發炎、扁桃腺、吞嚥卡頓與頸部淋巴結',
      },
      {
        specialtyNameTw: '新陳代謝暨內分泌科',
        weight: 6,
        reasonZh: '若前頸腫大或吞嚥移動腫塊，一併評估甲狀腺狀況',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '復健科',
        weight: 9,
        reasonZh: '評估頸椎退化、落枕、斜方肌拉傷與神經根壓迫',
      },
      {
        specialtyNameTw: '骨科',
        weight: 8,
        reasonZh: '頸椎結構與椎間盤評估',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '耳鼻喉科',
        weight: 8,
        reasonZh: '評估表淺頸部淋巴結腫痛或皮下腫塊',
      },
      {
        specialtyNameTw: '皮膚科',
        weight: 7,
        reasonZh: '頸部皮膚紅疹或接觸性皮膚炎',
      },
    ],
  },

  chest_left: {
    deep_visceral: [
      {
        specialtyNameTw: '心臟內科',
        weight: 12,
        reasonZh: '左胸與心前區深層悶痛、心悸或喘，優先透過心電圖與心臟超音波評估心血管功能',
      },
      {
        specialtyNameTw: '胸腔內科',
        weight: 8,
        reasonZh: '評估肺部、支氣管與胸膜狀況',
      },
      {
        specialtyNameTw: '肝膽腸胃科',
        weight: 6,
        reasonZh: '鑑別胃食道逆流或食道痙攣引起之非心因性胸口悶痛',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '家庭醫學科',
        weight: 9,
        reasonZh: '評估肋軟骨炎、胸壁肌肉拉傷並初步確認心肺安全性',
      },
      {
        specialtyNameTw: '復健科／骨科',
        weight: 8,
        reasonZh: '處理胸廓肋間肌與胸大肌拉傷按壓痛',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 10,
        reasonZh: '評估胸口帶狀疱疹（皮蛇）表淺刺痛水泡、毛囊炎或皮膚疹',
      },
    ],
  },

  chest_right: {
    deep_visceral: [
      {
        specialtyNameTw: '胸腔內科',
        weight: 10,
        reasonZh: '右胸深層刺痛、咳嗽有痰或深呼吸胸痛，優先由胸腔內科安排胸部 X 光與肺功能評估',
      },
      {
        specialtyNameTw: '心臟內科',
        weight: 6,
        reasonZh: '一併排除非典型位置之心血管不適',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '骨科／復健科',
        weight: 9,
        reasonZh: '評估右側肋骨挫傷、肋間肌拉傷或肋軟骨發炎',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 9,
        reasonZh: '評估右側胸廓帶狀疱疹或皮膚紅疹',
      },
      {
        specialtyNameTw: '乳房外科',
        weight: 7,
        reasonZh: '若疼痛或腫塊位於乳房組織，建議由乳房外科超音波評估',
      },
    ],
  },

  upper_back: {
    deep_visceral: [
      {
        specialtyNameTw: '心臟內科',
        weight: 9,
        reasonZh: '與姿勢無關之上背深層劇痛，需優先排除大血管或心臟放射痛',
      },
      {
        specialtyNameTw: '肝膽腸胃科',
        weight: 7,
        reasonZh: '右肩胛與上背深層悶痛有時為膽囊或胰臟之牽涉痛（Referred Pain）',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '復健科',
        weight: 10,
        reasonZh: '評估膏肓區（菱形肌／斜方肌）肌筋膜疼痛症候群與胸椎姿勢負荷',
      },
      {
        specialtyNameTw: '骨科',
        weight: 8,
        reasonZh: '評估胸椎與肩胛骨結構問題',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 10,
        reasonZh: '評估背部帶狀疱疹水泡、毛囊炎或粉瘤感染',
      },
    ],
  },

  // 腹部五區之 1：右上腹 abd_ruq
  abd_ruq: {
    deep_visceral: [
      {
        specialtyNameTw: '肝膽腸胃科',
        weight: 12,
        reasonZh: '右上腹為肝臟、膽囊與十二指腸解剖位置，優先安排腹部超音波排除膽結石、膽囊炎或肝膽問題',
      },
      {
        specialtyNameTw: '一般外科',
        weight: 7,
        reasonZh: '若伴隨發燒或急性膽囊炎徵象，需一般外科共同評估',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '家庭醫學科／復健科',
        weight: 8,
        reasonZh: '評估右上腹直肌或肋緣肌肉拉傷，並由家醫科初步排除肝膽問題',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 10,
        reasonZh: '評估右上腹皮節帶狀疱疹或表皮紅疹',
      },
    ],
  },

  // 腹部五區之 2：左上腹 abd_luq
  abd_luq: {
    deep_visceral: [
      {
        specialtyNameTw: '肝膽腸胃科',
        weight: 11,
        reasonZh: '左上腹涵蓋胃體部、脾臟、胰尾與結腸脾曲，優先由肝膽腸胃科評估消化道與胰脾狀況',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '家庭醫學科',
        weight: 8,
        reasonZh: '評估左肋下緣腹壁肌肉拉傷或肋軟骨不適',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 10,
        reasonZh: '評估左上腹皮膚表淺紅疹或水泡',
      },
    ],
  },

  // 腹部五區之 3：中上腹與肚臍周圍 abd_epigastric
  abd_epigastric: {
    deep_visceral: [
      {
        specialtyNameTw: '肝膽腸胃科',
        weight: 12,
        reasonZh: '中上腹（心窩）與肚臍周圍深層不適，優先由肝膽腸胃科評估胃食道逆流、胃十二指腸潰瘍、急性腸胃炎或胰臟問題',
      },
      {
        specialtyNameTw: '家庭醫學科',
        weight: 7,
        reasonZh: '適合初期急性腸胃炎、脹氣或跨系統症狀之第一線門診評估',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '家庭醫學科',
        weight: 8,
        reasonZh: '評估腹直肌出力拉傷並鑑別上腹內臟問題',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 9,
        reasonZh: '肚臍周圍表皮感染、接觸性皮膚炎或皮膚紅疹',
      },
    ],
  },

  // 腹部五區之 4：右下腹 abd_rlq
  abd_rlq: {
    deep_visceral: [
      {
        specialtyNameTw: '一般外科／急診醫學科',
        weight: 11,
        reasonZh: '右下腹深層疼痛需優先排除急性闌尾炎（盲腸炎），尤其伴隨轉移痛、反彈痛或發燒時',
      },
      {
        specialtyNameTw: '肝膽腸胃科',
        weight: 10,
        reasonZh: '評估盲腸、升結腸、迴腸末端發炎或大腸激躁症',
      },
      {
        specialtyNameTw: '泌尿科',
        weight: 6,
        reasonZh: '鑑別右側輸尿管結石向下放射之疼痛',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '家庭醫學科／一般外科',
        weight: 8,
        reasonZh: '評估右下腹壁拉傷或右側腹股溝筋膜張力，並確保排除闌尾問題',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 9,
        reasonZh: '評估右下腹表皮紅疹或毛囊發炎',
      },
    ],
  },

  // 腹部五區之 5：左下腹 abd_llq
  abd_llq: {
    deep_visceral: [
      {
        specialtyNameTw: '肝膽腸胃科',
        weight: 11,
        reasonZh: '左下腹為降結腸與乙狀結腸位置，優先評估便秘宿便、大腸激躁症、結腸憩室炎或大腸發炎',
      },
      {
        specialtyNameTw: '大腸直腸外科',
        weight: 7,
        reasonZh: '若合併排便習慣明顯改變或血便，可由大腸直腸外科進一步檢查',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '家庭醫學科',
        weight: 8,
        reasonZh: '評估左下腹壁肌肉拉傷或腸道蠕動不適',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 9,
        reasonZh: '左下腹皮膚表層紅疹或過敏',
      },
    ],
  },

  lower_back: {
    deep_visceral: [
      {
        specialtyNameTw: '泌尿科／腎臟內科',
        weight: 10,
        reasonZh: '後腰肋脊角（腎區）深層絞痛或敲擊痛，優先透過驗尿與腎臟超音波排除腎結石或腎盂腎炎',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '骨科',
        weight: 10,
        reasonZh: '評估腰椎退化、椎間盤突出、脊椎滑脫或急性腰部扭傷（閃到腰）',
      },
      {
        specialtyNameTw: '復健科',
        weight: 10,
        reasonZh: '下背豎脊肌拉傷、核心肌群失衡與物理治療復健',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 10,
        reasonZh: '腰部皮節帶狀疱疹或接觸性貼布過敏皮膚炎',
      },
    ],
  },

  pelvis_groin: {
    deep_visceral: [
      {
        specialtyNameTw: '泌尿科',
        weight: 10,
        reasonZh: '評估膀胱炎、泌尿道感染（頻尿、排尿灼熱、血尿）或前列腺問題',
      },
      {
        specialtyNameTw: '家庭醫學科',
        weight: 7,
        reasonZh: '常見下泌尿道感染與骨盆不適之第一線檢查與驗尿',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '一般外科',
        weight: 10,
        reasonZh: '鼠蹊部（腹股溝）站立或出力時鼓起腫塊痛，優先由一般外科評估是否為腹股溝疝氣',
      },
      {
        specialtyNameTw: '骨科／復健科',
        weight: 7,
        reasonZh: '評估恥骨聯合或大腿內收肌群拉傷',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 10,
        reasonZh: '評估鼠蹊部股癬、對磨疹或表淺毛囊炎',
      },
    ],
  },

  buttocks_hip: {
    deep_visceral: [
      {
        specialtyNameTw: '大腸直腸外科',
        weight: 10,
        reasonZh: '評估肛門直腸深部疼痛、內外痔瘡出血或肛門周圍膿瘍',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '骨科／復健科',
        weight: 10,
        reasonZh: '評估坐骨神經痛、梨狀肌症候群、髖關節炎或尾椎挫傷',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '大腸直腸外科／皮膚科',
        weight: 9,
        reasonZh: '評估痔瘡表淺腫痛或臀部皮膚毛囊炎／癤腫',
      },
    ],
  },

  shoulder_r: {
    deep_visceral: [
      {
        specialtyNameTw: '肝膽腸胃科',
        weight: 9,
        reasonZh: '與肩膀活動無關之右肩深層悶痛，需留意是否為肝膽橫膈膜神經牽涉痛',
      },
      {
        specialtyNameTw: '復健科／骨科',
        weight: 7,
        reasonZh: '一併檢查肩關節深層結構',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '復健科',
        weight: 10,
        reasonZh: '透過肌肉骨骼超音波評估右肩旋轉肌袖肌腱炎、五十肩（沾黏性肩關節囊炎）或滑囊炎',
      },
      {
        specialtyNameTw: '骨科',
        weight: 9,
        reasonZh: '右肩關節結構與旋轉肌撕裂評估',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 9,
        reasonZh: '右肩皮膚表層紅疹或接觸性皮膚炎',
      },
    ],
  },

  shoulder_l: {
    deep_visceral: [
      {
        specialtyNameTw: '心臟內科',
        weight: 11,
        reasonZh: '與肩膀轉動無關之左肩深層酸麻悶脹，需優先排除心絞痛或心肌缺氧之左側放射痛',
      },
      {
        specialtyNameTw: '復健科／骨科',
        weight: 6,
        reasonZh: '一併評估左肩關節與頸椎神經根傳導',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '復健科',
        weight: 10,
        reasonZh: '評估左肩旋轉肌袖損傷、五十肩或肩峰夾擠症候群',
      },
      {
        specialtyNameTw: '骨科',
        weight: 9,
        reasonZh: '左肩骨骼關節檢查',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 9,
        reasonZh: '左肩皮膚表層紅疹或刺痛',
      },
    ],
  },

  upper_arm_elbow_r: {
    deep_visceral: [
      {
        specialtyNameTw: '神經內科',
        weight: 10,
        reasonZh: '右上肢突發無力或深層麻木，優先由神經內科評估中樞神經或頸椎神經根傳導',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '復健科／骨科',
        weight: 10,
        reasonZh: '評估右手肘網球肘（肱骨外上髁炎）、高爾夫球肘或二頭肌肌腱拉傷',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 9,
        reasonZh: '右上臂與手肘皮膚濕疹、乾癬或表淺感染',
      },
    ],
  },

  upper_arm_elbow_l: {
    deep_visceral: [
      {
        specialtyNameTw: '心臟內科',
        weight: 10,
        reasonZh: '左上臂內側莫名深層酸麻（尤其伴隨胸口悶），需優先排除心血管放射痛',
      },
      {
        specialtyNameTw: '神經內科',
        weight: 9,
        reasonZh: '左上肢無力或神經根麻木評估',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '復健科／骨科',
        weight: 10,
        reasonZh: '評估左手肘肌腱炎（網球肘）或上臂肌肉拉傷',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 9,
        reasonZh: '左上臂皮膚紅疹或表皮感染',
      },
    ],
  },

  forearm_wrist_hand_r: {
    deep_visceral: [
      {
        specialtyNameTw: '神經內科',
        weight: 9,
        reasonZh: '安排神經傳導檢查評估右腕隧道症候群（正中神經壓迫）或末梢神經病變',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '復健科／骨科',
        weight: 10,
        reasonZh: '評估右手腕媽媽手、腕隧道症候群、板機指或手腕韌帶三角纖維軟骨損傷',
      },
      {
        specialtyNameTw: '風濕免疫科',
        weight: 7,
        reasonZh: '若雙手多處手指小關節對稱腫痛與晨間僵硬，建議由風濕免疫科評估自體免疫關節炎',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 10,
        reasonZh: '評估手部濕疹（富貴手）、汗疱疹或甲溝炎',
      },
    ],
  },

  forearm_wrist_hand_l: {
    deep_visceral: [
      {
        specialtyNameTw: '神經內科',
        weight: 9,
        reasonZh: '評估左手正中神經／尺神經壓迫或頸椎神經根麻木',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '復健科／骨科',
        weight: 10,
        reasonZh: '評估左手腕肌腱炎、媽媽手或手指關節問題',
      },
      {
        specialtyNameTw: '風濕免疫科',
        weight: 7,
        reasonZh: '評估手指多發性關節炎',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 10,
        reasonZh: '評估左手皮膚汗疱疹、接觸性皮膚炎或表淺感染',
      },
    ],
  },

  thigh_knee_r: {
    deep_visceral: [
      {
        specialtyNameTw: '神經內科',
        weight: 10,
        reasonZh: '右下肢無力或大腿深層神經放射麻痛，優先評估神經傳導與中樞神經功能',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '骨科',
        weight: 10,
        reasonZh: '評估右膝退化性關節炎、半月板／十字韌帶損傷或髕骨軟化症',
      },
      {
        specialtyNameTw: '復健科',
        weight: 9,
        reasonZh: '右大腿肌群拉傷與膝關節周邊肌腱韌帶超音波檢查',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 9,
        reasonZh: '右大腿或膝部皮膚紅疹、蜂窩性組織炎初期評估',
      },
    ],
  },

  thigh_knee_l: {
    deep_visceral: [
      {
        specialtyNameTw: '神經內科',
        weight: 10,
        reasonZh: '左下肢無力或腰椎坐骨神經傳導評估',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '骨科',
        weight: 10,
        reasonZh: '評估左膝退化性關節炎、韌帶半月板損傷',
      },
      {
        specialtyNameTw: '復健科',
        weight: 9,
        reasonZh: '左膝與大腿肌肉骨骼超音波與物理治療',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '皮膚科',
        weight: 9,
        reasonZh: '左大腿或膝部表皮紅腫感染評估',
      },
    ],
  },

  calf_ankle_foot_r: {
    deep_visceral: [
      {
        specialtyNameTw: '心臟血管內科／血管外科',
        weight: 11,
        reasonZh: '右小腿單側深層腫脹緊繃壓痛，優先透過血管超音波排除下肢深層靜脈栓塞 (DVT) 或周邊血管循環問題',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '骨科／復健科',
        weight: 10,
        reasonZh: '評估右腳踝韌帶扭傷、足底筋膜炎或阿基里斯腱發炎',
      },
      {
        specialtyNameTw: '風濕免疫科／家庭醫學科',
        weight: 8,
        reasonZh: '若右腳大拇趾關節突發紅腫熱劇痛，優先抽血檢驗尿酸並處理急性痛風性關節炎',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '感染科／皮膚科',
        weight: 10,
        reasonZh: '評估右小腿或足部皮膚紅腫發熱（蜂窩性組織炎）或足癬（香港腳）',
      },
    ],
  },

  calf_ankle_foot_l: {
    deep_visceral: [
      {
        specialtyNameTw: '心臟血管內科／血管外科',
        weight: 11,
        reasonZh: '左小腿單側深層腫脹壓痛，優先排除下肢深層靜脈栓塞 (DVT) 或靜脈回流不全',
      },
    ],
    musculoskeletal: [
      {
        specialtyNameTw: '骨科／復健科',
        weight: 10,
        reasonZh: '評估左腳踝扭傷、足底筋膜炎或小腿肌肉拉傷',
      },
      {
        specialtyNameTw: '風濕免疫科／家庭醫學科',
        weight: 8,
        reasonZh: '評估左足大拇趾急性痛風發作',
      },
    ],
    superficial: [
      {
        specialtyNameTw: '感染科／皮膚科',
        weight: 10,
        reasonZh: '評估左小腿蜂窩性組織炎或足部皮膚感染',
      },
    ],
  },
};

/**
 * 模組 E-1：部位 × 深度 × 生理情境 多專科路由與急迫度分流引擎
 */
export function calculateTriageAndSpecialties(
  payload: AssessmentRequestPayload,
  redFlagResult: RedFlagEvaluationResult
): TriageAndSpecialtyResult {
  const scoreMap = new Map<
    string,
    { weight: number; reasons: Set<string> }
  >();

  const addSpecialty = (name: string, weight: number, reason: string) => {
    const existing = scoreMap.get(name);
    if (existing) {
      existing.weight += weight;
      existing.reasons.add(reason);
    } else {
      scoreMap.set(name, { weight, reasons: new Set([reason]) });
    }
  };

  // 1. 根據每個已選部位 × 深度層級加總專科權重
  for (const item of payload.regionSymptoms) {
    const regionMatrix = REGION_DEPTH_SPECIALTY_MATRIX[item.regionId];
    if (!regionMatrix) continue;

    const entries = regionMatrix[item.depthLayer] || [];
    for (const entry of entries) {
      addSpecialty(entry.specialtyNameTw, entry.weight, entry.reasonZh);
    }
  }

  // 2. 生理情境卡動態加權（如：生理女性下腹痛 → 自動加權婦產科；兒童 0-12 歲 → 自動加權小兒科）
  const isFemale = payload.contextProfile.biologicalSex === 'female';
  const hasLowerAbdOrPelvis = payload.regionSymptoms.some((r) =>
    ['abd_rlq', 'abd_llq', 'pelvis_groin'].includes(r.regionId)
  );
  if (isFemale && hasLowerAbdOrPelvis) {
    addSpecialty(
      '婦產科',
      11,
      '生理女性出現下腹（右下腹／左下腹／恥骨骨盆區）不適，建議同步由婦產科超音波評估卵巢、輸卵管與子宮狀況'
    );
  }

  if (payload.contextProfile.ageGroup === '0-12') {
    addSpecialty(
      '小兒科（兒科）',
      14,
      '0–12 歲兒童生理構造與疾病表現與成人不同，建議優先掛號小兒科進行整體評估'
    );
  }

  // 3. 全身性症狀動態加權
  if (
    payload.systemicSymptoms.includes('fever_high') ||
    payload.systemicSymptoms.includes('chills_rigors')
  ) {
    addSpecialty(
      '家庭醫學科／感染科',
      8,
      '合併發燒或畏寒等全身性發炎感染反應，適合由家醫科或感染科整合評估感染源'
    );
  }

  if (payload.systemicSymptoms.includes('widespread_rash')) {
    addSpecialty(
      '皮膚科／風濕免疫科',
      8,
      '合併全身性起疹，建議由皮膚科或過敏免疫科評估藥物過敏、病毒疹或蕁麻疹'
    );
  }

  // 若僅勾選全身性症狀而無特定部位
  if (scoreMap.size === 0) {
    addSpecialty(
      '家庭醫學科',
      10,
      '針對全身性不適、疲倦、食慾改變或初期未分化症狀，建議優先由家庭醫學科進行全面理學與抽血篩檢'
    );
  }

  // 若已經命中確定性紅旗，將急診醫學科置頂
  if (redFlagResult.isRedFlagTriggered) {
    addSpecialty(
      '急診醫學科（立即就醫）',
      100,
      '您的症狀組合已觸發急症安全紅旗，門診等待可能延誤處置，請優先前往醫院急診室評估'
    );
  }

  // 排序取出前 3 個最推薦科別
  const sorted = Array.from(scoreMap.entries())
    .sort((a, b) => b[1].weight - a[1].weight)
    .slice(0, 3);

  const recommendedSpecialties: RecommendedSpecialtyItem[] = sorted.map(
    ([name, info], idx) => ({
      specialtyNameTw: name,
      priority: idx === 0 ? 'primary' : 'secondary',
      routingReasonZh: Array.from(info.reasons).join('；'),
      scoreWeight: info.weight,
    })
  );

  // 決定紅／黃／綠就醫急迫度燈號
  let triageLevel: TriageLevel = 'green_routine_observation';
  let triageTitleZh = '綠燈：一般門診諮詢與居家觀察';
  let triageSummaryZh =
    '目前症狀未觸發急症紅旗，且疼痛或不適程度屬輕中度。建議可先參考下方居家照護原則觀察，或於方便時段預約建議科別門診。';

  if (redFlagResult.isRedFlagTriggered) {
    triageLevel = 'red_emergency';
    triageTitleZh = '紅燈：建議立即前往急診評估（或撥打 119）';
    triageSummaryZh =
      '系統偵測到需優先排除之急性紅旗徵兆。為確保安全，請勿在宅觀察，建議立即前往急診室由醫護人員透過儀器與檢驗優先排除危急狀況。';
  } else if (
    payload.followUp.severityScore >= 7 ||
    payload.followUp.isSuddenOnset ||
    payload.systemicSymptoms.includes('fever_high') ||
    payload.contextProfile.highRiskMedications.length > 0 ||
    payload.followUp.duration === 'over_1_month'
  ) {
    triageLevel = 'yellow_prompt_outpatient';
    triageTitleZh = '黃燈：建議於 1～3 日內安排專科門診評估';
    triageSummaryZh =
      '雖然目前未出現典型致命急症組合，但因不適感較明顯（或合併發燒、慢性病用藥考量、病程較長），建議儘早安排下方推薦之台灣醫院專科門診由醫師進一步檢查。';
  }

  return {
    triageLevel,
    triageTitleZh,
    triageSummaryZh,
    recommendedSpecialties,
  };
}
