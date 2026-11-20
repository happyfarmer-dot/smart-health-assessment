'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { MEDICAL_GLOSSARY_DICT } from '@/data/medicalGlossary';
import { GlossaryTermCategory, GlossaryTermItem } from '@/types/cdss';

const CATEGORY_BADGE_STYLE: Record<GlossaryTermCategory, string> = {
  抽血檢驗: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
  無痛影像檢查: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
  侵入性內視鏡: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
  '心電圖／生理檢查': 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40',
  '臨床徵象／術語': 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40',
};

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface GlossaryChipProps {
  matchedText: string;
  entry: GlossaryTermItem;
}

function GlossaryChip({ matchedText, entry }: GlossaryChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  return (
    <span
      ref={wrapperRef}
      className="relative inline-block"
      onMouseEnter={() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
          setIsOpen(true);
        }
      }}
      onMouseLeave={() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="inline border-b border-dashed border-cyan-400/85 text-cyan-200 hover:text-cyan-100 font-semibold cursor-pointer px-0.5 rounded-sm hover:bg-cyan-500/10 transition-colors"
        title={`點擊查看「${entry.term}」白話說明`}
      >
        {matchedText}
      </button>

      {isOpen && (
        <span
          role="dialog"
          onClick={(e) => e.stopPropagation()}
          className="no-print absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 sm:w-72 rounded-xl border border-cyan-500/60 bg-slate-950/95 p-3 text-left shadow-2xl backdrop-blur-md block"
        >
          <span className="flex items-start justify-between gap-2 mb-1.5">
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-extrabold text-white">
                {entry.term}
              </span>
              <span
                className={`rounded-md border px-1.5 py-0.2 text-[10px] font-bold ${
                  CATEGORY_BADGE_STYLE[entry.category] ||
                  CATEGORY_BADGE_STYLE['臨床徵象／術語']
                }`}
              >
                {entry.category}
              </span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-white p-0.5 rounded shrink-0 cursor-pointer"
              aria-label="關閉名詞解釋"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
          <span className="text-[11px] text-slate-200 leading-relaxed font-normal block">
            {entry.plain_explanation}
          </span>
        </span>
      )}
    </span>
  );
}

interface GlossaryTextProps {
  text: string;
  dynamicGlossary?: GlossaryTermItem[];
}

export function GlossaryText({ text, dynamicGlossary }: GlossaryTextProps) {
  const { regex, termLookup } = useMemo(() => {
    const mergedMap = new Map<string, GlossaryTermItem>();
    for (const item of MEDICAL_GLOSSARY_DICT) {
      mergedMap.set(item.term.toLowerCase(), item);
    }
    if (dynamicGlossary) {
      for (const dyn of dynamicGlossary) {
        if (dyn?.term && dyn?.plain_explanation) {
          mergedMap.set(dyn.term.toLowerCase(), dyn);
        }
      }
    }

    const lookup = new Map<string, GlossaryTermItem>();
    const tokens: string[] = [];

    for (const entry of Array.from(mergedMap.values())) {
      const variants = [entry.term, ...(entry.aliases || [])]
        .map((v) => v.trim())
        .filter((v) => v.length >= 2);
      for (const v of variants) {
        lookup.set(v.toLowerCase(), entry);
        tokens.push(v);
      }
    }

    // 長詞優先比對，避免短詞截斷長詞
    const uniqueSorted = Array.from(new Set(tokens)).sort(
      (a, b) => b.length - a.length
    );

    if (uniqueSorted.length === 0) {
      return { regex: null, termLookup: lookup };
    }

    const pattern = uniqueSorted
      .map((t) => {
        const esc = escapeRegExp(t);
        // 純英文簡寫加上單字邊界，避免誤中英文單字片段
        if (/^[A-Za-z0-9.\s'-]+$/.test(t)) {
          return `\\b${esc}\\b`;
        }
        return esc;
      })
      .join('|');

    return {
      regex: new RegExp(`(${pattern})`, 'gi'),
      termLookup: lookup,
    };
  }, [dynamicGlossary]);

  if (!text || !regex) return <>{text}</>;

  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, idx) => {
        const matchedEntry = termLookup.get(part.toLowerCase());
        if (matchedEntry && idx % 2 === 1) {
          return (
            <GlossaryChip
              key={`${part}-${idx}`}
              matchedText={part}
              entry={matchedEntry}
            />
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </>
  );
}

export function GlossaryLegendBadge() {
  return (
    <span className="no-print inline-flex items-center gap-1 text-[11px] text-cyan-300/90 bg-cyan-950/50 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
      <HelpCircle className="w-3 h-3 text-cyan-400 shrink-0" />
      <span>
        點擊報告中
        <span className="border-b border-dashed border-cyan-400 mx-1">
          青色虛線名詞
        </span>
        可看白話解釋
      </span>
    </span>
  );
}
