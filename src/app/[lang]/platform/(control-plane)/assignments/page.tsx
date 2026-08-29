import React from 'react';
import { KeyRound } from 'lucide-react';
import { OperationalAssignmentsPanel } from '@/components/platform/OperationalAssignmentsPanel';

export const dynamic = 'force-dynamic';

export default async function PlatformAssignmentsPage(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1E3A5A] pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-emerald-400" />
            <span>
              {isRo
                ? 'Alocări Clienți & Domenii de Acces'
                : isFa
                ? 'تخصیص مشتریان و محدوده‌های دسترسی'
                : 'Customer Assignments & Access Scopes'}
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            {isRo
              ? 'Conectarea explicită între utilizatorii interni și spațiile de lucru ale clienților conform principiului minimului privilegiu.'
              : isFa
              ? 'اتصال صریح کارشناسان به محیط‌های کاری مشتریان بر اساس اصل حداقل دسترسی مجاز.'
              : 'Explicit binding between internal operators and customer workspaces following least-privilege scoping.'}
          </p>
        </div>
      </div>

      <OperationalAssignmentsPanel lang={lang} />
    </div>
  );
}
