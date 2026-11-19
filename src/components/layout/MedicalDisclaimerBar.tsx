'use client';

import React from 'react';
import { ShieldAlert, PhoneCall, Info } from 'lucide-react';

export function MedicalDisclaimerBar() {
  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 px-4 py-2 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            <strong className="text-sky-300 font-semibold">實證西醫健康導引聲明：</strong>
            本系統僅供日常健康資訊參考與就醫前分科導引，
            <span className="underline decoration-amber-400/80 underline-offset-2 font-medium text-white">
              不構成正式醫療診斷，亦不推薦任何處方藥物或劑量
            </span>
            。
          </span>
        </div>
        <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-700/70 text-rose-200 px-2.5 py-0.5 rounded-full shrink-0">
          <PhoneCall className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>若出現胸痛喘、單側無力或意識改變，請立即撥打 119</span>
        </div>
      </div>
    </div>
  );
}
