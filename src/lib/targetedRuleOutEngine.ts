import {
  DiagnosisRequestPayload,
  PrimaryDiagnosisResult,
  SuspectedDiseaseDiagnosis,
  TargetedRuleOutRoundSummary,
} from '@/types/cdss';

export interface TargetedRuleOutQuestion {
  questionId: string;
  targetDiseaseId: string;
  targetDiseaseNameZh: string;
  questionTextZh: string;
  clinicalRationaleZh: string;
  options: Array<{
    optionId: 'yes' | 'no' | 'uncertain';
    labelZh: string;
  }>;
}

export interface TargetedRuleOutAnswer {
  questionId: string;
  targetDiseaseId: string;
  questionTextZh: string;
  selectedOptionId: 'yes' | 'no' | 'uncertain';
  selectedLabelZh: string;
}

const DEFAULT_OPTIONS: TargetedRuleOutQuestion['options'] = [
  { optionId: 'yes', labelZh: '符合（有此特徵）' },
  { optionId: 'no', labelZh: '不符合（確定沒有）' },
  { optionId: 'uncertain', labelZh: '不確定／尚未觀察' },
];

function buildOfflineRuleOutQuestions(
  topDiseases: SuspectedDiseaseDiagnosis[],
  focusDiseaseId?: string
): TargetedRuleOutQuestion[] {
  const targets = focusDiseaseId
    ? topDiseases.filter((d) => d.diseaseId === focusDiseaseId)
    : topDiseases;
  const list = targets.length > 0 ? targets : topDiseases;
  const questions: TargetedRuleOutQuestion[] = [];

  list.forEach((dx, idx) => {
    const lackingList = dx.clinicalReasoning.unsupportingOrLackingEvidenceZh;
    const primaryHint =
      lackingList[0] ||
      `是否出現「${dx.diseaseNameZh}」的典型特異性體徵或誘發緩解規律？`;
    questions.push({
      questionId: `ro_${dx.diseaseId}_${idx}_a`,
      targetDiseaseId: dx.diseaseId,
      targetDiseaseNameZh: dx.diseaseNameZh,
      questionTextZh: `針對【${dx.diseaseNameZh}】鑑別確認：${primaryHint.replace(
        /^若無/,
        '是否出現'
      )}`,
      clinicalRationaleZh:
        '此臨床線索為區分該疾病與其他候選診斷的重要陽性／陰性關鍵指標。',
      options: DEFAULT_OPTIONS,
    });

    if ((focusDiseaseId || list.length === 1) && lackingList[1]) {
      questions.push({
        questionId: `ro_${dx.diseaseId}_${idx}_b`,
        targetDiseaseId: dx.diseaseId,
        targetDiseaseNameZh: dx.diseaseNameZh,
        questionTextZh: `進一步排除確認：${lackingList[1]}`,
        clinicalRationaleZh: '用以評估是否能排除或大幅提高此診斷之可能性。',
        options: DEFAULT_OPTIONS,
      });
    }
  });

  if (questions.length < 3 && list[0]) {
    const firstTest = list[0].confirmatoryDiagnosticTests[0];
    questions.push({
      questionId: `ro_course_${Date.now()}`,
      targetDiseaseId: list[0].diseaseId,
      targetDiseaseNameZh: list[0].diseaseNameZh,
      questionTextZh: `病程與姿勢反應確認：不適感是否呈現「特定姿勢、進食或用力時明顯加劇」，且符合【${list[0].diseaseNameZh}】的典型誘發模式？`,
      clinicalRationaleZh:
        firstTest
          ? `輔助評估安排「${firstTest.testNameZh}」的優先順序。`
          : '輔助確認病灶來源層級。',
      options: DEFAULT_OPTIONS,
    });
  }

  return questions.slice(0, 4);
}

/**
 * 產生 3～4 題「AI 針對性排除與確認追問」
 */
