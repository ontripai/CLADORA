'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { PRODUCT_METRICS } from '@/config/product-metrics';
import {
  CheckSquare,
  Clock,
  Target,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Sparkles,
  Zap,
  RotateCcw
} from 'lucide-react';

export default function UserTestingPage({
  params,
}: {
  params: { lang: Language };
}) {
  const lang = params.lang;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  const [activeTaskId, setActiveTaskId] = useState<string>('UT-04');
  const [taskCompleted, setTaskCompleted] = useState<boolean>(false);
  const [selectedException, setSelectedException] = useState<string | null>(null);

  const tasks = [
    {
      id: 'UT-01',
      role: isRo ? 'Administrator Asociație' : isFa ? 'مدیر ساختمان' : 'Association Admin',
      title: isRo ? 'Sarcina 1: Închidere de Lună & Transmitere Liste de Plată' : isFa ? 'وظیفه ۱: بستن دوره ماهانه و صدور لیست شارژ' : 'Task 1: Month-Close & Quota Statement Generation',
      targetSuccess: '90%',
      targetTime: '180s',
      errorTolerance: '0 Critical',
    },
    {
      id: 'UT-02',
      role: isRo ? 'Proprietar Rezident' : isFa ? 'مالک مقیم' : 'Resident Owner',
      title: isRo ? 'Sarcina 2: Citire Foto OCR Contor Apă & Plată Cotă' : isFa ? 'وظیفه ۲: ثبت عکس کنتور آب و پرداخت شارژ' : 'Task 2: Photo OCR Meter Submission & Quota Payment',
      targetSuccess: '95%',
      targetTime: '120s',
      errorTolerance: '0 Critical',
    },
    {
      id: 'UT-03',
      role: isRo ? 'Chiriaș' : isFa ? 'مستأجر' : 'Tenant',
      title: isRo ? 'Sarcina 3: Verificare Defalcare Cheltuieli & Notificare Mentenanță' : isFa ? 'وظیفه ۳: بررسی تفکیک هزینه‌ها و ثبت تیکت فنی' : 'Task 3: Cost Separation Inspection & Maintenance Ticket',
      targetSuccess: '92%',
      targetTime: '90s',
      errorTolerance: '0 Critical',
    },
    {
      id: 'UT-04',
      role: isRo ? 'Manager de Proprietate (M25)' : isFa ? 'مدیر املاک و انشعابات (M25)' : 'Property Manager (M25)',
      title: isRo ? 'Sarcina 4: Verificare Factură Utilități, Detecție Nepotriviri & Aprobare (M25)' : isFa ? 'وظیفه ۴: بررسی قبض انرژی، شناسایی مغایرت کنتور و تأیید نهایی (M25)' : 'Task 4: Utility Bill Inspection, Discrepancy Detection & Posting (M25)',
      targetSuccess: '≥ 85%',
      targetTime: '≤ 240s',
      errorTolerance: '0 Critical',
      isNew: true,
    },
  ];

  return (
    <div className="pt-28 pb-24 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-violet-500/20 text-xs font-semibold text-violet-300">
          <CheckSquare className="w-3.5 h-3.5" />
          <span>UX Research & Validation Tasks</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          {isRo ? 'Sarcini de Testare cu Utilizatorii' : isFa ? 'سناریوهای آزمون و اعتبارسنجی کاربر' : 'User Testing & UX Validation'}
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          {isRo
            ? 'Scenarii cantitative și calitative de validare a ergonomiei pentru cele 4 roluri cheie (Total: 4 Sarcini).'
            : isFa
            ? 'سناریوهای استاندارد سنجش سهولت کاربری برای نقش‌های اصلی سامانه (مجموع: ۴ وظیفه).'
            : 'Quantitative UX benchmarks and task protocols across key platform roles (Total: 4 Tasks).'}
        </p>
      </div>

      {/* Metrics Banner */}
      <div className="p-4 rounded-xl glass-panel border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
        <div>Total User Testing Tasks: <strong className="text-pink-300">{PRODUCT_METRICS.userTestingTasks}</strong></div>
        <div>Prototype Journeys: <strong className="text-violet-300">{PRODUCT_METRICS.prototypeJourneys}</strong></div>
        <div>Manager Workspaces: <strong className="text-emerald-300">{PRODUCT_METRICS.managerWorkspaces}</strong></div>
      </div>

      {/* Task Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tasks.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setActiveTaskId(t.id);
              setTaskCompleted(false);
              setSelectedException(null);
            }}
            className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeTaskId === t.id
                ? 'bg-violet-950/30 border-violet-500/50 shadow-lg shadow-violet-950/30'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {t.id}
                </span>
                {t.isNew && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    NEW M25
                  </span>
                )}
              </div>
              <span className="text-xs text-violet-400 font-semibold">{t.role}</span>
              <h3 className="text-xs font-bold text-white leading-snug">{t.title}</h3>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Success: <strong className="text-emerald-400">{t.targetSuccess}</strong></span>
              <span>Time: <strong className="text-cyan-400">{t.targetTime}</strong></span>
            </div>
          </button>
        ))}
      </div>

      {/* Detailed Protocol & Simulator for M25 Manager Task (Task 4) */}
      {activeTaskId === 'UT-04' && (
        <div className="p-8 rounded-3xl glass-panel border border-violet-500/40 bg-gradient-to-b from-violet-950/20 to-slate-950 space-y-8 animate-fadeIn">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-md bg-violet-500/20 text-violet-300 font-mono text-xs font-semibold border border-violet-500/30">
                  Manager Task Protocol • UT-04
                </span>
                <span className="text-xs text-slate-400">Target Role: Property Manager</span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-2">
                {isRo
                  ? 'Protocol de Testare M25: Verificare Factură Utilități & Decizie Contabilă'
                  : isFa
                  ? 'دستورالعمل آزمون M25: بررسی قبض انرژی و تصمیم‌گیری حسابداری'
                  : 'M25 Task Protocol: Utility Bill Inspection & Financial Decision'}
              </h2>
            </div>

            <Link
              href={`/${lang}/ui/manager/utility-bills`}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-lg shadow-violet-600/20 transition-all self-start md:self-auto"
            >
              <span>{isRo ? 'Deschide Spațiul Live M25' : isFa ? 'مشاهده رابط کاربری زنده' : 'Open Live Workspace'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Prompt / Instruction to Participant (Section 15) */}
          <div className="p-5 rounded-2xl bg-violet-950/40 border border-violet-500/30 space-y-2">
            <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">
              {isRo ? 'Instrucțiune către participant:' : isFa ? 'سناریوی ارائه‌شده به کاربر آزمون:' : 'Participant Task Prompt:'}
            </span>
            <blockquote className="text-sm font-medium text-white italic border-l-2 border-violet-400 pl-4 py-1">
              {isRo
                ? '„Examinați factura de energie electrică importată, identificați discrepanța de contor sau tarif, validați datele corecte și aprobați înregistrarea documentului în contabilitate.”'
                : isFa
                ? '«صورت‌حساب برق واردشده را بررسی کرده، مغایرت مربوط به کنتور یا تعرفه را شناسایی نمایید، ارقام صحیح را تأیید نموده و سند را برای ثبت حسابداری نهایی آماده کنید.»'
                : '"Review the imported electricity bill, detect the meter or tariff discrepancy, confirm the correct data, and prepare the bill for accounting posting."'}
            </blockquote>
          </div>

          {/* Acceptance Criteria Benchmarks (Section 15) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-center">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">{isRo ? 'Rată Succes Țintă' : isFa ? 'نرخ موفقیت' : 'Target Success'}</span>
              <div className="text-xl font-bold text-emerald-400 font-mono">≥ 85%</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">{isRo ? 'Timp Maxim Finalizare' : isFa ? 'حداکثر زمان' : 'Max Time'}</span>
              <div className="text-xl font-bold text-cyan-400 font-mono">≤ 240 secunde</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">{isRo ? 'Erori Financiare Critice' : isFa ? 'خطای بحرانی مالی' : 'Critical Errors'}</span>
              <div className="text-xl font-bold text-emerald-400 font-mono">0 Erori</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">{isRo ? 'Detecție Excepții' : isFa ? 'تشخیص مغایرت' : 'Exception Detection'}</span>
              <div className="text-xl font-bold text-violet-400 font-mono">100% Valid</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">{isRo ? 'Înțelegere Graniță AI/Om' : isFa ? 'درک مرز هوش/انسان' : 'AI/Human Clarity'}</span>
              <div className="text-xl font-bold text-pink-400 font-mono">Claritate Totală</div>
            </div>
          </div>

          {/* Interactive Simulation Sandbox for Task 4 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>{isRo ? 'Mini-Simulator Validare UX pentru Sarcina 4' : isFa ? 'شبیه‌ساز تعاملی آزمون کاربر' : 'Task 4 Interactive UX Simulator'}</span>
            </h3>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3">
              <div className="text-slate-300 font-semibold">
                {isRo ? 'Pasul 1: Selectați excepția detectată pe factura de gaz Engie (UB-2026-003):' : isFa ? 'مرحله ۱: مغایرت موجود در صورت‌حساب گاز را انتخاب کنید:' : 'Step 1: Identify the discrepancy flagged on Engie Gas Bill (UB-2026-003):'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedException('LOW_CONFIDENCE')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedException === 'LOW_CONFIDENCE'
                      ? 'bg-violet-600/30 border-violet-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold">1. Încredere Scăzută (55%)</div>
                  <div className="text-[11px] text-slate-400 mt-1">Scanare neclară la tabelul de index</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedException('METER_MISMATCH')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedException === 'METER_MISMATCH'
                      ? 'bg-violet-600/30 border-violet-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold">2. Nepotrivire Serie Contor</div>
                  <div className="text-[11px] text-slate-400 mt-1">Extras RO-GAZ-CT-8831 vs 8831-B</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedException('OTHER')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedException === 'OTHER'
                      ? 'bg-violet-600/30 border-violet-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold">3. Factură Fără Erori</div>
                  <div className="text-[11px] text-slate-400 mt-1">Nu există nicio problemă</div>
                </button>
              </div>
            </div>

            {selectedException && (
              <div className="space-y-4 animate-fadeIn">
                <div className={`p-4 rounded-xl border text-xs ${
                  selectedException === 'OTHER'
                    ? 'bg-red-950/30 border-red-500/40 text-red-300'
                    : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                }`}>
                  {selectedException === 'OTHER' ? (
                    <div>✗ Incorect. Factura conține atât scanare neclară (55%), cât și nepotrivire de serie contor.</div>
                  ) : (
                    <div>✓ Corect! Ați identificat cu succes anomalia. Următorul pas: Operatorul uman corectează sufixul contorului și confirmă manual datele.</div>
                  )}
                </div>

                {selectedException !== 'OTHER' && !taskCompleted && (
                  <button
                    type="button"
                    onClick={() => setTaskCompleted(true)}
                    className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 inline-flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{isRo ? 'Finalizează Sarcina cu Confirmare Umană' : isFa ? 'تکمیل سناریو با تأیید انسانی' : 'Complete Task with Human Sign-Off'}</span>
                  </button>
                )}

                {taskCompleted && (
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{isRo ? 'Sarcină finalizată cu succes! Timp înregistrat: 118 secunde. Erori financiare: 0.' : isFa ? 'آزمون با موفقیت انجام شد! زمان: ۱۱۸ ثانیه. خطای مالی: ۰.' : 'Task completed successfully! Recorded time: 118s. Financial errors: 0.'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTaskCompleted(false);
                        setSelectedException(null);
                      }}
                      className="p-1 text-emerald-400 hover:text-emerald-200"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
