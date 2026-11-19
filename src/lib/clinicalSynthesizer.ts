import {
  AssessmentRequestPayload,
  BodyRegionId,
  ClinicalAnalysisResult,
  CommonPossibilityItem,
  LessCommonDifferentialItem,
  RedFlagEvaluationResult,
  SymptomDepthLayer,
  TriageAndSpecialtyResult,
} from '@/types/medical';
import { DEPTH_LAYER_META, SYSTEMIC_SYMPTOMS } from '@/data/symptomCatalog';

interface EbmClinicalKnowledgeEntry {
  commonLabelZh: string;
  commonPerspectiveZh: string;
  differentialLabelZh: string;
  differentialWhyZh: string;
  differentialCheckZh: string;
  careTipZh: string;
  watchoutZh: string;
}

/**
 * 基於現代實證西醫之結構化反焦慮知識庫（涵蓋各解剖分區 × 深度層級）
 * 嚴格遵守法規紅線：
 * 1. 絕不使用確定性診斷（「你得了 XX 病」），統一使用「可能相關的常見原因：...」
 * 2. 絕不推薦任何特定處方藥名或劑量
 */
const EBM_KNOWLEDGE_BY_GROUP: Record<
  string,
  Record<SymptomDepthLayer, EbmClinicalKnowledgeEntry>
