import type { Metadata } from 'next';
import './globals.css';
import { MedicalDisclaimerBar } from '@/components/layout/MedicalDisclaimerBar';

export const metadata: Metadata = {
  title: '3D 互動式智慧醫療疾病判斷系統 | Clinical Differential Diagnosis System',
  description:
    '基於現代實證西醫、高辨識度 3D 人體熱區定位、客觀生命徵象、AI 動態鑑別追問、藥源性排查與防幻覺 PubMed 檢索之臨床決策支援與疾病鑑別系統。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className="dark">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950">
        <MedicalDisclaimerBar />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
