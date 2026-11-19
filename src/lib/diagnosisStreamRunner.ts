import {
  DiagnosisRequestPayload,
  DifferentialAndAnalysisResult,
  DynamicFollowUpQuestion,
  PrimaryDiagnosisResult,
  PubMedResearchResult,
  SafetyCheckResult,
} from '@/types/cdss';
import { generateHypothesisDrivenQuestions } from './dynamicFollowUpGenerator';
import { evaluateSilentSafetyCheck } from './safetyAndIatrogenicEngine';
import { runDifferentialDiagnosisEngine } from './differentialDiagnosisEngine';
import { fetchVerifiedPubMedResearch } from './pubmedService';

export interface DiagnosisStreamCallbacks {
  onSafetyCheck: (data: SafetyCheckResult) => void;
  onPrimaryDiagnosis: (data: PrimaryDiagnosisResult) => void;
  onDifferentialAndAnalysis: (data: DifferentialAndAnalysisResult) => void;
  onPubMedResearch: (data: PubMedResearchResult) => void;
  onComplete: () => void;
  onError?: (errMessage: string) => void;
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * 階段 D-2：同構取得「AI 假說驅動動態追問（2～3 題關鍵鑑別題）」
 * - 若有 Next.js Server 則呼叫 `/api/followup-questions`
 * - 若部署於 GitHub Pages 純靜態環境，自動無縫切換至瀏覽器端同構引擎 `generateHypothesisDrivenQuestions`
 */
export async function fetchDynamicFollowUpQuestionsIsomorphic(
  payload: Omit<DiagnosisRequestPayload, 'dynamicAnswers'>
): Promise<{
  clinicalContextSummaryZh: string;
  questions: DynamicFollowUpQuestion[];
}> {
  try {
    const res = await fetch('/api/followup-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      return await res.json();
    }
  } catch {
    // 靜態環境自動降級至瀏覽器端同構引擎
  }

  await delay(300);
  return generateHypothesisDrivenQuestions(payload);
}

/**
 * 若使用者於前端設定了 Gemini API Key (選填)，可在確定性西醫鑑別骨架上補充更細膩的白話病生理與跨科解析
 */
async function enhanceWithOptionalGeminiKey(
  apiKey: string,
  payload: DiagnosisRequestPayload,
  basePrimary: PrimaryDiagnosisResult,
  baseDiff: DifferentialAndAnalysisResult
): Promise<{
  primary: PrimaryDiagnosisResult;
  diff: DifferentialAndAnalysisResult;
}> {
  try {
    const prompt = `你是一位資深現代西醫多專科會診 (MDT) 主治醫師。請根據以下患者資料與初步鑑別結果，以 JSON 格式微調強化「referredPainAndSystemicLinkZh（跨科轉移痛與全身關聯白話解析）」與第一順疑似疾病的「pathophysiologyPlainZh（白話病理機轉）」。
嚴格遵守：
1. 僅限現代實證西醫（嚴禁任何中醫詞彙）。
2. 保持冷靜、客觀、一般大眾易懂的白話文。
3. 僅回傳合法 JSON：{"enhancedPathophysiologyZh": "...", "enhancedReferredPainLinkZh": "..."}

患者年齡/性別：${payload.contextProfile.ageGroup} / ${payload.contextProfile.biologicalSex}
標記部位：${payload.regionRecords.map((r) => `${r.regionNameZh}(${r.depthLayer}): ${[...r.qualityLabelsZh, ...r.specificSymptomLabelsZh].join('、')}`).join('；')}
第一順疑似疾病：${basePrimary.topSuspectedDiseases[0]?.diseaseNameZh || ''} (${basePrimary.topSuspectedDiseases[0]?.diseaseNameEn || ''})`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) return { primary: basePrimary, diff: baseDiff };
    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return { primary: basePrimary, diff: baseDiff };

    const parsed = JSON.parse(rawText);
    const nextPrimary: PrimaryDiagnosisResult = {
      ...basePrimary,
      topSuspectedDiseases: basePrimary.topSuspectedDiseases.map((d, idx) =>
        idx === 0 && parsed.enhancedPathophysiologyZh
          ? { ...d, pathophysiologyPlainZh: String(parsed.enhancedPathophysiologyZh) }
          : d
      ),
    };
    const nextDiff: DifferentialAndAnalysisResult = {
      ...baseDiff,
      mdtCrossSpecialtyAnalysis: {
        ...baseDiff.mdtCrossSpecialtyAnalysis,
        referredPainAndSystemicLinkZh:
          parsed.enhancedReferredPainLinkZh
            ? String(parsed.enhancedReferredPainLinkZh)
            : baseDiff.mdtCrossSpecialtyAnalysis.referredPainAndSystemicLinkZh,
      },
    };
    return { primary: nextPrimary, diff: nextDiff };
  } catch {
    return { primary: basePrimary, diff: baseDiff };
  }
}