> = {
  head_neck: {
    deep_visceral: {
      commonLabelZh: '可能相關的常見原因：原發性血管性偏頭痛、睡眠不足或上呼吸道前驅反應',
      commonPerspectiveZh:
        '神經內科與家醫科門診中，多數頭部或咽喉深層不適與血管搏動調節、睡眠壓力、鼻竇氣壓變化或一般病毒性咽喉發炎有關，通常在充分休息與補充水分後會逐步緩和。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：非典型顱內壓變化、前庭神經炎或甲狀腺／深頸部發炎',
      differentialWhyZh:
        '當頭痛伴隨持續眩暈、吞嚥明顯受阻或病程超過兩週未改善時，跨專科會一併考量內耳平衡神經或顱頸深層構造。',
      differentialCheckZh: '神經學理學檢查、耳鼻喉科內視鏡，必要時安排腦部影像或抽血檢查。',
      careTipZh: '保持安靜昏暗環境休息，避免強光、熬夜、過量咖啡因與酒精刺激，並記錄發作時段與誘發因子。',
      watchoutZh: '若突然轉為爆炸性劇烈頭痛、伴隨高燒與低頭困難（頸部僵硬）、視力雙影或單側手腳無力，請立即前往急診。',
    },
    musculoskeletal: {
      commonLabelZh: '可能相關的常見原因：張力型頭痛（緊縮型頭痛）、肩頸肌筋膜緊繃或頸椎姿勢負荷',
      commonPerspectiveZh:
        '長時間使用電腦或低頭滑手機容易導致後頸枕部肌群與斜方肌持續收縮，引發像戴了緊帽子般的悶脹痛或轉頭酸痛。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：頸椎椎間盤壓迫神經根或顳顎關節症候群',
      differentialWhyZh:
        '若後頸酸痛開始向下延伸至肩膀或手指發麻，需確認是否有頸椎神經根受壓。',
      differentialCheckZh: '頸椎活動度測試、頸部 X 光或復健科肌肉骨骼超音波檢查。',
      careTipZh: '每 40 分鐘起身活動肩頸，可使用溫熱毛巾熱敷後頸與雙肩 15 分鐘幫助肌肉放鬆（急性紅腫期除外）。',
      watchoutZh: '若出現上肢明顯無力、握力下降或步態不穩，請儘速就醫。',
    },
    superficial: {
      commonLabelZh: '可能相關的常見原因：局部毛囊炎、接觸性皮膚炎或表淺淋巴結反應性腫大',
      commonPerspectiveZh:
        '頭頸部皮膚油脂分泌旺盛或接觸洗髮精、飾品過敏時，常出現表淺紅疹或壓痛小結節。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：頭頸部皮節帶狀疱疹（皮蛇）早期表皮神經痛',
      differentialWhyZh:
        '若單側表皮出現陣發性刺痛或灼熱感，數日後可能浮現群聚小水泡，尤其需注意靠近眼周之皮節。',
      differentialCheckZh: '皮膚科視診與放大鏡檢查。',
      careTipZh: '保持局部清潔乾爽，切勿自行擠壓腫塊或抓破水泡，以免造成細菌二次感染。',
      watchoutZh: '若紅腫範圍快速擴大、波及眼周視力或伴隨發燒，請立即就醫。',
    },
  },

  chest_back: {
    deep_visceral: {
      commonLabelZh: '可能相關的常見原因：胃食道逆流引起之胸口灼熱悶感、自律神經緊繃心悸或氣道敏感',
      commonPerspectiveZh:
        '在排除急性心肌缺氧後，門診許多胸口深層悶痛與食道胃酸逆流刺激、情緒壓力引發之過度換氣或支氣管發炎有關。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：冠狀動脈心肌缺氧（心絞痛）、心律不整、肋膜炎或氣胸',
      differentialWhyZh:
        '胸腔內包含心臟與肺部重要器官，特別是具有三高病史或運動時胸悶加劇者，跨專科必定會優先確認心肺血管安全。',
      differentialCheckZh: '靜態／運動心電圖 (ECG)、胸部 X 光、心肌酵素與胃食道評估。',
      careTipZh: '暫停劇烈運動，採半坐臥姿休息並緩慢深呼吸；若與進食有關，餐後 2 小時內避免平躺。',
      watchoutZh: '一旦胸痛轉為壓迫劇痛、伴隨冒冷汗、喘不過氣或疼痛延伸至左肩、左臂、下巴與後背，請立即撥打 119。',
    },
    musculoskeletal: {
      commonLabelZh: '可能相關的常見原因：肋軟骨炎、胸壁肋間肌拉傷或上背膏肓區肌筋膜疼痛症候群',
      commonPerspectiveZh:
        '若能在胸口或肩胛骨內側找到明確「按壓會痛的定點」，且在深呼吸、轉身、擴胸或搬重物時痛感改變，多數屬於良性的胸廓肌肉軟骨發炎。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：肋骨細微骨裂或內臟牽涉痛（如膽囊反射至右肩胛）',
      differentialWhyZh:
        '劇烈咳嗽或外力碰撞可能造成肋骨骨膜受損；而與姿勢完全無關的上背痛則需留意內臟牽涉痛。',
      differentialCheckZh: '局部觸診、胸部或胸椎 X 光檢查。',
      careTipZh: '近期避免單手提重物、過度擴胸或劇烈推拉動作，給予胸廓軟骨與筋膜修復時間。',
      watchoutZh: '若不再只是按壓痛，而是連靜止不動時也出現深層胸悶氣促，請立即就醫。',
    },
    superficial: {
      commonLabelZh: '可能相關的常見原因：胸背部毛囊炎、汗疹、接觸性皮膚炎或乳房表淺組織發炎',
      commonPerspectiveZh:
        '悶熱流汗或衣物摩擦常在前胸後背引發毛囊發炎紅疹。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：胸椎皮節帶狀疱疹（皮蛇）',
      differentialWhyZh:
        '胸背部是帶狀疱疹最常好發的皮節之一，初期可能先有單側表皮抽痛刺痛，隨後出現條狀紅斑與水泡。',
      differentialCheckZh: '皮膚科理學檢查。',
      careTipZh: '穿著寬鬆透氣棉質衣物，若出現水泡請勿弄破，並儘早由皮膚科醫師評估。',
      watchoutZh: '若皮膚紅腫熱痛快速擴散或伴隨畏寒高燒，請儘速就醫。',
    },
  },

  abdomen_five: {
    deep_visceral: {
      commonLabelZh: '可能相關的常見原因：急性腸胃炎、胃食道逆流／消化性潰瘍、功能性消化不良或腸道脹氣痙攣',
      commonPerspectiveZh:
        '依您標記的腹部五分區定位：中上腹常見於胃十二指腸黏膜刺激或消化不良；右上腹常與進食油膩後之膽道收縮有關；左下腹與右下腹輕度悶脹則常與腸道蠕動、宿便或腸躁症相關。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：急性膽囊炎／膽結石（右上腹）、急性闌尾炎（右下腹）、急性胰臟炎（中左上腹透背痛）或結腸憩室炎（左下腹）',
      differentialWhyZh:
        '腹部五分區對應不同內臟器官；若疼痛從悶脹轉為持續定點劇痛、按壓反彈痛或合併發燒，必須透過影像排除外科急腹症。',
      differentialCheckZh: '腹部理學觸診、腹部超音波（肝膽胰脾腎）、血液發炎指數，必要時安排胃腸內視鏡或電腦斷層。',
      careTipZh: '暫時改採清淡、低油脂、好消化的飲食（或短暫讓腸胃休息並補充溫開水與電解質），避免油炸、辛辣、咖啡、濃茶與酒精；未經醫師評估前請勿自行服用消炎止痛藥 (NSAIDs) 以免傷胃或掩蓋病情。',
      watchoutZh: '若疼痛集中至右下腹且按壓放開劇痛、右上腹痛合併眼白變黃／茶色尿、持續嘔吐無法進水、解黑色柏油便／血便或合併高燒，請立即前往急診。',
    },
    musculoskeletal: {
      commonLabelZh: '可能相關的常見原因：腹直肌或腹外斜肌運動出力拉傷、肋下緣肌腱勞損',
      commonPerspectiveZh:
        '若在仰臥起坐、劇烈咳嗽或搬重物後出現腹部表淺按壓痛，且肚子用力繃緊時疼痛更明顯（Carnett 徵象陽性），多與腹壁肌肉拉傷有關。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：腹壁疝氣或深層腹膜刺激徵象',
      differentialWhyZh:
        '需由醫師觸診確認疼痛僅限於腹壁肌肉層，而非腹腔內臟發炎引起之肌肉防衛性緊繃。',
      differentialCheckZh: '腹部觸診與軟組織超音波。',
      careTipZh: '避免腹部核心出力與提重物，起身時可先側身用手支撐減輕腹肌拉扯。',
      watchoutZh: '若休息時腹痛仍持續加劇或伴隨發燒、噁心嘔吐、排便異常，請立即就醫。',
    },
    superficial: {
      commonLabelZh: '可能相關的常見原因：腹部皮膚過敏紅疹、褲頭摩擦接觸性皮膚炎或肚臍周圍表淺發炎',
      commonPerspectiveZh:
        '腰帶金屬扣環或衣物摩擦常引起腹部表皮搔癢紅疹。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：腹部皮節帶狀疱疹或蜂窩性組織炎',
      differentialWhyZh:
        '單側腹部表皮若出現沿神經分佈的刺痛與水泡，需由皮膚科評估帶狀疱疹。',
      differentialCheckZh: '皮膚科視診評估。',
      careTipZh: '保持肚臍與腹部皮膚清潔乾燥，避免搔抓。',
      watchoutZh: '若肚臍出現惡臭分泌物或紅腫熱痛向外擴散，請儘速就醫。',
    },
  },

  lower_back_pelvis: {
    deep_visceral: {
      commonLabelZh: '可能相關的常見原因：下泌尿道感染（膀胱炎／尿道炎）、生理期骨盆充血或腸道脹氣壓迫',
      commonPerspectiveZh:
        '恥骨上下腹悶痛若伴隨頻尿、尿急或排尿灼熱，最常見為膀胱泌尿道感染；後腰深處悶痛則需留意水分攝取不足引起之泌尿道結晶或腎臟負荷。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：腎結石／輸尿管結石絞痛、急性腎盂腎炎，或女性卵巢囊腫／骨盆腔發炎',
      differentialWhyZh:
        '若後腰肋脊角出現劇烈絞痛或敲擊痛並向下延伸至鼠蹊部，常與泌尿道結石移動有關；生理女性下腹深層痛則需一併納入婦科超音波鑑別。',
      differentialCheckZh: '尿液常規檢查（驗尿）、腎臟與膀胱超音波，女性視情況安排婦產科超音波。',
      careTipZh: '在無心腎限水禁忌下，建議適量增加溫開水攝取、切勿憋尿，並注意排尿顏色與尿量變化。',
      watchoutZh: '若出現後腰劇烈絞痛合併畏寒高燒、明顯血尿、完全無法排尿，或女性異常陰道出血併下腹劇痛，請立即就醫。',
    },
    musculoskeletal: {
      commonLabelZh: '可能相關的常見原因：急性腰部肌肉韌帶拉傷（閃到腰）、久坐腰肌勞損或梨狀肌緊繃',
      commonPerspectiveZh:
        '下背與臀部疼痛在骨科與復健科極為常見，多數與彎腰姿勢不當、久坐核心肌群疲勞或骶髂關節筋膜張力有關。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：腰椎椎間盤突出壓迫坐骨神經，或腹股溝（鼠蹊部）疝氣',
      differentialWhyZh:
        '若下背臀部疼痛呈現電擊般酸麻一路延伸至大腿後側與小腿（坐骨神經痛），或鼠蹊部站立出力時鼓起腫塊，需由專科醫師進一步檢查。',
      differentialCheckZh: '腰椎 X 光、直抬腿神經學測試，鼠蹊部腫塊由一般外科觸診或超音波檢查。',
      careTipZh: '避免彎腰直接搬重物（應屈膝蹲下搬物），久坐時於腰後放置靠墊支撐；鼠蹊部若有鼓起腫塊請勿強行推壓。',
      watchoutZh: '若出現雙下肢無力、跨下鞍部感覺麻木或大小便失禁／解尿困難（馬尾症候群警訊），或鼠蹊腫塊卡住劇痛無法推回，請立即前往急診。',
    },
    superficial: {
      commonLabelZh: '可能相關的常見原因：鼠蹊部股癬／對磨疹、臀部毛囊炎或外痔表淺腫痛',
      commonPerspectiveZh:
        '骨盆與鼠蹊部較易潮濕悶熱，常見黴菌或汗水刺激引起之表皮紅癢；肛門周圍表淺腫痛則常與久坐或便秘引發之痔瘡充血有關。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：肛門周圍膿瘍或腰臀皮節帶狀疱疹',
      differentialWhyZh:
        '若肛門旁出現持續搏動性腫痛且伴隨發燒，需由大腸直腸外科排除肛門膿瘍。',
      differentialCheckZh: '皮膚科或大腸直腸外科視診檢查。',
      careTipZh: '保持局部通風乾爽，排便後可以溫水沖洗或溫水坐浴舒緩。',
      watchoutZh: '若局部紅腫化膿、劇痛無法坐下或合併高燒，請儘速就醫。',
    },
  },

  upper_limbs: {
    deep_visceral: {
      commonLabelZh: '可能相關的常見原因：頸椎神經根壓迫傳導麻木、腕隧道正中神經受壓或末梢循環緊繃',
      commonPerspectiveZh:
        '上肢非外傷性的深層酸麻（如手指麻醒、手臂酸麻），常源於手腕神經通道受壓（腕隧道症候群）或頸椎神經根延伸之傳導感。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：心絞痛／心肌缺氧之左肩左臂放射痛，或中樞神經急性無力',
      differentialWhyZh:
        '當左肩或左上臂內側出現與關節活動無關的深層悶痛（尤其伴隨胸悶氣短），在臨床上必須優先確認是否為心臟牽涉痛。',
      differentialCheckZh: '神經傳導檢查 (NCV)、頸椎評估；若涉及左肩臂深層悶痛則優先安排心電圖。',
      careTipZh: '避免長時間維持同一手腕彎曲或聳肩姿勢，睡眠時避免壓迫患側手臂。',
      watchoutZh: '若左肩臂酸麻同時伴隨胸口壓迫感、冒冷汗，或單側手臂突然無力舉不起來，請立即前往急診。',
    },
    musculoskeletal: {
      commonLabelZh: '可能相關的常見原因：旋轉肌袖肌腱炎／五十肩、網球肘（手肘肌腱炎）或媽媽手（手腕肌腱滑膜炎）',
      commonPerspectiveZh:
        '重複性手部工作、打字用滑鼠、提重物或抱小孩，最常引起肩、肘、腕關節周邊肌腱與滑囊的機械性發炎酸痛。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：旋轉肌袖撕裂傷、類風濕性／痛風性關節炎',
      differentialWhyZh:
        '若雙手多個手指關節出現對稱性紅腫與超過 30 分鐘的晨間僵硬，需由風濕免疫科評估發炎性關節炎。',
      differentialCheckZh: '復健科／骨科高解析度肌肉骨骼超音波、關節活動度檢查或免疫抽血檢驗。',
      careTipZh: '減少重複出力與擰毛巾、提重物動作，可配戴護腕或護肘分散肌腱拉力。',
      watchoutZh: '若關節出現明顯紅腫發燙、外傷後變形無法活動，請儘速就醫。',
    },
    superficial: {
      commonLabelZh: '可能相關的常見原因：手部濕疹（富貴手）、汗疱疹或接觸性皮膚炎',
      commonPerspectiveZh:
        '頻繁洗手、接觸清潔劑或季節轉換時，手指與手掌側面常出現搔癢小水泡或乾燥脫皮。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：甲溝炎或上肢表皮細菌性蜂窩組織炎',
      differentialWhyZh:
        '指甲邊緣微小傷口若受細菌感染，可能引起紅腫化膿之甲溝炎。',
      differentialCheckZh: '皮膚科視診檢查。',
      careTipZh: '接觸洗碗精或清潔劑時配戴內棉外膠手套，洗手後適度塗抹無香精保濕護手霜。',
      watchoutZh: '若紅腫沿著手指或前臂向上蔓延、發燙劇痛，請儘速就醫。',
    },
  },

  lower_limbs: {
    deep_visceral: {
      commonLabelZh: '可能相關的常見原因：久站久坐下肢靜脈回流較慢、腰椎坐骨神經延伸酸麻或電解質不平衡抽筋',
      commonPerspectiveZh:
        '雙腳對稱性的傍晚微腫或酸脹常與久站久坐、靜脈瓣膜回流較慢有關；若是由臀部一路麻到大腿小腿，則多與腰椎神經根有關。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：單側下肢深層靜脈栓塞 (DVT)、周邊動脈阻塞或心腎肝功能相關水腫',
      differentialWhyZh:
        '若「只有單側（僅右小腿或僅左小腿）」出現明顯不對稱腫脹、發熱與小腿肚壓痛，必須優先透過血管超音波排除深層靜脈血栓。',
      differentialCheckZh: '下肢血管杜卜勒超音波、血液 D-dimer 檢驗或神經傳導檢查。',
      careTipZh: '若為雙側久站酸脹，休息時可將小腿微墊高促進回流；但若為「單側小腿不明原因明顯腫痛」，在醫師排除血栓前請勿大力按摩。',
      watchoutZh: '若單側小腿腫痛合併呼吸急促、胸痛，或下肢突發冰冷蒼白、單側無力無法行走，請立即前往急診。',
    },
    musculoskeletal: {
      commonLabelZh: '可能相關的常見原因：膝關節退化或韌帶半月板勞損、足底筋膜炎或腳踝韌帶扭傷',
      commonPerspectiveZh:
        '上下樓梯膝蓋酸痛常與髕骨軟骨磨損或退化有關；早晨下床踩地第一歩腳跟刺痛則是典型的足底筋膜發炎表現。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：急性痛風性關節炎（如大拇趾關節突發紅腫熱痛）或十字韌帶撕裂',
      differentialWhyZh:
        '若腳大拇趾基部或足背、膝蓋在半夜或清晨突發劇烈紅腫熱痛，連風吹或碰到被子都痛，極可能為尿酸結晶引發之急性痛風。',
      differentialCheckZh: '膝踝關節 X 光、肌肉骨骼超音波或抽血檢驗尿酸與發炎指數。',
      careTipZh: '穿著具足弓支撐與吸震鞋底的鞋子，減少蹲跪、爬山或負重上下樓梯；急性紅腫發燙期可局部冷敷休息。',
      watchoutZh: '若關節腫脹劇痛無法踩地負重、或伴隨高燒畏寒（需排除感染性關節炎），請立即就醫。',
    },
    superficial: {
      commonLabelZh: '可能相關的常見原因：足癬（香港腳）、蚊蟲叮咬過敏或下肢乾燥性皮膚炎',
      commonPerspectiveZh:
        '足部趾縫潮濕易滋生黴菌引起脫皮水泡；小腿前側皮膚則常見冬季乾癢或搔抓破皮。',
      differentialLabelZh: '需由醫師鑑別排除之少見可能性：下肢蜂窩性組織炎（Cellulitis）',
      differentialWhyZh:
        '香港腳趾縫的微小裂口常成為細菌進入皮下組織的通道，引起小腿或足背出現邊界擴散的紅、腫、熱、痛。',
      differentialCheckZh: '皮膚科或感染科理學檢查與血液發炎指標。',
      careTipZh: '保持足部趾縫乾爽透氣，若有香港腳破皮切勿赤腳涉水或搔抓。',
      watchoutZh: '若小腿或足部皮膚紅腫熱痛範圍在數小時至一日內明顯擴大、伴隨發燒畏寒，請立即就醫接受抗生素評估。',
    },
  },
};

