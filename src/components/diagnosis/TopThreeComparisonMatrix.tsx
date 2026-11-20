'use client';

import React from 'react';
import { Columns3 } from 'lucide-react';
import { GlossaryTermItem, SuspectedDiseaseDiagnosis } from '@/types/cdss';
import { GlossaryText } from './GlossaryText';

interface TopThreeComparisonMatrixProps {
  diseases: SuspectedDiseaseDiagnosis[];
  dynamicGlossary?: GlossaryTermItem[];
}

function compactCell(raw: string, maxChars = 15): string {
  if (!raw) return '尚待醫師評估';
  // 移除前綴說明字眼與括號註記，只留最關鍵精簡片段
  const cleaned = raw
    .replace(
      /^(解剖部位吻合：|不適感受性質吻合：|特異性臨床表現：|動態鑑別追問高度支持：|動態追問陰性排除（.*?）：|65 歲以上.*?：|典型轉移痛順序支持：|用藥反應.*?：|物理處置反應：)/,
      ''
    )
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[「」]/g, '')
    .split(/[，。；—]/)[0]
    .trim();

  if (cleaned.length <= maxChars) return cleaned || raw.slice(0, maxChars);
  return cleaned.slice(0, maxChars) + '…';
}

export function TopThreeComparisonMatrix({
  diseases,
  dynamicGlossary,
}: TopThreeComparisonMatrixProps) {
  const top3 = diseases.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div className="rounded-2xl border border-cyan-500/35 bg-slate-950/80 p-4 space-y-3 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Columns3 className="w-4 h-4 text-cyan-400 shrink-0" />
          <h3 className="text-sm font-extrabold text-white">
            Top {top3.length} 疾病橫向鑑別對照表
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          3 秒快速掌握前三順位關鍵差異（手機可左右滑動）
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <table className="w-full min-w-[540px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90">
              <th className="w-28 py-2.5 px-3 text-left text-[11px] font-bold text-slate-400">
                鑑別比較維度
              </th>
              {top3.map((dx, idx) => (
                <th
                  key={dx.diseaseId}
                  className="py-2.5 px-3 text-left font-extrabold text-slate-100"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black shrink-0 ${
                        idx === 0
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="truncate">
                      {dx.diseaseNameZh.split('（')[0].split('／')[0]}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/80">
            {/* ① 可能性分級 */}
            <tr className="bg-slate-950/50">
              <td className="py-2.5 px-3 font-bold text-slate-300 whitespace-nowrap">
                ① 可能性分級
              </td>
              {top3.map((dx) => (
                <td key={dx.diseaseId} className="py-2.5 px-3">
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap ${
                      dx.probabilityLevel.startsWith('高度')
                        ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                        : 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                    }`}
                  >
                    {dx.probabilityLevel.split(' ')[0]} · {dx.clinicalMatchScorePct}%
                  </span>
                </td>
              ))}
            </tr>

            {/* ② 最關鍵支持特徵 */}
            <tr>
              <td className="py-2.5 px-3 font-bold text-emerald-300 whitespace-nowrap">
                ② 最關鍵支持特徵
              </td>
              {top3.map((dx) => (
                <td
                  key={dx.diseaseId}
                  className="py-2.5 px-3 text-slate-200 font-medium"
                >
                  <GlossaryText
                    text={compactCell(
                      dx.clinicalReasoning.supportingEvidenceZh[0] || ''
                    )}
                    dynamicGlossary={dynamicGlossary}
                  />
                </td>
              ))}
            </tr>

            {/* ③ 目前缺乏的關鍵特徵 */}
            <tr className="bg-slate-950/50">
              <td className="py-2.5 px-3 font-bold text-amber-300 whitespace-nowrap">
                ③ 目前缺乏特徵
              </td>
              {top3.map((dx) => (
                <td
                  key={dx.diseaseId}
                  className="py-2.5 px-3 text-slate-300"
                >
                  <GlossaryText
                    text={compactCell(
                      dx.clinicalReasoning.unsupportingOrLackingEvidenceZh[0] || ''
                    )}
                    dynamicGlossary={dynamicGlossary}
                  />
                </td>
              ))}
            </tr>

            {/* ④ 首選確診檢查 */}
            <tr>
              <td className="py-2.5 px-3 font-bold text-cyan-300 whitespace-nowrap">
                ④ 首選確診檢查
              </td>
              {top3.map((dx) => (
                <td
                  key={dx.diseaseId}
                  className="py-2.5 px-3 text-cyan-200 font-semibold"
                >
                  <GlossaryText
                    text={compactCell(
                      dx.confirmatoryDiagnosticTests[0]?.testNameZh || ''
                    )}
                    dynamicGlossary={dynamicGlossary}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