/**
 * 模組 E & F：同構 4 階段 SSE 串流疾病鑑別診斷執行器
 * - 優先嘗試連線 `/api/diagnose` SSE 端點
 * - 若在 GitHub Pages 純靜態環境（無 Node API），自動以相同 4 階段時序執行同構引擎並直連 NCBI PubMed E-utilities CORS API
 */
export async function runIsomorphicDiagnosisStream(
  payload: DiagnosisRequestPayload,
  callbacks: DiagnosisStreamCallbacks,
  optionalGeminiApiKey?: string
): Promise<void> {
  // 若使用者未填寫自訂 Gemini Key，先嘗試走 Next.js `/api/diagnose` SSE 串流
  if (!optionalGeminiApiKey?.trim()) {
    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (
        response.ok &&
        response.body &&
        response.headers.get('content-type')?.includes('text/event-stream')
      ) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() || '';

          for (const block of blocks) {
            const lines = block.split('\n');
            let eventType = '';
            let dataStr = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                dataStr += line.slice(5).trim();
              }
            }

            if (!eventType || !dataStr) continue;
            const parsedData = JSON.parse(dataStr);

            if (eventType === 'safety_check') {
              callbacks.onSafetyCheck(parsedData as SafetyCheckResult);
            } else if (eventType === 'primary_diagnosis') {
              callbacks.onPrimaryDiagnosis(parsedData as PrimaryDiagnosisResult);
            } else if (eventType === 'differential_and_analysis') {
              callbacks.onDifferentialAndAnalysis(
                parsedData as DifferentialAndAnalysisResult
              );
            } else if (eventType === 'pubmed_research') {
              callbacks.onPubMedResearch(parsedData as PubMedResearchResult);
            }
          }
        }

        callbacks.onComplete();
        return;
      }
    } catch {
      // 自動切換至瀏覽器端同構串流管線 (GitHub Pages Static Mode)
    }
  }

  // Fallback / GitHub Pages Static Isomorphic Pipeline
  try {
    // Event 1: safety_check
    const safetyResult = evaluateSilentSafetyCheck(payload);
    callbacks.onSafetyCheck(safetyResult);

    await delay(240);

    // 執行決定論臨床鑑別診斷引擎
    const { primaryResult, differentialResult } =
      runDifferentialDiagnosisEngine(payload);

    let finalPrimary = primaryResult;
    let finalDiff = differentialResult;

    if (optionalGeminiApiKey?.trim()) {
      const enhanced = await enhanceWithOptionalGeminiKey(
        optionalGeminiApiKey.trim(),
        payload,
        primaryResult,
        differentialResult
      );
      finalPrimary = enhanced.primary;
      finalDiff = enhanced.diff;
    }

    // Event 2: primary_diagnosis
    callbacks.onPrimaryDiagnosis(finalPrimary);

    await delay(260);

    // Event 3: differential_and_analysis
    callbacks.onDifferentialAndAnalysis(finalDiff);

    // Event 4: pubmed_research (NCBI E-utilities supports browser CORS directly)
    const pubmedResult = await fetchVerifiedPubMedResearch(
      payload,
      finalPrimary.topSuspectedDiseases
    );
    callbacks.onPubMedResearch(pubmedResult);

    callbacks.onComplete();
  } catch (err) {
    callbacks.onError?.(
      err instanceof Error ? err.message : '執行臨床鑑別診斷時發生未知錯誤'
    );
    callbacks.onComplete();
  }
}
