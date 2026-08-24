'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { PRODUCT_METRICS } from '@/config/product-metrics';
import {
  Sparkles,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Scale,
  ShieldCheck,
  Cpu,
  UserCheck,
  FileCheck,
  CreditCard,
  History,
  AlertTriangle,
  Play,
  RotateCcw,
  AlertOctagon,
  Wrench,
  Check,
  Loader2
} from 'lucide-react';

export default function PrototypePage({
  params,
}: {
  params: { lang: Language };
}) {
  const lang = params.lang;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  // Active journey state
  const [selectedJourneyIndex, setSelectedJourneyIndex] = useState<number>(3); // Default to Journey 4 (M25)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSimulatedError, setIsSimulatedError] = useState<boolean>(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState<boolean>(false);
  const [isConfirmedByUser, setIsConfirmedByUser] = useState<boolean>(false);

  const journeys = [
    {
      id: 'J1',
      title: isRo ? 'Parcursul 1: Mentenanță Locatar → Dispecerat → Factură' : isFa ? 'مسیر ۱: درخواست تعمیرات ساکن → ارجاع فنی → ثبت هزینه' : 'Journey 1: Tenant Ticket → Work Order → Allocation',
      desc: isRo ? 'De la sesizarea avariei în aplicație până la înregistrarea costului pe proprietar.' : isFa ? 'از ثبت درخواست اولیه تا تسویه حساب با پیمانکار.' : 'From initial resident report to contractor payment allocation.',
      stepsCount: 5,
    },
    {
      id: 'J2',
      title: isRo ? 'Parcursul 2: Închidere de Lună în Masă → Balanță → Liste' : isFa ? 'مسیر ۲: بستن دوره ماهانه → تراز آزمایشی → لیست شارژ' : 'Journey 2: Batch Month-Close → Trial Balance → Quota Sheet',
      desc: isRo ? 'Calculul automat al cotelor de întreținere conform Legii 196/2018.' : isFa ? 'محاسبه سهم هر واحد بر اساس استانداردهای قانونی.' : 'Automated monthly maintenance quota computation.',
      stepsCount: 6,
    },
    {
      id: 'J3',
      title: isRo ? 'Parcursul 3: Citire Foto OCR Contor → Detecție Anomalii' : isFa ? 'مسیر ۳: قرائت تصویری کنتور → بررسی مصرف غیرعادی' : 'Journey 3: Photo OCR Metering → Anomaly Detection',
      desc: isRo ? 'Transmitere index prin poză, recunoaștere automată și avertizare pierderi.' : isFa ? 'استخراج رقم از عکس کنتور و هشدار هدررفت شبکه.' : 'Multi-method reading with automatic leakage anomaly flag.',
      stepsCount: 4,
    },
    {
      id: 'J4',
      title: isRo ? 'Parcursul 4: Ingestie Factură Utilități → OCR → Aprobare Umană → Înregistrare (M25)' : isFa ? 'مسیر ۴: دریافت قبض انرژی → استخراج هوشمند → تأیید انسانی → ثبت دفتر (M25)' : 'Journey 4: Utility Inbox → OCR → Human Approval → Ledger Post (M25)',
      desc: isRo ? 'Fluxul complet de procesare inteligentă a facturilor de utilități cu limită strictă de validare umană.' : isFa ? 'گردش‌کار کامل پردازش هوشمند قبوض انرژی با مرز مشخص تأیید نهایی انسانی.' : 'Complete utility invoice intelligence journey with mandatory authorized human confirmation.',
      stepsCount: 9,
      isNew: true,
    },
  ];

  // Exact 9 Sequential Steps for Journey 4 (Section 14 & Item 3)
  const journey4Steps = [
    {
      num: '1',
      title: isRo ? '1. Inbox Utilități (Recepție Factură)' : isFa ? '۱. صندوق ورودی قبوض (دریافت سند)' : '1. Utility Inbox (Invoice Received)',
      badge: 'e-Factura SPV',
      actor: 'ANAF e-Factura Connector',
      role: 'Automated Gateway',
      desc: isRo ? 'Factura ENEL-RO-8849201 recepționată automat prin SPV XML UBL 2.1.' : isFa ? 'صورت‌حساب برق از سامانه مودیان دریافت شد.' : 'Invoice ENEL-RO-8849201 ingested via SPV XML.',
      evidence: 'XML Message ID: eFactura-RO-2026-98129',
      auditId: 'AUD-J4-01-REC',
    },
    {
      num: '2',
      title: isRo ? '2. Detalii Factură & Scanare Sursă' : isFa ? '۲. جزییات سند و پیش‌نمایش تصویر' : '2. Bill Detail & Source Scan',
      badge: 'Document Inspection',
      actor: 'AI Ingestion Engine',
      role: 'Document Parser',
      desc: isRo ? 'Afișare alăturată document original și metadate furnizor (Enel Energie Muntenia).' : isFa ? 'نمایش فایل اصلی در کنار اطلاعات تأمین‌کننده.' : 'Side-by-side display of original scan and supplier credentials.',
      evidence: 'factura_enel_octombrie_2026_8849201.pdf (Hash SHA-256 verified)',
      auditId: 'AUD-J4-02-DET',
    },
    {
      num: '3',
      title: isRo ? '3. Date Extrase & Scor Încredere' : isFa ? '۳. استخراج داده‌ها و ضریب اطمینان' : '3. Extracted Data & Confidence',
      badge: '98% Confidence',
      actor: 'Neural OCR Parser',
      role: 'Data Extraction',
      desc: isRo ? 'Extragere 14 câmpuri: Total 3.420,50 RON, TVA 546,13 RON, Scadență 17.11.2026.' : isFa ? 'استخراج ۱۴ فیلد مالی با ضریب اطمینان ۹۸٪.' : 'Extracted 14 fields: Total 3,420.50 RON, VAT 19%, Due 17-Nov-2026.',
      evidence: 'Field scores: Total=98%, TaxId=100%, Date=99%',
      auditId: 'AUD-J4-03-EXT',
    },
    {
      num: '4',
      title: isRo ? '4. Reconciliere Contor & Tarif' : isFa ? '۴. تطبیق شاخص کنتور و نرخ تعرفه' : '4. Meter & Tariff Match',
      badge: 'Meter Matched',
      actor: 'Automated Rules Engine',
      role: 'Reconciliation Service',
      desc: isRo ? 'Contor RO-EL-773901 validat. Consum calculat: 3.060 kWh. Tarif contract 0,939 RON.' : isFa ? 'کنتور تطبیق داده شد. مصرف ۳۰۶۰ کیلووات‌ساعت.' : 'Meter RO-EL-773901 matched. Consumption 3,060 kWh verified.',
      evidence: 'Tariff Contract #CT-2024-991 matched with 0% variance.',
      auditId: 'AUD-J4-04-MAT',
    },
    {
      num: '5',
      title: isRo ? '5. Verificare & Excepții Reguli' : isFa ? '۵. اعتبارسنجی و بررسی مغایرت‌ها' : '5. Exception Review & Validation',
      badge: 'Validated Clean',
      actor: 'Deterministic Policy Checker',
      role: 'Compliance Engine',
      desc: isRo ? '0 excepții blocate. Alocare statutară 100% Cota-Parte Chiriași (Legea 196/2018).' : isFa ? 'بدون خطا. تسهیم ۱۰۰٪ بر اساس مصرف جاری.' : 'Zero blocking exceptions. Statutory split computed: 100% Operational.',
      evidence: 'Law 196/2018 Statutory Allocation Matrix verified.',
      auditId: 'AUD-J4-05-VAL',
    },
    {
      num: '6',
      title: isRo ? '6. Aprobare Umană Autorizată' : isFa ? '۶. بررسی و تأیید نهایی انسانی' : '6. Authorized Human Approval',
      badge: 'Human Sign-Off Required',
      actor: 'Elena Popescu',
      role: 'Authorized Property Manager',
      desc: isRo ? 'Operatorul uman verifică datele și semnează digital decizia de plată.' : isFa ? 'کاربر انسانی داده‌ها را بررسی و تأیید نهایی را صادر کرد.' : 'Authorized human inspects parameters and authorizes expense.',
      evidence: 'Human Approval Token #HA-2026-98124 issued.',
      auditId: 'AUD-J4-06-APP',
      requiresConfirmation: true,
    },
    {
      num: '7',
      title: isRo ? '7. Înregistrare în Contabilitate' : isFa ? '۷. ثبت سند در دفتر کل دوبل' : '7. Posted to Double-Entry Ledger',
      badge: 'Ledger Posted',
      actor: 'General Ledger Service',
      role: 'Double-Entry Accounting',
      desc: isRo ? 'Generat articol contabil în Jurnal pe contul 605.01 Cheltuieli Energie Electrică.' : isFa ? 'سند حسابداری در سرفصل هزینه‌های انرژی ثبت شد.' : 'Journal entry generated on Account 605.01 (Electricity expense).',
      evidence: 'Journal ID: JRN-2026-10-0891 • Allocation ID: ALC-UB-2026-10',
      auditId: 'AUD-J4-07-POS',
      journalId: 'JRN-2026-10-0891',
      allocationId: 'ALC-UB-2026-10',
    },
    {
      num: '8',
      title: isRo ? '8. Reconciliere Bancară & Plată' : isFa ? '۸. تطبیق بانکی و آماده‌سازی پرداخت' : '8. Payment Ready & Bank Sync',
      badge: 'Payment Scheduled',
      actor: 'Open Banking Connector',
      role: 'Treasury Settlement',
      desc: isRo ? 'Pregătit fișier ordin de plată (OP) cu IBAN-ul verificat al furnizorului.' : isFa ? 'دستور پرداخت بانکی با شماره شبای تأییدشده آماده شد.' : 'Payment order drafted with verified supplier IBAN.',
      evidence: 'Scheduled for Settlement on 15-Nov-2026 via BCR Open Banking.',
      auditId: 'AUD-J4-08-PAI',
    },
    {
      num: '9',
      title: isRo ? '9. Jurnal de Audit & Dovadă Finală' : isFa ? '۹. بایگانی نهایی و زنجیره ممیزی' : '9. Final Audit Trail & Proof',
      badge: 'Audit Complete',
      actor: 'Compliance Vault',
      role: 'Immutable Storage',
      desc: isRo ? 'Toate etapele, actorii, deciziile umane și timestamp-urile sunt securizate.' : isFa ? 'تمامی رویدادها، نقش‌ها و تصمیمات در زنجیره ممیزی ثبت شدند.' : 'Complete immutable record sealed with full cryptographic audit trail.',
      evidence: 'Root Audit Hash: 0x9185dd4759671ed69dca39f17080c84593912134-M25',
      auditId: 'AUD-J4-09-FIN',
      journalId: 'JRN-2026-10-0891',
      allocationId: 'ALC-UB-2026-10',
    },
  ];

  const handleNextStep = () => {
    const step = journey4Steps[currentStepIndex];
    if (step.requiresConfirmation && !isConfirmedByUser) {
      setIsConfirmationModalOpen(true);
      return;
    }

    if (currentStepIndex < journey4Steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setIsProcessing(false);
      setIsSimulatedError(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setIsProcessing(false);
      setIsSimulatedError(false);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsProcessing(false);
    setIsSimulatedError(false);
    setIsConfirmedByUser(false);
  };

  const handleTriggerProcessing = () => {
    setIsProcessing(true);
    setIsSimulatedError(false);
  };

  const handleCompleteProcessing = () => {
    setIsProcessing(false);
    if (currentStepIndex < journey4Steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleTriggerError = () => {
    setIsSimulatedError(true);
    setIsProcessing(false);
  };

  const handleTriggerRecovery = () => {
    setIsSimulatedError(false);
    setIsProcessing(false);
  };

  const handleConfirmHumanAction = () => {
    setIsConfirmedByUser(true);
    setIsConfirmationModalOpen(false);
    setCurrentStepIndex(6); // advance to Posted step
  };

  const currentStep = journey4Steps[currentStepIndex];

  return (
    <div className="pt-28 pb-24 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-violet-500/20 text-xs font-semibold text-violet-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Prototype Journeys</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          {isRo ? 'Parcursuri Prototip Interactive' : isFa ? 'مسیرهای تعاملی پروتوتایپ' : 'Interactive Prototype Journeys'}
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          {isRo
            ? 'Simularea pas cu pas a fluxurilor cheie din sistemul CLADORA (Total: 4 Parcursuri).'
            : isFa
            ? 'شبیه‌سازی گام‌به‌گام گردش‌کارهای کلیدی پلتفرم کلادورا (مجموع: ۴ مسیر).'
            : 'Step-by-step interactive simulation of key platform journeys (Total: 4 Journeys).'}
        </p>
      </div>

      {/* Metrics Banner */}
      <div className="p-4 rounded-xl glass-panel border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
        <div>Total Prototype Journeys: <strong className="text-violet-300">{PRODUCT_METRICS.prototypeJourneys}</strong></div>
        <div>Total User Testing Tasks: <strong className="text-cyan-300">{PRODUCT_METRICS.userTestingTasks}</strong></div>
        <div>Manager Workspaces: <strong className="text-emerald-300">{PRODUCT_METRICS.managerWorkspaces}</strong></div>
      </div>

      {/* Journey Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {journeys.map((j, idx) => (
          <button
            key={j.id}
            type="button"
            onClick={() => {
              setSelectedJourneyIndex(idx);
              setCurrentStepIndex(0);
              setIsProcessing(false);
              setIsSimulatedError(false);
              setIsConfirmedByUser(false);
            }}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              selectedJourneyIndex === idx
                ? 'bg-violet-950/30 border-violet-500/50 shadow-lg shadow-violet-950/20'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {j.id}
                </span>
                {j.isNew && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    NEW M25
                  </span>
                )}
              </div>
              <h3 className="text-xs font-bold text-white leading-snug">{j.title}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">{j.desc}</p>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500 font-mono">
              {j.stepsCount} {isRo ? 'etape interactive' : isFa ? 'مرحله تعاملی' : 'interactive steps'}
            </div>
          </button>
        ))}
      </div>

      {/* Active Interactive Simulator for Journey 4 */}
      {selectedJourneyIndex === 3 && (
        <div className="p-8 rounded-3xl glass-panel border border-violet-500/40 bg-gradient-to-b from-violet-950/20 to-slate-950 space-y-8 animate-fadeIn text-left">

          {/* Header of Simulator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-md bg-violet-500/20 text-violet-300 font-mono text-xs font-semibold border border-violet-500/30">
                  Journey 4 / 4 • Step {currentStepIndex + 1} of {journey4Steps.length}
                </span>
                <span className="text-xs text-slate-400 font-mono">{currentStep.auditId}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">
                {currentStep.title}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Observable Processing State Toggle */}
              {!isProcessing && !isSimulatedError && currentStepIndex < journey4Steps.length - 1 && (
                <button
                  type="button"
                  onClick={handleTriggerProcessing}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-medium flex items-center gap-1.5 hover:bg-sky-500/30 transition-colors"
                  title="Enter Deterministic Processing State"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{isRo ? 'Stare Procesare' : isFa ? 'شبیه‌سازی پردازش' : 'Processing State'}</span>
                </button>
              )}

              {/* Deterministic Error Injection Button for prototype testing */}
              {!isSimulatedError && !isProcessing && currentStepIndex >= 2 && currentStepIndex <= 5 && (
                <button
                  type="button"
                  onClick={handleTriggerError}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 hover:bg-amber-500/30 transition-colors"
                  title="Inject Deterministic Prototype Anomaly"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>{isRo ? 'Simulează Excepție / Eroare' : isFa ? 'شبیه‌سازی خطا / مغایرت' : 'Simulate Error'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                title="Restart Simulation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Step Indicator Bar (9 Steps) */}
          <div className="grid grid-cols-9 gap-1 sm:gap-2">
            {journey4Steps.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentStepIndex(idx);
                  setIsProcessing(false);
                  setIsSimulatedError(false);
                }}
                className={`py-2 px-1 rounded-lg text-center font-mono text-[11px] font-bold transition-all border ${
                  idx === currentStepIndex
                    ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-600/30 scale-105'
                    : idx < currentStepIndex
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                }`}
              >
                {s.num}
              </button>
            ))}
          </div>

          {/* Deterministic Processing State Surface */}
          {isProcessing ? (
            <div className="p-6 rounded-2xl bg-sky-950/40 border border-sky-500/50 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-3 text-sky-300">
                <Loader2 className="w-6 h-6 text-sky-400 animate-spin shrink-0" />
                <div>
                  <h3 className="text-base font-bold">
                    {isRo ? 'Stare de Prelucrare Prototip: Extragere OCR & Reconciliere în Curs' : isFa ? 'وضعیت پردازش پروتوتایپ: استخراج متنی و تطبیق هوشمند' : 'Deterministic Prototype State: OCR Extraction & Reconciliation'}
                  </h3>
                  <p className="text-xs text-sky-200/80 mt-0.5">
                    {isRo ? 'Simulare fără operațiuni reale de backend, înregistrare sau plată.' : isFa ? 'شبیه‌سازی فرآیند بدون ارسال درخواست به سرور یا ایجاد تراکنش مالی واقعی.' : 'Deterministic simulation without backend calls, ledger posting, or payment operations.'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-sky-500/30 text-xs font-mono space-y-1 text-slate-300">
                <div>Process Token: <strong className="text-sky-400">PROC-DET-M25-9812</strong></div>
                <div>Status: <strong className="text-emerald-400">Deterministic Extraction Complete (98% Score)</strong></div>
                <div>Next Gateway: <strong>Authorized Human Verification</strong></div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProcessing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  {isRo ? 'Înapoi la Pas' : isFa ? 'بازگشت' : 'Back to Step'}
                </button>
                <button
                  type="button"
                  onClick={handleCompleteProcessing}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 flex items-center gap-2 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{isRo ? 'Finalizează Procesarea & Continuă' : isFa ? 'تکمیل پردازش و ادامه مسیر' : 'Complete Processing & Continue'}</span>
                </button>
              </div>
            </div>
          ) : isSimulatedError ? (
            /* Deterministic Error Path & Recovery Surface */
            <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-500/50 space-y-4 animate-shake">
              <div className="flex items-center gap-2.5 text-amber-300">
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <h3 className="text-base font-bold">
                    {isRo ? 'Eroare Simulat: Nepotrivire Index Contor & Scor Scăzut OCR' : isFa ? 'خطای شبیه‌سازی‌شده: مغایرت شاخص کنتور و اطمینان پایین' : 'Deterministic Error: Meter Index Discrepancy & Low OCR Score'}
                  </h3>
                  <p className="text-xs text-amber-200/80 mt-0.5">
                    {isRo ? 'Fluxul automat a fost oprit conform politicii de siguranță financiară.' : isFa ? 'گردش‌کار خودکار متوقف شده و نیاز به مداخله و اصلاح دستی دارد.' : 'Automated progression halted per financial safety policy.'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 text-xs font-mono space-y-1 text-slate-300">
                <div>Error Code: <strong className="text-amber-400">ERR_METER_MISMATCH_05</strong></div>
                <div>Affected Field: <strong>startMeterReading (Extracted: 120500 vs DB: 124200)</strong></div>
                <div>Suggested Action: <strong>Manual Human Verification against Original Scan</strong></div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTriggerRecovery}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 flex items-center gap-2 transition-all"
                >
                  <Wrench className="w-4 h-4" />
                  <span>{isRo ? 'Execută Acțiunea de Recuperare (Corectare Manuală)' : isFa ? 'اجرای اقدام اصلاحی (بازیابی و تصحیح دستی)' : 'Execute Recovery Action (Manual Correction)'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Standard Step Detail Card */
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {isRo ? 'Actor & Rol Responsabil:' : isFa ? 'کاربر و نقش مجری:' : 'Responsible Actor & Role:'}
                  </span>
                  <div className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-violet-400" />
                    <span>{currentStep.actor}</span>
                    <span className="text-xs font-normal text-slate-400 font-mono">({currentStep.role})</span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 self-start md:self-auto">
                  {currentStep.badge}
                </span>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed">
                {currentStep.desc}
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs space-y-1">
                <div className="text-slate-400">
                  <strong>{isRo ? 'Mărturie / Dovadă:' : isFa ? 'مستند اعتبارسنجی:' : 'Verification Evidence:'}</strong>
                </div>
                <div className="text-cyan-300">{currentStep.evidence}</div>
                {currentStep.journalId && (
                  <div className="pt-2 text-emerald-400 border-t border-slate-800/60 flex flex-wrap gap-4">
                    <span>Journal ID: <strong>{currentStep.journalId}</strong></span>
                    <span>Allocation ID: <strong>{currentStep.allocationId}</strong></span>
                    <span>Audit ID: <strong>{currentStep.auditId}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Controls: Back, Next, Confirmation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isRo ? 'Pasul Anterior' : isFa ? 'مرحله قبل' : 'Previous Step'}</span>
            </button>

            <div className="text-xs text-slate-400 font-mono">
              {currentStepIndex === journey4Steps.length - 1 ? (
                <span className="text-emerald-400 font-semibold">✓ {isRo ? 'Parcurs Finalizat cu Succes' : isFa ? 'مسیر با موفقیت تکمیل شد' : 'Journey Completed'}</span>
              ) : (
                <span>{journey4Steps.length - currentStepIndex - 1} {isRo ? 'pași rămași' : isFa ? 'مرحله باقی‌مانده' : 'steps remaining'}</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              disabled={currentStepIndex === journey4Steps.length - 1 || isSimulatedError}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-violet-600/30 inline-flex items-center gap-2 transition-all"
            >
              <span>{isRo ? 'Următorul Pas' : isFa ? 'مرحله بعد' : 'Next Step'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* Confirmation Modal for Step 6 (Human Sign-off Boundary) */}
      {isConfirmationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-violet-500/50 p-6 space-y-5 text-left animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-violet-500/20 text-violet-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isRo ? 'Aprobare Umană Obligatorie' : isFa ? 'تأیید نهایی کاربر انسانی' : 'Mandatory Human Approval'}
                </h3>
                <span className="text-xs text-slate-400">Step 6 Human Sign-Off Gate</span>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              {isRo
                ? 'Confirmați că ați verificat indexurile contorului, tariful contractului și defalcarea chiriaș/proprietar pentru factura Enel (3.420,50 RON)?'
                : isFa
                ? 'آیا صحت ارقام کنتور، تعرفه قرارداد و سهم مالک/مستأجر برای صورت‌حساب برق ۳۴۲۰٫۵۰ لئو را تأیید می‌نمایید؟'
                : 'Confirm verification of meter readings, contract tariff, and owner/tenant allocation split for Enel Invoice (3,420.50 RON)?'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmationModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                {isRo ? 'Anulează' : isFa ? 'انصراف' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmHumanAction}
                className="px-5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isRo ? 'Confirm & Aprobă Factura' : isFa ? 'تأیید و ثبت سند' : 'Confirm & Authorize'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Non-M25 Journeys Informational Box */}
      {selectedJourneyIndex !== 3 && (
        <div className="p-8 rounded-3xl glass-panel border border-slate-800 bg-slate-900/40 text-center space-y-4">
          <h3 className="text-xl font-bold text-white">{journeys[selectedJourneyIndex].title}</h3>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">{journeys[selectedJourneyIndex].desc}</p>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => setSelectedJourneyIndex(3)}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold inline-flex items-center gap-2"
            >
              <span>{isRo ? 'Comută la Parcursul 4 (M25 Utility Bills)' : isFa ? 'تغییر به مسیر ۴ (M25 قبوض)' : 'Switch to Journey 4 (M25 Utility Bills)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
