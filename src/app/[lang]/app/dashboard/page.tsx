'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileSpreadsheet, 
  Receipt, 
  Gauge, 
  Wrench, 
  TrendingUp, 
  Vote, 
  ShieldCheck, 
  ArrowRight,
  DollarSign,
  FileCheck2,
  Calendar,
  Users
} from 'lucide-react';
import { useDemoStore } from '@/data/demoStore';
import { Money } from '@/components/ui/Money';
import { formatNumber, formatPercent } from '@/config/currencies';
import { 
  formatUnitLabel, 
  formatAccountingPeriod, 
  getLocalizedWorkOrder, 
  formatPropertyUnitDetails, 
  formatTenantDisplay,
  formatAddress
} from '@/config/formatters';
import { formatStatusBadge } from '@/config/statuses';

export default function DashboardPage(props: { params: Promise<{ lang: Language }> }) {
  const params = use(props.params);
  const { lang } = params;
  const { 
    activeRole, 
    context, 
    monthCloseState, 
    workOrders, 
    meterReadings, 
    portfolioProperties,
    chargeBreakdown
  } = useDemoStore();

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            <span>{lang === 'fa' ? 'مجتمع مسکونی آویاتسی ۱۲B' : context.associationName}</span>
            <span>·</span>
            <span>
              {lang === 'ro' ? 'Perioadă Contabilă:' : lang === 'fa' ? 'دوره حسابداری:' : 'Accounting Period:'} {formatAccountingPeriod(context.accountingPeriod, lang)}
            </span>
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {activeRole === 'association_admin' && (
              lang === 'ro' ? 'Panou de Control Administrator' : lang === 'fa' ? 'مرکز مدیریت و عملیات مدیر ساختمان' : 'Administrator Control Center'
            )}
            {activeRole === 'president' && (
              lang === 'ro' ? 'Panou Președinte de Asociație' : lang === 'fa' ? 'داشبورد حکمرانی و تأییدات رئیس هیئت‌مدیره' : 'President Governance Board'
            )}
            {activeRole === 'censor' && (
              lang === 'ro' ? 'Panou Cenzor & Audit Financiar' : lang === 'fa' ? 'میز کار ممیزی و بازرس مالی' : 'Censor & Audit Workspace'
            )}
            {activeRole === 'owner' && (
              lang === 'ro' ? 'Panoul Meu de Proprietar (Ap. 14)' : lang === 'fa' ? 'پورتال مالک واحد مسکونی (واحد ۱۴)' : 'Owner Portal (Unit 14)'
            )}
            {activeRole === 'tenant_resident' && (
              lang === 'ro' ? 'Portal Chiriaș & Consum' : lang === 'fa' ? 'پورتال مستأجر و مصارف انشعابات' : 'Tenant Living & Consumption'
            )}
            {activeRole === 'portfolio_owner' && (
              lang === 'ro' ? 'Consolă Portofoliu Imobiliar (4 Proprietăți)' : lang === 'fa' ? 'کنسول مدیریت سبد املاک (۴ ملک فعال)' : 'Portfolio Console (4 Properties)'
            )}
            {activeRole === 'property_manager' && (
              lang === 'ro' ? 'Dispecerat Manager Pro (8 Asociații)' : lang === 'fa' ? 'مرکز دیسپچینگ مدیریت مجتمع‌ها (۸ مجتمع)' : 'Manager Pro Dispatch (8 Associations)'
            )}
            {activeRole === 'platform_admin' && (
              lang === 'ro' ? 'Consolă Administrator Sistem CLADORA' : lang === 'fa' ? 'کنسول مدیریت ارشد سیستم کلادورا' : 'Platform System Administration'
            )}
          </h1>
        </div>

        {/* Quick Action */}
        {activeRole === 'association_admin' && (
          <Link
            href={`/${lang}/app/accounting/month-close`}
            className="px-5 py-2.5 rounded-xl bg-[#0E9F8E] hover:bg-[#0C8778] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{lang === 'ro' ? 'Continuă Închiderea Lunară' : lang === 'fa' ? 'ادامه بستن دوره ماهانه' : 'Resume Month-Close'}</span>
          </Link>
        )}
        {activeRole === 'owner' && (
          <Link
            href={`/${lang}/app/meters`}
            className="px-5 py-2.5 rounded-xl bg-[#0E9F8E] hover:bg-[#0C8778] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Gauge className="w-4 h-4" />
            <span>{lang === 'ro' ? 'Transmite Index Contoare' : lang === 'fa' ? 'ثبت رقم کنتور با عکس' : 'Submit Meter Index'}</span>
          </Link>
        )}
      </div>

      {/* DASHBOARD 1: ASSOCIATION ADMINISTRATOR */}
      {activeRole === 'association_admin' && (
        <div className="space-y-6">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wide">
                {lang === 'ro' ? 'Status Închidere Lună' : lang === 'fa' ? 'وضعیت بستن دوره ماهانه' : 'Month-End Status'}
              </div>
              <div className="text-xl font-display font-extrabold text-[#D97706] mt-1">
                {monthCloseState.status === 'SEALED' 
                  ? (lang === 'ro' ? 'Sigilat (Închis)' : lang === 'fa' ? 'قطعی و قفل‌شده' : 'Sealed') 
                  : (lang === 'ro' ? 'În Validare (3/5 Pași)' : lang === 'fa' ? 'در حال اعتبارسنجی (۳ از ۵)' : 'In Validation (3/5)')}
              </div>
              <div className="text-[11px] text-[#52667A]">
                {lang === 'ro' ? 'Termen afișare: 28 Octombrie' : lang === 'fa' ? 'مهلت صدور فیش: ۲۸ اکتبر' : 'Target date: Oct 28'}
              </div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wide">
                {lang === 'ro' ? 'Sold Cont Curent BCR' : lang === 'fa' ? 'مانده حساب جاری بانک BCR' : 'BCR Bank Balance'}
              </div>
              <div className="text-xl font-display font-extrabold text-[#102A43] mt-1">
                <Money amount={34820.40} currency="RON" locale={lang} />
              </div>
              <div className="text-[11px] text-[#059669]">
                {lang === 'ro' ? '✓ Reconciliat cu extras bancar' : lang === 'fa' ? '✓ تطبیق ۱۰۰٪ با صورت‌حساب بانکی' : '✓ Reconciled with statement'}
              </div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wide">
                {lang === 'ro' ? 'Index Contoare Transmise' : lang === 'fa' ? 'کنتورهای ثبت‌شده' : 'Meters Submitted'}
              </div>
              <div className="text-xl font-display font-extrabold text-[#0E9F8E] mt-1">
                116 / 120 (97%)
              </div>
              <div className="text-[11px] text-[#D97706]">
                {lang === 'ro' ? '4 apartamente necesită estimare' : lang === 'fa' ? '۴ واحد نیازمند برآورد میانگین' : '4 units need estimation'}
              </div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wide">
                {lang === 'ro' ? 'Tichete Mentenanță Deschise' : lang === 'fa' ? 'تیکت‌های فعال تعمیرات' : 'Open Work Orders'}
              </div>
              <div className="text-xl font-display font-extrabold text-[#E5484D] mt-1">
                {formatNumber(workOrders.filter(w => w.status !== 'COMPLETED').length, lang)} {lang === 'ro' ? 'Active' : lang === 'fa' ? 'مورد فعال' : 'Active'}
              </div>
              <div className="text-[11px] text-[#52667A]">
                {lang === 'ro' ? '1 urgență coloană Scara B' : lang === 'fa' ? '۱ مورد فوری لوله‌کشی ورودی B' : '1 urgent riser issue'}
              </div>
            </div>
          </div>

          {/* Operational Modules Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Checklist & Invoices */}
            <div className="lg:col-span-7 card-proptech p-6 bg-white space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h3 className="text-sm font-bold text-[#102A43]">
                  {lang === 'ro' ? 'Pași Închidere Lunară Octombrie' : lang === 'fa' ? 'مراحل بستن دوره مالی ماه جاری' : 'Month-End Closing Progress'}
                </h3>
                <Link href={`/${lang}/app/accounting/month-close`} className="text-xs font-bold text-[#0E9F8E] hover:underline">
                  {lang === 'ro' ? 'Deschide asistentul de închidere →' : lang === 'fa' ? 'مشاهده دستیار بستن دوره ←' : 'Open closing stepper →'}
                </Link>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                    <span className="font-bold text-[#059669]">
                      {lang === 'ro' ? '1. Facturi Furnizori Înregistrate (Engie, Apa Nova, Enel)' : lang === 'fa' ? '۱. ثبت فاکتورهای تأمین‌کنندگان (آب، گاز، برق مشاعات)' : '1. Supplier Invoices Recorded'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#059669]">
                    {lang === 'ro' ? 'FINALIZAT' : lang === 'fa' ? 'تکمیل شد' : 'COMPLETED'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                    <span className="font-bold text-[#059669]">
                      {lang === 'ro' ? '2. Perioadă Citire Contoare Închisă (116 foto OCR)' : lang === 'fa' ? '۲. بستن بازه قرائت کنتورها (۱۱۶ قرائت تصویری)' : '2. Meter Submission Period Closed'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#059669]">
                    {lang === 'ro' ? 'FINALIZAT' : lang === 'fa' ? 'تکمیل شد' : 'COMPLETED'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#FFF7E6] border border-[#FDE68A] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#D97706]" />
                    <span className="font-bold text-[#92400E]">
                      {lang === 'ro' ? '3. Generare Cote & Verificare Discrepanțe CPI' : lang === 'fa' ? '۳. محاسبه سهم مشاع و کنترل مغایرت‌های قدرالسهم' : '3. Statutory Share Allocation & Variance Check'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#B45309]">
                    {lang === 'ro' ? 'ÎN CURS' : lang === 'fa' ? 'در دست اقدام' : 'IN PROGRESS'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0] flex items-center justify-between opacity-70">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-[#7B8A9A] flex items-center justify-center text-[9px]">4</span>
                    <span className="font-medium text-[#52667A]">
                      {lang === 'ro' ? '4. Avizare Cenzor & Tipărire Liste de Plată' : lang === 'fa' ? '۴. تأیید بازرس مالی و صدور رسمی صورت‌حساب‌ها' : '4. Censor Sign-off & Statement Publishing'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#7B8A9A]">
                    {lang === 'ro' ? 'AȘTEPTARE' : lang === 'fa' ? 'در انتظار' : 'PENDING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Urgent Maintenance Tickets */}
            <div className="lg:col-span-5 card-proptech p-6 bg-white space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h3 className="text-sm font-bold text-[#102A43]">
                  {lang === 'ro' ? 'Tichete Mentenanță & Urgențe' : lang === 'fa' ? 'تیکت‌های تعمیرات و دیسپچینگ' : 'Maintenance Dispatch'}
                </h3>
                <Link href={`/${lang}/app/maintenance`} className="text-xs font-bold text-[#0E9F8E] hover:underline">
                  {lang === 'ro' ? 'Toate tichetele' : lang === 'fa' ? 'مشاهده همه' : 'View all'}
                </Link>
              </div>

              <div className="space-y-3">
                {workOrders.map((wo) => {
                  const loc = getLocalizedWorkOrder(wo.id, lang);
                  const statusBadge = formatStatusBadge(wo.status, lang);
                  return (
                    <div key={wo.id} className="p-3 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0] space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#102A43] truncate max-w-[200px]">{loc.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusBadge.badgeClass}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#52667A]">
                        {loc.unitOrArea} · SLA: <span className="ltr-isolate">{wo.slaDeadline}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* DASHBOARD 2: OWNER (RESIDENT) */}
      {activeRole === 'owner' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">
                {lang === 'ro' ? 'Sumă Totală Datorată (Octombrie)' : lang === 'fa' ? 'مجموع بدهی فیش ماه جاری' : 'Total Balance Due'}
              </div>
              <div className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
                <Money amount={241.77} currency="RON" locale={lang} />
              </div>
              <div className="text-[11px] text-[#D97706]">
                {lang === 'ro' ? 'Scadență: 15 Noiembrie 2026' : lang === 'fa' ? 'مهلت پرداخت: ۱۵ نوامبر ۲۰۲۶' : 'Due date: Nov 15, 2026'}
              </div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">
                {lang === 'ro' ? 'Index Contor Apă Rece' : lang === 'fa' ? 'آخرین شاخص کنتور آب سرد' : 'Cold Water Meter Index'}
              </div>
              <div className="text-2xl font-display font-extrabold text-[#059669] mt-1">
                148.20 m³
              </div>
              <div className="text-[11px] text-[#059669]">
                {lang === 'ro' ? '✓ Transmis & Validat Foto OCR' : lang === 'fa' ? '✓ ارسال و تأیید شد با تصویر کنتور' : '✓ Photo OCR Validated'}
              </div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">
                {lang === 'ro' ? 'Voturi Active Adunare Generală' : lang === 'fa' ? 'رأی‌گیری فعال مجمع عمومی' : 'Active AGM Votes'}
              </div>
              <div className="text-2xl font-display font-extrabold text-[#2F80ED] mt-1">
                {lang === 'ro' ? '1 Vot Deschis' : lang === 'fa' ? '۱ رأی‌گیری باز' : '1 Open Vote'}
              </div>
              <div className="text-[11px] text-[#52667A]">
                {lang === 'ro' ? 'Reabilitare termică fațadă' : lang === 'fa' ? 'پروژه نوسازی حرارتی نمای ساختمان' : 'Facade insulation project'}
              </div>
            </div>
          </div>

          <div className="card-proptech p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-[#102A43]">
              {lang === 'ro' ? 'Descompunerea Notei Tale de Plată (Ap. 14)' : lang === 'fa' ? 'ریز اقلام و شفافیت فیش شارژ (واحد ۱۴)' : 'Breakdown of Your Monthly Statement'}
            </h3>
            <div className="space-y-2">
              {chargeBreakdown.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#102A43]">{item.expenseCategory}</div>
                    <div className="text-[#7B8A9A] font-mono text-[10px]">
                      <span className="ltr-isolate">{item.supplierInvoiceRef}</span> · {lang === 'ro' ? 'Metodă:' : lang === 'fa' ? 'روش:' : 'Method:'} {item.allocationMethod}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#102A43]">
                      <Money amount={item.calculatedAmount} currency="RON" locale={lang} />
                    </div>
                    <div className="text-[10px] text-[#0A6E62]">
                      {lang === 'ro' ? 'Responsabil:' : lang === 'fa' ? 'پرداخت‌کننده:' : 'Payer:'} {item.operationalPayer === 'TENANT' ? (lang === 'fa' ? 'مستأجر' : 'Chiriaș') : (lang === 'fa' ? 'مالک' : 'Proprietar')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD 3: TENANT */}
      {activeRole === 'tenant_resident' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card-proptech p-5 bg-white space-y-1 border-l-4 border-l-[#0E9F8E]">
              <div className="text-xs font-bold text-[#7B8A9A]">
                {lang === 'ro' ? 'Consum Operațional Lunar de Achitat' : lang === 'fa' ? 'سهم مصرفی ماهانه مستأجر' : 'Tenant Operational Balance Due'}
              </div>
              <div className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
                <Money amount={179.27} currency="RON" locale={lang} />
              </div>
              <div className="text-[11px] text-[#52667A]">
                {lang === 'ro' ? 'Apă, încălzire, salubrizare, lift' : lang === 'fa' ? 'آب، گاز گرمایش، پسماند و سرویس آسانسور' : 'Water, heating, waste & elevator'}
              </div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">
                {lang === 'ro' ? 'Confidențialitate Fonduri Proprietar' : lang === 'fa' ? 'حفظ حریم خصوصی صندوق‌های سرمایه‌ای مالک' : 'Owner Capital Ledger Privacy'}
              </div>
              <div className="text-sm font-bold text-[#059669] mt-2">
                {lang === 'ro' ? '✓ Fondul de reparații este alocat direct proprietarului' : lang === 'fa' ? '✓ صندوق تعمیرات و ذخیره مستقیماً در سهم مالک لحاظ می‌شود' : '✓ Reserve fund is billed directly to unit owner'}
              </div>
              <div className="text-[11px] text-[#7B8A9A]">
                {lang === 'ro' ? 'Conform contractului de închiriere' : lang === 'fa' ? 'منطبق با قانون و قرارداد اجاره' : 'Under statutory lease terms'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD 4: PORTFOLIO OWNER */}
      {activeRole === 'portfolio_owner' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">
                {lang === 'ro' ? 'Total Chirii Încasate Octombrie' : lang === 'fa' ? 'مجموع اجاره‌های وصول‌شده دوره' : 'Total Rent Collected'}
              </div>
              <div className="text-2xl font-display font-extrabold text-[#10B981] mt-1">
                <Money amount={3180} currency="EUR" locale={lang} minimumFractionDigits={0} maximumFractionDigits={0} />
              </div>
              <div className="text-[11px] text-[#059669]">
                {lang === 'ro' ? '✓ 4/4 Proprietăți încasate' : lang === 'fa' ? '✓ وصول ۱۰۰٪ (۴ از ۴ واحد)' : '✓ 4/4 properties collected'}
              </div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">
                {lang === 'ro' ? 'Randament Mediu Net' : lang === 'fa' ? 'میانگین بازده خالص سالانه' : 'Average Net Yield'}
              </div>
              <div className="text-2xl font-display font-extrabold text-[#2F80ED] mt-1">
                {formatPercent(6.8, lang, 1)} / {lang === 'ro' ? 'an' : lang === 'fa' ? 'سال' : 'year'}
              </div>
              <div className="text-[11px] text-[#52667A]">
                {lang === 'ro' ? 'Deducere fonduri & taxe inclusă' : lang === 'fa' ? 'پس از کسر کلیه مخارج و مالیات' : 'Net of reserve funds & taxes'}
              </div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">
                {lang === 'ro' ? 'Garanții Depozitate' : lang === 'fa' ? 'مبالغ ودیعه نزد حساب امانی' : 'Escrow Deposits'}
              </div>
              <div className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
                <Money amount={5400} currency="EUR" locale={lang} minimumFractionDigits={0} maximumFractionDigits={0} />
              </div>
              <div className="text-[11px] text-[#52667A]">
                {lang === 'ro' ? 'În conturi bancare separate' : lang === 'fa' ? 'پایش در حساب‌های سپرده تفکیک‌شده' : 'Segregated escrow accounts'}
              </div>
            </div>
          </div>

          <div className="card-proptech p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-[#102A43]">
              {lang === 'ro' ? 'Proprietățile Tale Active' : lang === 'fa' ? 'واحدهای مسکونی تحت مدیریت شما' : 'Your Active Properties'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolioProperties.map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0] space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF8F5] text-[#0A6E62]">
                        {formatPropertyUnitDetails(p.unit, lang)}
                      </span>
                      <h4 className="text-sm font-bold text-[#102A43] mt-1">{formatAddress(p.address, lang)}</h4>
                    </div>
                    <span className="text-sm font-extrabold text-[#0E9F8E]">
                      <Money amount={p.monthlyRent} currency={p.currency as any} locale={lang} minimumFractionDigits={0} maximumFractionDigits={0} />
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[#52667A] pt-2 border-t border-[#E2E8F0]">
                    <span>{lang === 'ro' ? 'Chiriaș:' : lang === 'fa' ? 'مستأجر:' : 'Tenant:'} {formatTenantDisplay(p.tenantName, lang)}</span>
                    <span className="font-bold text-[#2F80ED]">Yield: {formatPercent(p.netYieldPercent, lang, 1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD 5: CENSOR */}
      {activeRole === 'censor' && (
        <div className="space-y-6">
          <div className="card-proptech p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-[#102A43]">
              {lang === 'ro' ? 'Pachet de Audit Financiar & Balanță' : lang === 'fa' ? 'بسته ممیزی و تطبیق تراز آزمایشی' : 'Financial Audit & Balance Pack'}
            </h3>
            <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between text-xs text-[#059669]">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck className="w-5 h-5" />
                <span>
                  {lang === 'ro' 
                    ? 'Balanța pe luna Septembrie 2026 este echilibrată: Debit (18.420,50 RON) = Credit (18.420,50 RON)' 
                    : lang === 'fa'
                    ? 'تراز آزمایشی دوره بدون مغایرت است: بدهکار (۱۸٬۴۲۰٫۵۰ لئوی رومانی) = بستانکار (۱۸٬۴۲۰٫۵۰ لئوی رومانی)'
                    : 'September 2026 Trial Balance is perfectly matched: Debit (RON 18,420.50) = Credit (RON 18,420.50)'}
                </span>
              </div>
              <span className="px-3 py-1 rounded bg-[#059669] text-white text-[10px] font-bold">
                {lang === 'ro' ? 'VALIDAT' : lang === 'fa' ? 'تأییدشده' : 'VALIDATED'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD 6: PROPERTY MANAGER */}
      {activeRole === 'property_manager' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">
                {lang === 'ro' ? 'Total Asociații Gestionate' : lang === 'fa' ? 'تعداد کل مجتمع‌های تحت مدیریت' : 'Total Associations'}
              </div>
              <div className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
                {lang === 'ro' ? '8 Asociații' : lang === 'fa' ? '۸ مجتمع' : '8 Associations'}
              </div>
              <div className="text-[11px] text-[#52667A]">
                {lang === 'ro' ? '680 unități totale' : lang === 'fa' ? '۶۸۰ واحد مسکونی در مجموع' : '680 total units'}
              </div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">
                {lang === 'ro' ? 'Închidere Lună Centralizată' : lang === 'fa' ? 'بستن دوره‌های ماهانه' : 'Batch Month Close'}
              </div>
              <div className="text-2xl font-display font-extrabold text-[#0E9F8E] mt-1">
                {lang === 'ro' ? '7 / 8 Închise' : lang === 'fa' ? '۷ از ۸ بسته شد' : '7 / 8 Closed'}
              </div>
              <div className="text-[11px] text-[#059669]">
                {lang === 'ro' ? '1 asociație în validare' : lang === 'fa' ? '۱ مجتمع در مرحله بررسی نهایی' : '1 association in validation'}
              </div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">
                {lang === 'ro' ? 'Performanță SLA Echipă' : lang === 'fa' ? 'شاخص پاسخگویی و SLA تکنسین‌ها' : 'Field SLA Metric'}
              </div>
              <div className="text-2xl font-display font-extrabold text-[#10B981] mt-1">98.4%</div>
              <div className="text-[11px] text-[#059669]">
                {lang === 'ro' ? 'Timp mediu răspuns: 1.8h' : lang === 'fa' ? 'میانگین زمان پاسخ: ۱.۸ ساعت' : 'Avg response time: 1.8h'}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
