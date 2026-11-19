import { NextRequest } from 'next/server';
import {
  AssessmentRequestPayload,
  AssessmentSSEEvent,
} from '@/types/medical';
import { evaluateRedFlags } from '@/lib/redFlagEngine';
import { calculateTriageAndSpecialties } from '@/lib/specialtyRouter';
import { generateDeterministicClinicalAnalysis } from '@/lib/clinicalSynthesizer';
import { fetchVerifiedPubMedArticles } from '@/lib/pubmedService';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as AssessmentRequestPayload;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (evt: AssessmentSSEEvent) => {
        const line = `data: ${JSON.stringify(evt)}\n\n`;
        controller.enqueue(encoder.encode(line));
      };

      // 階段 1 (第 1 秒內)：確定性規則引擎的「急症安全檢查結果」
      const redFlagResult = evaluateRedFlags(payload);
      sendEvent({
        stage: 1,
        event: 'red_flag_check',
        data: redFlagResult,
      });

      await sleep(650);

      // 階段 2 (第 2~4 秒)：就醫急迫度燈號（紅/黃/綠）與台灣醫院建議掛號科別
      const triageResult = calculateTriageAndSpecialties(
        payload,
        redFlagResult
      );
      sendEvent({
        stage: 2,
        event: 'triage_and_specialty',
        data: triageResult,
      });

      await sleep(850);

      // 階段 3 (第 5~8 秒)：跨系統綜合分析（反焦慮分層）+ 100字看診小抄 + 居家照護與惡化警訊
      const clinicalResult = generateDeterministicClinicalAnalysis(
        payload,
        redFlagResult,
        triageResult
      );
      sendEvent({
        stage: 3,
        event: 'clinical_analysis',
        data: clinicalResult,
      });

      // 階段 4 (非同步)：防幻覺 PubMed E-utilities 真實文獻檢索
      const pubmedResult = await fetchVerifiedPubMedArticles(payload);
      sendEvent({
        stage: 4,
        event: 'pubmed_evidence',
        data: pubmedResult,
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
