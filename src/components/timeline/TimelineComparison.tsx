'use client';

import React, { useRef, useState } from 'react';
import {
  TrendingUp,
  Printer,
  Download,
  Trash2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertTriangle,
  CalendarClock,
  FileText,
} from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';
import { DEPTH_LAYER_META, SYSTEMIC_SYMPTOMS } from '@/data/symptomCatalog';

export function TimelineComparison() {
  const {
    contextProfile,
    timelineNodes,
    removeTimelineNode,
    loadDemoProgressionTimeline,
  } = useHealthStore();

  const printSheetRef = useRef<HTMLDivElement>(null);
  const [isExportingImage, setIsExportingImage] = useState(false);

  // 匯出為高解析度 PNG 圖片（使用原生 Canvas 繪製結構化看診小抄與病程時間軸卡片，不依賴外部雲端字型，在 Android APK 與 Web 皆 100% 穩定）
  const handleExportHighResPng = async () => {
    setIsExportingImage(true);
    try {
      const canvas = document.createElement('canvas');
      const width = 1080;
      const height = Math.max(920, 420 + timelineNodes.length * 220);
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 背景與頂部深藍醫療橫幅
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, 130);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('SMART HEALTH ASSESSMENT SYSTEM | 就醫前結構化看診摘要單', 40, 48);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('個人生理情境 ＋ 跨日病程時間軸 ＋ 看診小抄', 40, 92);

      // 個人生理情境區塊
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.fillRect(40, 155, width - 80, 110);
      ctx.strokeRect(40, 155, width - 80, 110);

      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('【一、個人基礎生理情境卡 (Context Profile)】', 60, 190);

      const sexZh =
        contextProfile.biologicalSex === 'female'
          ? contextProfile.pregnancyStatus === 'possible_or_confirmed'
            ? '生理女性 (可能或已懷孕)'
            : '生理女性'
          : contextProfile.biologicalSex === 'male'
          ? '生理男性'
          : '其他';

      ctx.fillStyle = '#1e293b';
      ctx.font = '18px sans-serif';
      ctx.fillText(
        `年齡區間：${contextProfile.ageGroup || '未填'}   ｜   生理性別：${sexZh}   ｜   慢性病史：${
          contextProfile.chronicConditions.length
        } 項   ｜   高風險/固定用藥：${contextProfile.highRiskMedications.length} 項`,
        60,
        232
      );

      // 時間軸各節點與看診小抄
      let yOffset = 295;
      timelineNodes.forEach((node, idx) => {
        const isRed = node.reportSnapshot.triage.triageLevel === 'red_emergency';
        ctx.fillStyle = isRed ? '#fff1f2' : '#ffffff';
        ctx.strokeStyle = isRed ? '#f43f5e' : '#94a3b8';
        ctx.lineWidth = 2;
        ctx.fillRect(40, yOffset, width - 80, 195);
        ctx.strokeRect(40, yOffset, width - 80, 195);

        ctx.fillStyle = isRed ? '#be123c' : '#0f172a';
        ctx.font = 'bold 21px sans-serif';
        ctx.fillText(
          `${idx + 1}. ${node.dayLabelZh}  —  不適程度 VAS: ${
            node.requestSnapshot.followUp.severityScore
          }/10 分  ｜  建議科別：${
            node.reportSnapshot.triage.recommendedSpecialties[0]?.specialtyNameTw ||
            '門診評估'
          }`,
          60,
          yOffset + 38
        );

        if (node.userNote) {
          ctx.fillStyle = '#475569';
          ctx.font = 'italic 17px sans-serif';
          ctx.fillText(`病人自述備註：「${node.userNote}」`, 60, yOffset + 70);
        }

        // 100字看診小抄自動換行繪製
        const cheatText =
          node.reportSnapshot.clinical.doctorCheatSheet.summaryText100Words;
        ctx.fillStyle = '#0f172a';
        ctx.font = '18px sans-serif';
        const chunk1 = cheatText.slice(0, 50);
        const chunk2 = cheatText.slice(50, 100);
        const chunk3 = cheatText.slice(100);
        ctx.fillText(chunk1, 60, yOffset + 108);
        if (chunk2) ctx.fillText(chunk2, 60, yOffset + 136);
        if (chunk3) ctx.fillText(chunk3, 60, yOffset + 164);

        yOffset += 215;
      });

      // 底部醫療免責聲明
      ctx.fillStyle = '#64748b';
      ctx.font = '15px sans-serif';
      ctx.fillText(
        '※ 醫療免責聲明：本摘要單由 3D 互動式智慧健康評估系統自動彙整，僅供就醫時輔助醫病溝通參考，不構成正式醫療診斷。',
        40,
        height - 30
      );

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `看診小抄與病程時間軸_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsExportingImage(false);
    }
  };

  // 一鍵列印或另存標準 A4 PDF
  const handlePrintPdf = () => {
    window.print();
  };

  const latestNode =
    timelineNodes.length > 0 ? timelineNodes[timelineNodes.length - 1] : null;
  const previousNode =
    timelineNodes.length > 1 ? timelineNodes[timelineNodes.length - 2] : null;

  const painDelta =
    latestNode && previousNode
      ? latestNode.requestSnapshot.followUp.severityScore -
        previousNode.requestSnapshot.followUp.severityScore
      : null;

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-5 print:border-none print:shadow-none">
      {/* 頂部標題與匯出按鈕組 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                模組 G：病程時間軸追蹤與一鍵匯出（Symptom Timeline & Export）
              </h2>
              <span className="text-[11px] bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold">
                已記錄 {timelineNodes.length} 個時間節點
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              追蹤跨日症狀部位轉移與疼痛分數變化，並可一鍵匯出「個人情境＋時間軸變化＋最新看診小抄」為 PDF 或高解析度圖片供醫師檢閱
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap print:hidden">
          {timelineNodes.length === 0 && (
            <button
              type="button"
              onClick={loadDemoProgressionTimeline}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>載入「典型闌尾炎跨日轉移痛」範例時間軸</span>
            </button>
          )}

          {timelineNodes.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportHighResPng}
                disabled={isExportingImage}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {isExportingImage ? '正在繪製長圖...' : '一鍵匯出高解析看診長圖 (PNG)'}
                </span>
              </button>

              <button
                type="button"
                onClick={handlePrintPdf}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>匯出 / 列印 A4 看診單 (PDF)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {timelineNodes.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-700">
            目前時間軸尚無儲存節點
          </div>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            您可以在完成上方臨床評估後點擊「+ 存入時間軸」，或點擊右上角「載入典型闌尾炎跨日轉移痛範例」直接預覽跨日對比與匯出功能。
          </p>
        </div>
      ) : (
        <div ref={printSheetRef} className="space-y-5">
          {/* 跨日趨勢與疼痛分數對比儀表板 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {/* 左：VAS 疼痛趨勢視覺化條形圖 */}
            <div className="lg:col-span-7 space-y-2">
              <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>跨日疼痛／不適程度趨勢對比（1～10 分 VAS）</span>
              </div>
              <div className="space-y-2 pt-1">
                {timelineNodes.map((node, idx) => {
                  const score = node.requestSnapshot.followUp.severityScore;
                  const widthPct = Math.max(10, score * 10);
                  const barColor =
                    score >= 7
                      ? 'bg-rose-600'
                      : score >= 4
                      ? 'bg-amber-500'
                      : 'bg-emerald-600';

                  return (
                    <div key={node.nodeId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">
                          {idx + 1}. {node.dayLabelZh}
                        </span>
                        <span className="font-black text-slate-900">
                          {score} / 10 分
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 右：最新兩次節點差異自動比對摘要 */}
            <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
              <div className="text-xs font-extrabold text-slate-800">
                最新病程變化自動比對（Diff Analysis）
              </div>
              {painDelta !== null && previousNode && latestNode ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">疼痛分數變化：</span>
                    {painDelta > 0 ? (
                      <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded inline-flex items-center gap-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        上升 +{painDelta} 分（症狀加劇）
                      </span>
                    ) : painDelta < 0 ? (
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-flex items-center gap-0.5">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        下降 {painDelta} 分（逐步緩解）
                      </span>
                    ) : (
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded inline-flex items-center gap-0.5">
                        <Minus className="w-3.5 h-3.5" />
                        持平
                      </span>
                    )}
                  </div>

                  <div className="text-slate-600 leading-relaxed">
                    <strong>部位演變：</strong>由「
                    {previousNode.requestSnapshot.regionSymptoms
                      .map((r) => r.regionNameZh.split('（')[0])
                      .join('、') || '全身'}
                    」演變為「
                    <span className="font-bold text-slate-900">
                      {latestNode.requestSnapshot.regionSymptoms
                        .map((r) => r.regionNameZh.split('（')[0])
                        .join('、') || '全身'}
                    </span>
                    」
                  </div>

                  {latestNode.reportSnapshot.redFlag.isRedFlagTriggered && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>最新節點已觸發急症紅旗，建議立即攜帶此紀錄就醫！</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  目前僅有 1 筆節點；當您跨日存入第 2 筆評估後，系統將自動計算痛點轉移與疼痛分數增減。
                </p>
              )}
            </div>
          </div>

          {/* 時間軸節點詳細卡片列表 */}
          <div className="space-y-3">
            {timelineNodes.map((node, index) => {
              const isRed =
                node.reportSnapshot.triage.triageLevel === 'red_emergency';
              return (
                <div
                  key={node.nodeId}
                  className={`p-4 rounded-2xl border transition-all ${
                    isRed
                      ? 'bg-rose-50/40 border-rose-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        {node.dayLabelZh}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isRed
                            ? 'bg-rose-600 text-white'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        VAS 疼痛：{node.requestSnapshot.followUp.severityScore}/10 分
                      </span>
                      <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                        首選科別：
                        {node.reportSnapshot.triage.recommendedSpecialties[0]
                          ?.specialtyNameTw || '門診'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeTimelineNode(node.nodeId)}
                      className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 print:hidden"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      刪除節點
                    </button>
                  </div>

                  {node.userNote && (
                    <div className="mt-2.5 text-xs font-semibold text-indigo-900 bg-indigo-50/80 border border-indigo-200/70 px-3 py-1.5 rounded-lg">
                      📝 當日病程備註：「{node.userNote}」
                    </div>
                  )}

                  {/* 標記部位與深度標籤 */}
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    {node.requestSnapshot.regionSymptoms.map((r) => (
                      <span
                        key={r.regionId}
                        className="text-[11px] bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded font-medium"
                      >
                        {r.regionNameZh.split('（')[0]} (
                        {DEPTH_LAYER_META[r.depthLayer].shortLabelZh})
                      </span>
                    ))}
                    {node.requestSnapshot.systemicSymptoms.map((sysId) => {
                      const sysDef = SYSTEMIC_SYMPTOMS.find(
                        (s) => s.id === sysId
                      );
                      return (
                        <span
                          key={sysId}
                          className="text-[11px] bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-medium"
                        >
                          {sysDef?.labelZh || sysId}
                        </span>
                      );
                    })}
                  </div>

                  {/* 該節點之 100 字看診小抄 */}
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-900 text-sky-100 text-xs leading-relaxed font-medium">
                    {node.reportSnapshot.clinical.doctorCheatSheet.summaryText100Words}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
