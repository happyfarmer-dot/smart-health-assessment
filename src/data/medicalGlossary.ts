import { GlossaryTermItem } from '@/types/cdss';

/**
 * 常見臨床專有名詞與檢查項目白話字典 (Static Clinical Glossary)
 * 供報告頁與輸入介面行內點擊／懸停白話氣泡使用，可與 Gemini LLM 動態回傳的 glossary_terms 自動合併。
 */
export const MEDICAL_GLOSSARY_DICT: GlossaryTermItem[] = [
  {
    term: 'VAS',
    category: '臨床徵象／術語',
    plain_explanation:
      '視覺類比疼痛量表（Visual Analogue Scale），以 1 至 10 分量化主觀不適或疼痛強度；7 分以上通常代表中重度疼痛，需較積極評估。',
  },
  {
    term: '反彈痛',
    category: '臨床徵象／術語',
    plain_explanation:
      '醫師輕壓腹部後「突然放手瞬間」反而比壓下去更痛的徵象（Rebound tenderness），常代表腹膜已受發炎或穿孔刺激，屬急症警訊。',
  },
  {
    term: '心包膜',
    category: '臨床徵象／術語',
    plain_explanation:
      '包覆在心臟外圍的雙層薄膜囊袋；當心包膜發炎時，常引起「平躺更痛、坐起前傾會緩解」的胸痛。',
  },
  {
    term: '心肌旋轉蛋白 (Troponin)',
    category: '抽血檢驗',
    aliases: ['Troponin', '心肌旋轉蛋白'],
    plain_explanation:
      '檢查目的：偵測心肌細胞是否受損壞死。只要心肌梗塞或心肌發炎，血液中的 Troponin 數值會在數小時內明顯上升，是排除心臟急症的核心血液指標。',
  },
  {
    term: 'D-dimer',
    category: '抽血檢驗',
    aliases: ['D-Dimer'],
    plain_explanation:
      '檢查目的：偵測體內是否有血栓正在溶解。常用於快速排除下肢深部靜脈栓塞（DVT）、肺栓塞或主動脈剝離等血管阻塞急症。',
  },
  {
    term: 'CRP',
    category: '抽血檢驗',
    plain_explanation:
      '檢查目的：C-反應蛋白，代表體內急性發炎或細菌感染的敏感指標；數值越高通常反映組織發炎反應越活躍。',
  },
  {
    term: 'CBC',
    category: '抽血檢驗',
    plain_explanation:
      '檢查目的：全血球計數，可一次查看白血球（判斷感染發炎）、紅血球／血紅素（有無貧血內出血）及血小板數值。',
  },
  {
    term: '腹部超音波',
    category: '無痛影像檢查',
    plain_explanation:
      '檢查目的：無輻射、非侵入性地即時掃描肝臟、膽囊結石／發炎、胰臟、腎臟與腹水，也能輔助評估右下腹闌尾腫脹。',
  },
  {
    term: '胃鏡',
    category: '侵入性內視鏡',
    aliases: ['上消化道內視鏡'],
    plain_explanation:
      '檢查目的：由口腔伸入軟式攝影管直接檢視食道、胃與十二指腸黏膜，可確診胃潰瘍、逆流性食道炎並同時做幽門桿菌切片或止血。',
  },
  {
    term: '大腸鏡',
    category: '侵入性內視鏡',
    plain_explanation:
      '檢查目的：從肛門進入檢視直腸與全段大腸黏膜，可用於排查便血、慢性腹瀉、憩室、發炎性腸道疾病或息肉腫瘤。',
  },
  {
    term: '電腦斷層 CT',
    category: '無痛影像檢查',
    aliases: ['電腦斷層', 'CT'],
    plain_explanation:
      '檢查目的：利用多切面 X 光高速重組體內器官 3D 斷層影像，能精準確診闌尾炎、憩室炎、腎結石、主動脈剝離或肺栓塞（部分需注射顯影劑）。',
  },
  {
    term: 'MRI',
    category: '無痛影像檢查',
    aliases: ['核磁共振'],
    plain_explanation:
      '檢查目的：無輻射磁場影像檢查，對腦部血管、脊椎神經根壓迫（如椎間盤突出）及軟組織病變的解析度極高。',
  },
  {
    term: '心電圖',
    category: '心電圖／生理檢查',
    aliases: ['EKG', 'ECG', '12 導程心電圖'],
    plain_explanation:
      '檢查目的：無痛貼片記錄心臟電氣傳導波形，能在數分鐘內偵測急性心肌梗塞、心肌缺血或心律不整。',
  },
  {
    term: '胸部 X 光',
    category: '無痛影像檢查',
    aliases: ['CXR'],
    plain_explanation:
      '檢查目的：快速篩檢肺部感染（肺炎）、氣胸、肋膜積水、心臟擴大或橫膈下遊離空氣（腸胃穿孔徵象）。',
  },
  {
    term: '眼壓',
    category: '心電圖／生理檢查',
    plain_explanation:
      '檢查目的：以氣動或接觸式儀器無痛測量眼球內部壓力，是診斷急性隅角閉鎖性青光眼（可能伴隨頭痛噁心）的關鍵指標。',
  },
  {
    term: '裂隙燈',
    category: '心電圖／生理檢查',
    plain_explanation:
      '檢查目的：眼科高倍顯微鏡檢查，可清晰觀察角膜破皮、結膜發炎、虹彩炎或前房發炎細胞。',
  },
  {
    term: 'TSH',
    category: '抽血檢驗',
    aliases: ['Free T4'],
    plain_explanation:
      '檢查目的：甲狀腺促進素與游離甲狀腺素檢查，用來排查甲狀腺亢進（易心悸焦慮失眠）或甲狀腺低下（易疲倦水腫）。',
  },
  {
    term: 'Amylase',
    category: '抽血檢驗',
    aliases: ['Lipase', '澱粉酶', '解脂酶'],
    plain_explanation:
      '檢查目的：胰臟消化酵素血液濃度檢測；當上腹劇痛輻射至背部且解脂酶大幅升高時，可確診急性胰臟炎。',
  },
  {
    term: 'ALT',
    category: '抽血檢驗',
    aliases: ['AST', '膽紅素'],
    plain_explanation:
      '檢查目的：肝膽功能與黃疸指標，可判斷肝細胞是否發炎受損或膽道是否阻塞。',
  },
  {
    term: '尿液常規',
    category: '抽血檢驗',
    aliases: ['尿液檢查'],
    plain_explanation:
      '檢查目的：檢測尿液中是否有白血球酯酶、亞硝酸鹽（泌尿道感染）或潛血紅血球（腎結石或腎炎）。',
  },
  {
    term: '幽門螺旋桿菌',
    category: '抽血檢驗',
    aliases: ['H. pylori'],
    plain_explanation:
      '檢查目的：透過碳十三呼氣測試、糞便抗原或胃鏡切片偵測胃部細菌感染，是反覆胃炎與消化性潰瘍的主要根因。',
  },
  {
    term: 'NSAIDs',
    category: '臨床徵象／術語',
    plain_explanation:
      '非類固醇消炎止痛藥（如 Ibuprofen、Diclofenac 等）；雖能止痛退燒，但長期或空腹服用容易刺激胃黏膜導致潰瘍並增加腎臟負擔。',
  },
  {
    term: 'SpO2',
    category: '心電圖／生理檢查',
    aliases: ['血氧'],
    plain_explanation:
      '檢查目的：經指尖夾式感測器無痛測量動脈血氧飽和度；成人正常值為 95%～100%，低於 92% 代表明顯缺氧需立即就醫。',
  },
  {
    term: '耳石症',
    category: '臨床徵象／術語',
    plain_explanation:
      '學名「良性陣發性姿勢性眩暈（BPPV）」，因內耳耳石脫落滾入半規管，導致翻身或抬頭時出現數十秒天旋地轉，屬周邊性眩暈而非中風。',
  },
  {
    term: '深部靜脈栓塞',
    category: '臨床徵象／術語',
    aliases: ['DVT'],
    plain_explanation:
      '下肢深層靜脈形成血塊阻塞血流，常表現為單側小腿腫脹、發熱與壓痛；若血塊脫落流至肺部會引發致命的肺栓塞。',
  },
  {
    term: 'Murphy\'s sign',
    category: '臨床徵象／術語',
    aliases: ['墨菲氏徵象'],
    plain_explanation:
      '醫師按壓右上腹肋骨下緣並請病人深吸氣時，因發炎腫脹的膽囊往下撞擊手指而突然痛到吸氣中斷，是急性膽囊炎的經典徵象。',
  },
];
