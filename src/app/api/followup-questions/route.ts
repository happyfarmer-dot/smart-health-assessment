import { NextRequest, NextResponse } from 'next/server';
import { DiagnosisRequestPayload } from '@/types/cdss';
import { generateHypothesisDrivenQuestions } from '@/lib/dynamicFollowUpGenerator';

export async function POST(req: NextRequest) {
  const start = Date.now();
  const payload = (await req.json()) as Pick<
    DiagnosisRequestPayload,
    'contextProfile' | 'regionRecords' | 'systemicSymptomIds' | 'followUp'
  >;

  const result = generateHypothesisDrivenQuestions(payload);

  return NextResponse.json({
    generatedInMs: Date.now() - start,
    ...result,
  });
}