export async function generateTargetedRuleOutQuestions(params: {
  payload: DiagnosisRequestPayload | null;
  primaryResult: PrimaryDiagnosisResult;
  focusDiseaseId?: string;
  apiKey?: string;
  modelId?: string;
}): Promise<{
  questions: TargetedRuleOutQuestion[];
  source: 'gemini_ai' | 'rule_engine';
}> {
  const top3 = params.primaryResult.topSuspectedDiseases;
  const focusDx = params.focusDiseaseId
    ? top3.find((d) => d.diseaseId === params.focusDiseaseId)
    : undefined;

  if (!params.apiKey?.trim()) {
    return {
      questions: buildOfflineRuleOutQuestions(top3, params.focusDiseaseId),
      source: 'rule_engine',
    };
  }

  const targetModel = params.modelId || 'gemini-2.5-flash';
  const regionSummary = params.payload
    ? params.payload.regionRecords
        .map(
          (r) =>
            `${r.regionNameZh}: ${[
              ...r.qualityLabelsZh,
              ...r.specificSymptomLabelsZh,
            ].join('、')}`
        )
        .join('；')
    : '無部位紀錄';

  const candidatesSummary = top3
    .map(
      (d, i) =>
        `${i + 1}. [id=${d.diseaseId}] ${d.diseaseNameZh} (吻合度 ${
          d.clinicalMatchScorePct
        }%)｜尚待確認點：${d.clinicalReasoning.unsupportingOrLackingEvidenceZh.join(
          '；'
        )}`
    )
    .join('\n');

  const prompt = `你是一位資深現代西醫臨床主治醫師。患者剛取得初步 Top 3 鑑別診斷報告，現在要進行「針對性排除與信心度強化追問 (Final Targeted Rule-Out)」。
${
  focusDx
    ? `本次特別聚焦於單一疾病深挖確認／排除：【${focusDx.diseaseNameZh} (id=${focusDx.diseaseId})】。`
    : '本次目標為生成能「一擊區分這 Top 3 疾病」的關鍵鑑別問句。'
}

患者現有症狀：${regionSummary}
全身症狀：${params.payload?.systemicSymptomIds.join('、') || '無'}
Top 3 候選疾病：
${candidatesSummary}

請嚴格遵守：
1. 生成 3 到 4 題高度聚焦的「確認／排除專用題」（例如特定姿勢測試反應、病程演變細節、排泄或伴隨體徵），每題鎖定對應一個 targetDiseaseId（必須完全等於上述方括號中的 id）。
2. 每題固定提供 3 個選項（optionId 必須是 "yes"、"no"、"uncertain"），其中 "yes" 代表符合該疾病特徵、"no" 代表不符合可協助排除、"uncertain" 代表不確定。
3. 僅回傳合法 JSON：
{"questions": [{"questionId": "q1", "targetDiseaseId": "...", "targetDiseaseNameZh": "...", "questionTextZh": "...", "clinicalRationaleZh": "...", "options": [{"optionId": "yes", "labelZh": "符合（有此特徵）"}, {"optionId": "no", "labelZh": "不符合（確定沒有）"}, {"optionId": "uncertain", "labelZh": "不確定／尚未觀察"}]}]}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      targetModel
    )}:generateContent?key=${encodeURIComponent(params.apiKey.trim())}`,
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

  if (!res.ok) {
    let errText = `HTTP ${res.status}`;
    try {
      const ej = await res.json();
      if (ej?.error?.message) errText += `：${ej.error.message}`;
    } catch {
      // ignore
    }
    throw new Error(`Gemini API 產生排除題失敗（${errText}）`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini API 未回傳排除追問內容');
  }

  const parsed = JSON.parse(rawText);
  if (!Array.isArray(parsed?.questions) || parsed.questions.length === 0) {
    throw new Error('Gemini API 回傳題目格式異常');
  }

  const validIds = new Set(top3.map((d) => d.diseaseId));
  const sanitized: TargetedRuleOutQuestion[] = parsed.questions
    .slice(0, 4)
    .map((q: Record<string, unknown>, idx: number) => {
      const targetId = validIds.has(String(q.targetDiseaseId))
        ? String(q.targetDiseaseId)
        : focusDx?.diseaseId || top3[idx % top3.length]?.diseaseId || '';
      const matchedDx = top3.find((d) => d.diseaseId === targetId);
      return {
        questionId: String(q.questionId || `gemini_ro_${idx}`),
        targetDiseaseId: targetId,
        targetDiseaseNameZh:
          matchedDx?.diseaseNameZh || String(q.targetDiseaseNameZh || ''),
        questionTextZh: String(q.questionTextZh || ''),
        clinicalRationaleZh: String(q.clinicalRationaleZh || ''),
        options:
          Array.isArray(q.options) && q.options.length >= 2
            ? q.options.map((o: Record<string, unknown>) => ({
                optionId:
                  o.optionId === 'yes' || o.optionId === 'no'
                    ? o.optionId
                    : 'uncertain',
                labelZh: String(o.labelZh || '不確定'),
              }))
            : DEFAULT_OPTIONS,
      };
    });

  return { questions: sanitized, source: 'gemini_ai' };
}

/**
 * 依據使用者的排除問答結果，重新計算 Top 3 疾病排序、吻合度、動態徽章與綜合信心度
 */
export async function recalculateDiagnosisWithRuleOut(params: {
  primaryResult: PrimaryDiagnosisResult;
  answers: TargetedRuleOutAnswer[];
  roundNumber: number;
  targetMode: 'top3_overall' | 'single_disease';
  targetDiseaseNameZh?: string;
  apiKey?: string;
  modelId?: string;
}): Promise<PrimaryDiagnosisResult> {
  const beforePct = params.primaryResult.diagnosticConfidence.specificityScorePct;
  const top3 = params.primaryResult.topSuspectedDiseases;

  if (params.apiKey?.trim()) {
    const targetModel = params.modelId || 'gemini-2.5-flash';
    const prompt = `你是一位資深現代西醫主治醫師。請根據患者剛剛回答的「針對性確認／排除追問」結果，重新調整 Top 3 候選疾病的臨床吻合度百分比、排序、狀態徽章與綜合診斷信心度。

目前綜合信心度：${beforePct}%
目前 Top 3 候選疾病：
${top3
  .map(
    (d) =>
      `- id=${d.diseaseId} | ${d.diseaseNameZh} | 原吻合度=${d.clinicalMatchScorePct}%`
  )
  .join('\n')}

本輪排除追問回答：
${params.answers
  .map(
    (a) =>
      `- [目標疾病 id=${a.targetDiseaseId}] ${a.questionTextZh} => 患者回答：「${a.selectedLabelZh} (${a.selectedOptionId})」`
  )
  .join('\n')}

請嚴格回傳合法 JSON：
{
  "confidenceAfterPct": 數字(25到98之間),
  "reasoningSummaryZh": "2~3句白話總結本次排除追問如何改變臨床推理結論",
  "diseaseUpdates": [
    {
      "diseaseId": "必須與上述id一致",
      "newScorePct": 數字(15到98之間),
      "trend": "reinforced" | "ruled_down" | "unchanged",
      "addedEvidenceZh": "一句簡短新增支持或排除說明"
    }
  ]
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        targetModel
      )}:generateContent?key=${encodeURIComponent(params.apiKey.trim())}`,
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

    if (!res.ok) {
      let errText = `HTTP ${res.status}`;
      try {
        const ej = await res.json();
        if (ej?.error?.message) errText += `：${ej.error.message}`;
      } catch {
        // ignore
      }
      throw new Error(`Gemini API 重新計算鑑別失敗（${errText}）`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error('Gemini API 未回傳更新後的鑑別結果');
    }

    const parsed = JSON.parse(rawText);
    const updatesMap = new Map<
      string,
      {
        newScorePct: number;
        trend: 'reinforced' | 'ruled_down' | 'unchanged';
        addedEvidenceZh?: string;
      }
    >();
    if (Array.isArray(parsed.diseaseUpdates)) {
      for (const u of parsed.diseaseUpdates) {
        updatesMap.set(String(u.diseaseId), {
          newScorePct: Math.max(15, Math.min(98, Number(u.newScorePct) || 50)),
          trend:
            u.trend === 'reinforced' || u.trend === 'ruled_down'
              ? u.trend
              : 'unchanged',
          addedEvidenceZh: u.addedEvidenceZh ? String(u.addedEvidenceZh) : undefined,
        });
      }
    }

    const updatedDiseases = top3
      .map((dx) => {
        const u = updatesMap.get(dx.diseaseId);
        if (!u) return dx;
        const nextScore = u.newScorePct;
        return {
          ...dx,
          clinicalMatchScorePct: nextScore,
          probabilityLevel:
            nextScore >= 68
              ? ('高度懷疑 (High Likelihood)' as const)
              : ('中度懷疑 (Moderate Likelihood)' as const),
          ruleOutTrend: u.trend,
          clinicalReasoning: {
            supportingEvidenceZh:
              u.trend === 'reinforced' && u.addedEvidenceZh
                ? [...dx.clinicalReasoning.supportingEvidenceZh, `[第${params.roundNumber}輪確認] ${u.addedEvidenceZh}`]
                : dx.clinicalReasoning.supportingEvidenceZh,
            unsupportingOrLackingEvidenceZh:
              u.trend === 'ruled_down' && u.addedEvidenceZh
                ? [...dx.clinicalReasoning.unsupportingOrLackingEvidenceZh, `[第${params.roundNumber}輪排除] ${u.addedEvidenceZh}`]
                : dx.clinicalReasoning.unsupportingOrLackingEvidenceZh,
          },
        };
      })
      .sort((a, b) => b.clinicalMatchScorePct - a.clinicalMatchScorePct);

    const afterPct = Math.max(
      25,
      Math.min(98, Number(parsed.confidenceAfterPct) || beforePct + 10)
    );
    const roundSummary: TargetedRuleOutRoundSummary = {
      roundNumber: params.roundNumber,
      targetMode: params.targetMode,
      targetDiseaseNameZh: params.targetDiseaseNameZh,
      confidenceBeforePct: beforePct,
      confidenceAfterPct: afterPct,
      confidenceDeltaPct: afterPct - beforePct,
      reasoningSummaryZh: String(
        parsed.reasoningSummaryZh || '已依據排除追問結果重新排序並更新信心度。'
      ),
      answeredItems: params.answers.map((a) => ({
        questionTextZh: a.questionTextZh,
        selectedLabelZh: a.selectedLabelZh,
      })),
      engineSource: 'gemini_ai',
    };

    return {
      ...params.primaryResult,
      diagnosticConfidence: {
        ...params.primaryResult.diagnosticConfidence,
        specificityScorePct: afterPct,
        confidenceLevel:
          afterPct >= 75
            ? '高信心度 (High Specificity)'
            : afterPct >= 52
            ? '中度信心度 (Moderate Specificity)'
            : '低信心度 (Non-Specific / Early Stage)',
      },
      topSuspectedDiseases: updatedDiseases,
      targetedRuleOutHistory: [
        ...(params.primaryResult.targetedRuleOutHistory || []),
        roundSummary,
      ],
    };
  }

  // 離線規則模式確定性更新
  const deltaByDisease = new Map<string, number>();
  const evidenceByDisease = new Map<
    string,
    { pos: string[]; neg: string[] }
  >();

  let yesCount = 0;
  let noCount = 0;
  for (const ans of params.answers) {
    const bucket = evidenceByDisease.get(ans.targetDiseaseId) || {
      pos: [],
      neg: [],
    };
    if (ans.selectedOptionId === 'yes') {
      yesCount++;
      deltaByDisease.set(
        ans.targetDiseaseId,
        (deltaByDisease.get(ans.targetDiseaseId) || 0) + 12
      );
      bucket.pos.push(`[第${params.roundNumber}輪確認] 符合：${ans.questionTextZh}`);
    } else if (ans.selectedOptionId === 'no') {
      noCount++;
      deltaByDisease.set(
        ans.targetDiseaseId,
        (deltaByDisease.get(ans.targetDiseaseId) || 0) - 15
      );
      bucket.neg.push(`[第${params.roundNumber}輪排除] 不符合：${ans.questionTextZh}`);
    }
    evidenceByDisease.set(ans.targetDiseaseId, bucket);
  }

  const updatedDiseases = top3
    .map((dx) => {
      const d = deltaByDisease.get(dx.diseaseId) || 0;
      const ev = evidenceByDisease.get(dx.diseaseId);
      const nextScore = Math.max(15, Math.min(96, dx.clinicalMatchScorePct + d));
      const trend: 'reinforced' | 'ruled_down' | 'unchanged' =
        d > 0 ? 'reinforced' : d < 0 ? 'ruled_down' : 'unchanged';
      return {
        ...dx,
        clinicalMatchScorePct: nextScore,
        probabilityLevel:
          nextScore >= 68
            ? ('高度懷疑 (High Likelihood)' as const)
            : ('中度懷疑 (Moderate Likelihood)' as const),
        ruleOutTrend: trend,
        clinicalReasoning: {
          supportingEvidenceZh: ev?.pos.length
            ? [...dx.clinicalReasoning.supportingEvidenceZh, ...ev.pos]
            : dx.clinicalReasoning.supportingEvidenceZh,
          unsupportingOrLackingEvidenceZh: ev?.neg.length
            ? [...dx.clinicalReasoning.unsupportingOrLackingEvidenceZh, ...ev.neg]
            : dx.clinicalReasoning.unsupportingOrLackingEvidenceZh,
        },
      };
    })
    .sort((a, b) => b.clinicalMatchScorePct - a.clinicalMatchScorePct);

  const confidenceBoost = Math.max(3, yesCount * 8 + noCount * 6);
  const afterPct = Math.min(94, beforePct + confidenceBoost);
  const topWinner = updatedDiseases[0];

  const roundSummary: TargetedRuleOutRoundSummary = {
    roundNumber: params.roundNumber,
    targetMode: params.targetMode,
    targetDiseaseNameZh: params.targetDiseaseNameZh,
    confidenceBeforePct: beforePct,
    confidenceAfterPct: afterPct,
    confidenceDeltaPct: afterPct - beforePct,
    reasoningSummaryZh: `本輪共確認 ${yesCount} 項陽性證據、排除 ${noCount} 項陰性特徵，綜合判讀信心度由 ${beforePct}% 提升至 ${afterPct}%；目前以「${topWinner?.diseaseNameZh || ''}」臨床吻合度最高（${topWinner?.clinicalMatchScorePct || 0}%）。`,
    answeredItems: params.answers.map((a) => ({
      questionTextZh: a.questionTextZh,
      selectedLabelZh: a.selectedLabelZh,
    })),
    engineSource: 'rule_engine',
  };

  return {
    ...params.primaryResult,
    diagnosticConfidence: {
      ...params.primaryResult.diagnosticConfidence,
      specificityScorePct: afterPct,
      confidenceLevel:
        afterPct >= 75
          ? '高信心度 (High Specificity)'
          : afterPct >= 52
          ? '中度信心度 (Moderate Specificity)'
          : '低信心度 (Non-Specific / Early Stage)',
    },
    topSuspectedDiseases: updatedDiseases,
    targetedRuleOutHistory: [
      ...(params.primaryResult.targetedRuleOutHistory || []),
      roundSummary,
    ],
  };
}