const DURATION_LABEL_MAP: Record<string, string> = {
  hours: '數小時內（急性發作）',
  days_1_3: '1～3 天',
  weeks_1_2: '1～2 週',
  over_1_month: '超過 1 個月（慢性持續）',
};

/**
 * 產生 100 字內結構化「看診小抄 (Doctor Cheat Sheet)」
 */
export function buildDoctorCheatSheetText(
  payload: AssessmentRequestPayload,
  primarySpecialtyTw: string
): string {
  const sexStr =
    payload.contextProfile.biologicalSex === 'female'
      ? payload.contextProfile.pregnancyStatus === 'possible_or_confirmed'
        ? '生理女(可能懷孕)'
        : '生理女'
      : payload.contextProfile.biologicalSex === 'male'
      ? '生理男'
      : '未註明性別';
  const ageStr = payload.contextProfile.ageGroup || '成人';

  const regionSummaries = payload.regionSymptoms
    .map((r) => {
      const depthShort = DEPTH_LAYER_META[r.depthLayer].shortLabelZh;
      const syms = r.symptomLabelsZh
        .map((s) => s.split('（')[0])
        .slice(0, 2)
        .join('、');
      return `${r.regionNameZh.split('（')[0]}[${depthShort}:${syms}]`;
    })
    .join('；');

  const sysSummaries =
    payload.systemicSymptoms.length > 0
      ? `伴隨${payload.systemicSymptoms
          .map((id) => SYSTEMIC_SYMPTOMS.find((s) => s.id === id)?.labelZh.split('（')[0] || id)
          .join('、')}`
      : '無發燒等全身症狀';

  const durStr = DURATION_LABEL_MAP[payload.followUp.duration] || '近期';
  const onsetStr = payload.followUp.isSuddenOnset ? '突發' : '漸進';
  const radStr = payload.followUp.hasRadiation
    ? `有放射痛(${payload.followUp.radiationTargetNote || '鄰近部位'})`
    : '無放射痛';

  const historyParts: string[] = [];
  if (payload.contextProfile.chronicConditions.length > 0) {
    historyParts.push(`病史:${payload.contextProfile.chronicConditions.length}項`);
  }
  if (payload.contextProfile.highRiskMedications.includes('anticoagulants')) {
    historyParts.push('服抗凝血劑');
  } else if (payload.contextProfile.highRiskMedications.length > 0) {
    historyParts.push('有固定用藥');
  }
  const historyStr = historyParts.length > 0 ? `(${historyParts.join('/')})` : '';

  const rawSummary = `【看診摘要】${ageStr}/${sexStr}${historyStr}。主訴：${
    regionSummaries || '全身不適'
  }，${sysSummaries}。病程：${durStr}(${onsetStr})，不適程度 ${
    payload.followUp.severityScore
  }/10 分，${radStr}。建議優先評估：${primarySpecialtyTw}。`;

  return rawSummary.length > 115 ? rawSummary.slice(0, 112) + '...' : rawSummary;
}

