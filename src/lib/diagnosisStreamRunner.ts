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
 * 若使用者於頂部 API 設定列啟用了自訂 Gemini API Key，在確定性西醫鑑別骨架上補充更細膩的白話病生理與跨科解析
 */
async function enhanceWithOptionalGeminiKey(
  apiKey: string,
  modelId: string,
  payload: DiagnosisRequestPayload,
  basePrimary: PrimaryDiagnosisResult,
  baseDiff: DifferentialAndAnalysisResult
): Promise<{
  primary: PrimaryDiagnosisResult;
  diff: DifferentialAndAnalysisResult;
}> {
  try {
    const cp = payload.contextProfile;
    const isElderly65Plus =
      cp.ageGroup === '65+' ||
      (typeof cp.exactAge === 'number' && cp.exactAge >= 65);
    const bmiText =
      cp.heightCm && cp.weightKg
        ? `${cp.heightCm}cm / ${cp.weightKg}kg (BMI ${(
            cp.weightKg /
            ((cp.heightCm / 100) * (cp.heightCm / 100))
          ).toFixed(1)})`
        : '未填身高體重';

    const onsetSeqText =
      payload.followUp.regionOnsetOrder &&
      payload.followUp.regionOnsetOrder.length > 1
        ? `${payload.followUp.regionOnsetOrder.join(' -> ')}（轉移現象：${
            payload.followUp.hasSymptomMigration ? '是' : '否'
          }）`
        : '單一部位或未指定先後順序';

    const treatmentText =
      payload.followUp.selfTreatments &&
      payload.followUp.selfTreatments.length > 0
        ? `曾使用：${payload.followUp.selfTreatments.join(', ')}；反應：${
            payload.followUp.treatmentResponse || '未指定'
          }`
        : '未填寫自行處置';

    const elderlyDirective = isElderly65Plus
      ? '\n4. 【高齡（65歲以上）強制臨床加權指令】：患者屬 65 歲以上長者，務必強制提高對「高齡非典型表現」之警覺（例如長者心肌梗塞常僅表現為上腹悶痛、呼吸微喘或極度虛弱；重症感染常僅表現為嗜睡、食慾驟降或意識改變而不一定發高燒），並在解析中主動提醒相關鑑別風險。'
      : '';

    const hasAttachments = Boolean(
      payload.attachments && payload.attachments.length > 0
    );

    const prompt = `你是一位資深現代西醫多專科會診 (MDT) 主治醫師（涵蓋內外婦兒、眼科、耳鼻喉科、牙科／口腔顎面外科、精神科／身心科、乳房外科、大腸直腸外科、泌尿科、皮膚科、神經內外科、骨科／復健科、血液腫瘤科、感染科）。
請根據以下患者完整生理情境卡、發作順序、用藥反應${
      hasAttachments ? '與附帶患部照片／檢驗報告影像' : ''
    }以及初步鑑別結果，以 JSON 格式微調強化「referredPainAndSystemicLinkZh（跨科轉移痛與全身關聯白話解析）」與第一順疑似疾病的「pathophysiologyPlainZh（白話病理機轉）」${
      hasAttachments
        ? '，並針對所附影像或檢驗單據輸出獨立的「multimodalFindingsZh（影像／檢驗單判讀發現，繁體中文白話臨床觀察與建議）」'
        : ''
    }。
嚴格遵守：
1. 僅限現代實證西醫（嚴禁任何中醫詞彙）。
2. 保持冷靜、客觀、一般大眾易懂的白話文。
3. 僅回傳合法 JSON：{"enhancedPathophysiologyZh": "...", "enhancedReferredPainLinkZh": "...", "glossary_terms": [{"term": "專有名詞或檢查", "category": "抽血檢驗|無痛影像檢查|侵入性內視鏡|心電圖／生理檢查|臨床徵象／術語", "plain_explanation": "1~2句白話解釋"}]${
      hasAttachments ? ', "multimodalFindingsZh": "..."' : ''
    }}${elderlyDirective}

患者年齡/性別/體態：${cp.ageGroup} / ${cp.biologicalSex} / ${bmiText}
生活習慣：抽菸(${cp.smokingStatus || 'never'})、飲酒(${cp.alcoholHabit || 'none'})、檳榔(${cp.betelNutHabit || 'never'})、運動(${cp.exerciseFrequency || 'moderate_1_2_week'})
慢性病與家族史：慢性病(${cp.chronicConditions.join(',') || '無'} ${cp.customChronicNote || ''})、家族史(${(cp.familyHistory || []).join(',') || '無'})、過敏史(${cp.drugAndFoodAllergies || '無'})
固定用藥與近期特殊事件(TOCC)：用藥(${cp.highRiskMedications.join(',') || '無'} ${cp.customMedicationNote || ''})、TOCC(${(cp.recentEventsTocc || []).join(',') || '無'} ${cp.customToccNote || ''})
標記部位：${payload.regionRecords.map((r) => `${r.regionNameZh}(${r.depthLayer}): ${[...r.qualityLabelsZh, ...r.specificSymptomLabelsZh].join('、')}`).join('；')}
發作先後順序與轉移：${onsetSeqText}
已自行處置與反應：${treatmentText}
全身症狀ID：${payload.systemicSymptomIds.join('、') || '無'}
第一順疑似疾病：${basePrimary.topSuspectedDiseases[0]?.diseaseNameZh || ''} (${basePrimary.topSuspectedDiseases[0]?.diseaseNameEn || ''})`;

    const requestParts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    > = [{ text: prompt }];

    if (hasAttachments && payload.attachments) {
      for (const att of payload.attachments.slice(0, 3)) {
        if (att.base64Data) {
          requestParts.push({
            inlineData: {
              mimeType: att.mimeType || 'image/jpeg',
              data: att.base64Data,
            },
          });
        }
      }
    }

    const targetModel = modelId || 'gemini-2.5-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        targetModel
      )}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: requestParts }],
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
    const parsedGlossary = Array.isArray(parsed.glossary_terms)
      ? parsed.glossary_terms
          .filter(
            (g: unknown): g is {
              term: string;
              category:
                | '抽血檢驗'
                | '無痛影像檢查'
                | '侵入性內視鏡'
                | '心電圖／生理檢查'
                | '臨床徵象／術語';
              plain_explanation: string;
            } =>
              Boolean(
                g &&
                  typeof g === 'object' &&
                  'term' in g &&
                  'plain_explanation' in g &&
                  typeof (g as { term?: unknown }).term === 'string' &&
                  typeof (g as { plain_explanation?: unknown }).plain_explanation ===
                    'string'
              )
          )
          .map((g: { term: string; category?: string; plain_explanation: string }) => ({
            term: g.term,
            category:
              (g.category as
                | '抽血檢驗'
                | '無痛影像檢查'
                | '侵入性內視鏡'
                | '心電圖／生理檢查'
                | '臨床徵象／術語') || '臨床徵象／術語',
            plain_explanation: g.plain_explanation,
          }))
      : undefined;

    const nextPrimary: PrimaryDiagnosisResult = {
      ...basePrimary,
      multimodalFindingsZh: parsed.multimodalFindingsZh
        ? String(parsed.multimodalFindingsZh)
        : basePrimary.multimodalFindingsZh,
      glossary_terms: parsedGlossary,
      topSuspectedDiseases: basePrimary.topSuspectedDiseases.map((d, idx) =>
        idx === 0 && parsed.enhancedPathophysiologyZh
          ? {
              ...d,
              pathophysiologyPlainZh: String(parsed.enhancedPathophysiologyZh),
            }
          : d
      ),
    };
    const nextDiff: DifferentialAndAnalysisResult = {
      ...baseDiff,
      mdtCrossSpecialtyAnalysis: {
        ...baseDiff.mdtCrossSpecialtyAnalysis,
        referredPainAndSystemicLinkZh: parsed.enhancedReferredPainLinkZh
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
  optionalGeminiApiKey?: string,
  optionalGeminiModelId: string = 'gemini-2.5-flash'
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
        optionalGeminiModelId,
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
