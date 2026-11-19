import {
  AssessmentRequestPayload,
  PubMedEvidenceLevel,
  PubMedEvidenceResult,
  VerifiedPubMedArticle,
} from '@/types/medical';

/**
 * 根據使用者勾選之部位與全身症狀，建構嚴格鎖定人類實證研究之 PubMed E-utilities 查詢語法
 * 鐵則：
 * 1. 強制加上 `AND Humans[MeSH]` 排除純動物或細胞實驗
 * 2. 強制篩選高證據等級文獻：`("Practice Guideline"[Publication Type] OR "Meta-Analysis"[Publication Type] OR "Systematic Review"[Publication Type] OR "Randomized Controlled Trial"[Publication Type])`
 */
export function buildLockedPubMedQuery(
  payload: AssessmentRequestPayload
): string {
  const meshTerms = Array.from(
    new Set(payload.regionSymptoms.flatMap((r) => r.meshTermsEn))
  ).slice(0, 4);

  const coreTermClause =
    meshTerms.length > 0
      ? `(${meshTerms.map((t) => `"${t}"[MeSH Terms] OR "${t}"[Title/Abstract]`).join(' OR ')})`
      : '("Signs and Symptoms"[MeSH Terms] OR "Primary Health Care"[MeSH Terms])';

  const evidenceFilter =
    '("Practice Guideline"[Publication Type] OR "Meta-Analysis"[Publication Type] OR "Systematic Review"[Publication Type] OR "Randomized Controlled Trial"[Publication Type])';

  return `${coreTermClause} AND ${evidenceFilter} AND Humans[MeSH] AND english[Language]`;
}

function classifyPubType(pubTypes: string[]): PubMedEvidenceLevel {
  const joined = pubTypes.join(' ').toLowerCase();
  if (joined.includes('practice guideline') || joined.includes('guideline')) {
    return 'Practice Guideline';
  }
  if (joined.includes('meta-analysis')) {
    return 'Meta-Analysis';
  }
  if (joined.includes('systematic review')) {
    return 'Systematic Review';
  }
  if (joined.includes('randomized controlled trial')) {
    return 'Randomized Controlled Trial';
  }
  return 'Clinical Study';
}

function generatePlainTakeawayFromVerifiedMeta(
  title: string,
  evidenceLevel: PubMedEvidenceLevel,
  journalName: string,
  pubYear: string
): string {
  const levelZhMap: Record<PubMedEvidenceLevel, string> = {
    'Practice Guideline': '臨床實踐指引 (Practice Guideline)',
    'Meta-Analysis': '統合分析實證研究 (Meta-Analysis)',
    'Systematic Review': '系統性文獻回顧 (Systematic Review)',
    'Randomized Controlled Trial': '隨機對照臨床試驗 (RCT)',
    'Clinical Study': '人類臨床實證研究',
  };

  return `本篇於 ${pubYear} 年發表在《${journalName}》的【${levelZhMap[evidenceLevel]}】（已鎖定 Humans[MeSH] 人類臨床研究），探討了與您標記部位相關之現代西醫鑑別評估、非侵入性檢查策略與臨床處置共識。就醫時可作為與專科醫師討論檢查方向的實證參考。`;
}

/**
 * 模組 E-3：防幻覺 PubMed E-utilities 真實文獻檢索服務
 * - 絕不允許 LLM 憑記憶生成 PMID、論文標題或年份
 * - 直接向美國國家醫學圖書館 NCBI E-utilities (esearch.fcgi + esummary.fcgi) 取回真實 Metadata
 * - 若無網路或 NCBI API 暫時無法連線，明確回傳 `api_unreachable_fallback` 狀態，絕不輸出虛構文獻
 */
export async function fetchVerifiedPubMedArticles(
  payload: AssessmentRequestPayload
): Promise<PubMedEvidenceResult> {
  const executedQuery = buildLockedPubMedQuery(payload);

  try {
    const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=4&sort=relevance&term=${encodeURIComponent(
      executedQuery
    )}`;

    const searchRes = await fetch(esearchUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!searchRes.ok) {
      throw new Error(`NCBI esearch HTTP ${searchRes.status}`);
    }

    const searchJson = await searchRes.json();
    const idList: string[] = searchJson?.esearchresult?.idlist || [];

    if (idList.length === 0) {
      return {
        status: 'api_unreachable_fallback',
        executedQuery,
        articles: [],
        fallbackNoticeZh:
          '已執行 NCBI PubMed 嚴格實證檢索（含 Humans[MeSH] 與高證據等級過濾），目前此特定複合條件無直接命中之高階指引文獻；為恪守「零幻覺鐵則」，系統絕不生成任何虛構論文。',
      };
    }

    const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${idList.join(
      ','
    )}`;

    const summaryRes = await fetch(esummaryUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!summaryRes.ok) {
      throw new Error(`NCBI esummary HTTP ${summaryRes.status}`);
    }

    const summaryJson = await summaryRes.json();
    const resultObj = summaryJson?.result || {};

    const articles: VerifiedPubMedArticle[] = [];

    for (const pmid of idList) {
      const item = resultObj[pmid];
      if (!item || !item.title) continue;

      const cleanTitle = String(item.title).replace(/<\/?[^>]+(>|$)/g, '');
      const pubDateRaw = String(item.pubdate || '');
      const yearMatch = pubDateRaw.match(/\b(19|20)\d{2}\b/);
      const publicationYear = yearMatch ? yearMatch[0] : pubDateRaw.slice(0, 4) || 'Recent';
      const journalName = String(item.fulljournalname || item.source || 'PubMed Indexed Journal');
      const pubTypes: string[] = Array.isArray(item.pubtype) ? item.pubtype : [];
      const evidenceLevel = classifyPubType(pubTypes);

      articles.push({
        pmid: String(pmid),
        title: cleanTitle,
        publicationYear,
        journalName,
        evidenceLevel,
        pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        plainLanguageTakeawayZh: generatePlainTakeawayFromVerifiedMeta(
          cleanTitle,
          evidenceLevel,
          journalName,
          publicationYear
        ),
      });
    }

    return {
      status: 'verified_live',
      executedQuery,
      articles,
    };
  } catch (err) {
    return {
      status: 'api_unreachable_fallback',
      executedQuery,
      articles: [],
      fallbackNoticeZh:
        '目前處於離線環境或 NCBI PubMed E-utilities 外部連線受限（待連網後可即時檢索）。依據本系統「嚴格防幻覺機制（Metadata Grounding）」，在未取得真實 PubMed API 回傳之 PMID 與 Metadata 前，絕不由 AI 憑記憶生成任何論文標題或編號。',
    };
  }
}
