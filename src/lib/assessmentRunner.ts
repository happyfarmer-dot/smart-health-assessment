import {
  AssessmentRequestPayload,
  AssessmentSSEEvent,
  ClinicalAnalysisResult,
} from '@/types/medical';
import { evaluateRedFlags } from './redFlagEngine';
import { calculateTriageAndSpecialties } from './specialtyRouter';
import { generateDeterministicClinicalAnalysis } from './clinicalSynthesizer';
import { fetchVerifiedPubMedArticles } from './pubmedService';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 若使用者選填了 Gemini API Key (gemini-2.5-flash)，
 * 在確定性實證基底上進行多專科會診白話文潤飾（仍嚴格禁止生成任何 PubMed PMID 或確定性診斷）
 */
async function enhanceWithGeminiIfConfigured(
  payload: AssessmentRequestPayload,
  baseClinical: ClinicalAnalysisResult,
  geminiApiKey?: string
): Promise<ClinicalAnalysisResult> {
  const cleanKey = geminiApiKey?.trim();
  if (!cleanKey) return baseClinical;

  try {
    const prompt = `你是一位遵循現代實證西醫（完全排除中醫）的跨專科臨床導引醫師。
請根據以下病人標記的結構化症狀與確定性基底分析，輸出更細膩但溫和反焦慮的白話 JSON（嚴禁確定性診斷如「你得了XX病」，嚴禁推薦處方藥名或劑量）：
病人資料與症狀：${JSON.stringify(payload)}
目前確定性基底：${JSON.stringify(baseClinical)}

請回傳符合以下欄位的 JSON object:
{
  "mdtCrossSystemInsightZh": "120字內的跨專科整合分析白話說明",
  "summaryText100Words": "嚴格100字內的結構化看診小抄（主訴、部位深度、病程、不適分數、重要病史用藥）"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        cleanKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      }
    );

    if (!res.ok) return baseClinical;
    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return baseClinical;

    const parsed = JSON.parse(rawText);
    return {
      ...baseClinical,
      engineModeUsed: 'gemini_grounded_ai',
      mdtCrossSystemInsightZh:
        parsed.mdtCrossSystemInsightZh || baseClinical.mdtCrossSystemInsightZh,
      doctorCheatSheet: {
        ...baseClinical.doctorCheatSheet,
        summaryText100Words:
          parsed.summaryText100Words ||
          baseClinical.doctorCheatSheet.summaryText100Words,
      },
    };
  } catch {
    return baseClinical;
  }
}

/**
 * 雙棲 4 階段串流執行器 (Web SSE 與 Android APK 原生直連雙模支援)
 */
export async function runProgressiveAssessmentStream(
  payload: AssessmentRequestPayload,
  onStageEvent: (evt: AssessmentSSEEvent) => void,
  options?: { geminiApiKey?: string; preferClientDirect?: boolean }
): Promise<void> {
  const hasCustomKey = Boolean(options?.geminiApiKey?.trim());

  // 若在 Web 環境且未指定強制本機執行，優先嘗試呼叫 /api/assess SSE 串流端點
  if (!options?.preferClientDirect && !hasCustomKey && typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const line = part.trim();
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              const parsed = JSON.parse(jsonStr) as AssessmentSSEEvent;
              onStageEvent(parsed);
            }
          }
        }
        return;
      }
    } catch {
      // 若處於 Android APK 本地檔案協議 (capacitor:// 或 file://) 無後端路由，無縫切換至本機雙棲串流引擎
    }
  }

  // Android APK 離線/直連模式（或帶有自訂 Gemini API Key 時）：直接於裝置端漸進式執行 4 階段引擎
  // Stage 1 (<1s): 確定性紅旗安全檢查
  const redFlagResult = evaluateRedFlags(payload);
  onStageEvent({
    stage: 1,
    event: 'red_flag_check',
    data: redFlagResult,
  });

  await sleep(550);

  // Stage 2 (2-4s): 就醫急迫度燈號與台灣醫院建議掛號科別
  const triageResult = calculateTriageAndSpecialties(payload, redFlagResult);
  onStageEvent({
    stage: 2,
    event: 'triage_and_specialty',
    data: triageResult,
  });

  await sleep(750);

  // Stage 3 (5-8s): 反焦慮分層解析 + 100字看診小抄 + 居家照護與惡化警訊
  const baseClinical = generateDeterministicClinicalAnalysis(
    payload,
    redFlagResult,
    triageResult
  );
  const finalClinical = await enhanceWithGeminiIfConfigured(
    payload,
    baseClinical,
    options?.geminiApiKey
  );

  onStageEvent({
    stage: 3,
    event: 'clinical_analysis',
    data: finalClinical,
  });

  // Stage 4: 防幻覺 PubMed 實證文獻檢索 (直連 NCBI E-utilities)
  const pubmedResult = await fetchVerifiedPubMedArticles(payload);
  onStageEvent({
    stage: 4,
    event: 'pubmed_evidence',
    data: pubmedResult,
  });
}
