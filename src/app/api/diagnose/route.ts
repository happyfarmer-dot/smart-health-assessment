import { NextRequest } from 'next/server';
import { DiagnosisRequestPayload, DiagnosisSSEEvent } from '@/types/cdss';
import { evaluateSilentSafetyCheck } from '@/lib/safetyAndIatrogenicEngine';
import { runDifferentialDiagnosisEngine } from '@/lib/differentialDiagnosisEngine';
import { fetchVerifiedPubMedResearch } from '@/lib/pubmedService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function formatSSEMessage(eventPacket: DiagnosisSSEEvent): string {
  return `event: ${eventPacket.event}\ndata: ${JSON.stringify(eventPacket.data)}\n\n`;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  let payload: DiagnosisRequestPayload;
  try {
    payload = (await req.json()) as DiagnosisRequestPayload;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid DiagnosisRequestPayload JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Event 1: 靜默危急值與紅旗攔截 (safety_check)
        const safetyResult = evaluateSilentSafetyCheck(payload);
        controller.enqueue(
          encoder.encode(
            formatSSEMessage({
              event: 'safety_check',
              data: safetyResult,
            })
          )
        );

        await sleep(220);

        // 執行臨床疾病鑑別診斷與藥源性排查引擎
        const { primaryResult, differentialResult } =
          runDifferentialDiagnosisEngine(payload);

        // Event 2: 診斷信心度 ＋ 核心疑似疾病鑑別 ＋ 藥源性警示 (primary_diagnosis)
        controller.enqueue(
          encoder.encode(
            formatSSEMessage({
              event: 'primary_diagnosis',
              data: primaryResult,
            })
          )
        );

        await sleep(260);

        // Event 3: 次要鑑別排查 ＋ 跨科轉移痛機轉 ＋ 就醫指引 (differential_and_analysis)
        controller.enqueue(
          encoder.encode(
            formatSSEMessage({
              event: 'differential_and_analysis',
              data: differentialResult,
            })
          )
        );

        // Event 4: 零幻覺 PubMed E-utilities 實證文獻檢索 (pubmed_research)
        const pubmedResult = await fetchVerifiedPubMedResearch(
          payload,
          primaryResult.topSuspectedDiseases
        );
        controller.enqueue(
          encoder.encode(
            formatSSEMessage({
              event: 'pubmed_research',
              data: pubmedResult,
            })
          )
        );

        controller.close();
      } catch (err) {
        console.error('SSE /api/diagnose stream error:', err);
        controller.error(err);
      }
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