/**
 * 模組 E-2：確定性實證西醫反焦慮分析合成器（免 API Key 即可完整運作，亦可作為 Gemini Grounding 基底）
 */
export function generateDeterministicClinicalAnalysis(
  payload: AssessmentRequestPayload,
  redFlagResult: RedFlagEvaluationResult,
  triageResult: TriageAndSpecialtyResult
): ClinicalAnalysisResult {
  const commonList: CommonPossibilityItem[] = [];
  const differentialList: LessCommonDifferentialItem[] = [];
  const careTipsSet = new Set<string>();
  const watchoutsSet = new Set<string>();

  for (const item of payload.regionSymptoms) {
    // 找出該部位所屬的大分區群組
    let groupKey = 'abdomen_five';
    if (['head_cranial', 'face_sensory', 'neck_throat'].includes(item.regionId)) {
      groupKey = 'head_neck';
    } else if (['chest_left', 'chest_right', 'upper_back'].includes(item.regionId)) {
      groupKey = 'chest_back';
    } else if (
      ['abd_ruq', 'abd_luq', 'abd_epigastric', 'abd_rlq', 'abd_llq'].includes(
        item.regionId
      )
    ) {
      groupKey = 'abdomen_five';
    } else if (
      ['lower_back', 'pelvis_groin', 'buttocks_hip'].includes(item.regionId)
    ) {
      groupKey = 'lower_back_pelvis';
    } else if (
      [
        'shoulder_r',
        'shoulder_l',
        'upper_arm_elbow_r',
        'upper_arm_elbow_l',
        'forearm_wrist_hand_r',
        'forearm_wrist_hand_l',
      ].includes(item.regionId)
    ) {
      groupKey = 'upper_limbs';
    } else {
      groupKey = 'lower_limbs';
    }

    const knowledge =
      EBM_KNOWLEDGE_BY_GROUP[groupKey]?.[item.depthLayer] ||
      EBM_KNOWLEDGE_BY_GROUP.abdomen_five.deep_visceral;

    commonList.push({
      conditionLabelZh: `【${item.regionNameZh.split('（')[0]}・${
        DEPTH_LAYER_META[item.depthLayer].labelZh
      }】${knowledge.commonLabelZh}`,
      specialtyPerspectiveZh: knowledge.commonPerspectiveZh,
      matchingSymptomsZh: item.symptomLabelsZh,
      likelihoodBadge: commonList.length === 0 ? '最常見相關' : '常見相關',
    });

    differentialList.push({
      conditionLabelZh: `【${item.regionNameZh.split('（')[0]}鑑別】${
        knowledge.differentialLabelZh
      }`,
      whyConsiderZh: knowledge.differentialWhyZh,
      whatDoctorMayCheckZh: knowledge.differentialCheckZh,
    });

    careTipsSet.add(knowledge.careTipZh);
    watchoutsSet.add(knowledge.watchoutZh);
  }

  // 若僅選全身性症狀而無特定部位
  if (commonList.length === 0) {
    commonList.push({
      conditionLabelZh:
        '可能相關的常見原因：一般病毒性感染前驅期（如感冒／流感初期）、睡眠不足或身心疲勞反應',
      specialtyPerspectiveZh:
        '家庭醫學科門診中，單純的全身倦怠、微燒或食慾下降常為免疫系統應對一般感染或短期生理壓力之表現。',
      matchingSymptomsZh: payload.systemicSymptoms.map(
        (id) => SYSTEMIC_SYMPTOMS.find((s) => s.id === id)?.labelZh || id
      ),
      likelihoodBadge: '最常見相關',
    });
    differentialList.push({
      conditionLabelZh:
        '需由醫師鑑別排除之少見可能性：內分泌代謝異常（如甲狀腺／血糖波動）、慢性貧血或潛在發炎性疾病',
      whyConsiderZh:
        '若全身無力、盜汗或體重異常減輕持續超過 2～4 週，建議透過基礎血液生化檢查釐清。',
      whatDoctorMayCheckZh:
        '全血球計數 (CBC)、發炎指數 (CRP/ESR)、肝腎功能、血糖與甲狀腺功能抽血檢查。',
    });
    careTipsSet.add(
      '保持充足睡眠與水分電解質補充，定時測量並記錄早晚體溫變化。'
    );
    watchoutsSet.add(
      '若持續高燒超過 38.5°C 達 48 小時以上、出現呼吸急促、意識嗜睡或特定部位劇痛，請立即就醫。'
    );
  }

  // 跨系統整合觀點 (Simulated MDT)
  const primarySpec =
    triageResult.recommendedSpecialties[0]?.specialtyNameTw || '家庭醫學科';
  const secondarySpecs = triageResult.recommendedSpecialties
    .slice(1)
    .map((s) => s.specialtyNameTw)
    .join('、');

  let mdtCrossSystemInsightZh = `跨專科會診視角（Simulated MDT）：綜合您標記的 ${
    payload.regionSymptoms.length
  } 處解剖部位深度與 ${
    payload.systemicSymptoms.length
  } 項全身反應，建議優先由【${primarySpec}】進行主軸評估`;
  if (secondarySpecs) {
    mdtCrossSystemInsightZh += `，並視臨床檢查結果協同【${secondarySpecs}】交叉鑑別`;
  }
  mdtCrossSystemInsightZh += `。在現代實證西醫中，將症狀區分為「表層皮膚、肌肉關節、深層內臟」有助於大幅縮小鑑別範圍；請不必過度焦慮，多數門診案例在釐清病程與基礎理學檢查後皆能獲得明確處置方向。`;

  if (payload.contextProfile.highRiskMedications.includes('anticoagulants')) {
    mdtCrossSystemInsightZh +=
      ' 此外，因您的生理情境卡標註正在服用「抗凝血／抗血小板藥物」，就醫時請務必主動告知醫師，以利評估出血風險與檢查安排。';
  }

  const cheatSheetText = buildDoctorCheatSheetText(payload, primarySpec);

  return {
    engineModeUsed: 'deterministic_ebm',
    commonPossibilitiesExpanded: commonList,
    lessCommonDifferentialCollapsed: differentialList,
    mdtCrossSystemInsightZh,
    doctorCheatSheet: {
      summaryText100Words: cheatSheetText,
      suggestedQuestionsForDoctor: [
        `請問依我的症狀位置與深度，最可能的原因偏向哪一類？需要先做超音波、X 光或抽血檢查嗎？`,
        `在等待檢查結果或居家休養期間，有哪些生活飲食禁忌需要特別配合？`,
        `如果出現哪些症狀變化（例如疼痛超過幾分或發燒），我應該提早回診或直接轉往急診？`,
      ],
    },
    homeCareAndWatchouts: {
      generalCareTipsZh: Array.from(careTipsSet),
      escalationTriggersZh: Array.from(watchoutsSet),
    },
  };
}
