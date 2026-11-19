import type { Metadata } from 'next';
import './globals.css';
import { MedicalDisclaimerBar } from '@/components/layout/MedicalDisclaimerBar';

export const metadata: Metadata = {
  title: '3D 互動式智慧健康評估系統 | Smart Health Assessment System',
  description:
    '基於現代實證西醫、3D/2D 雙模式解剖定位、反焦慮分層解析與防幻覺 PubMed 檢索之日常健康參考與就醫前導引系統。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <MedicalDisclaimerBar />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
