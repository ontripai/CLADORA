import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { 
  TrendingUp, 
  ArrowRight
} from 'lucide-react';
import { MOCK_PORTFOLIO_PROPERTIES } from '@/data/mockData';
import { Money } from '@/components/ui/Money';
import { formatPercent } from '@/config/currencies';

interface PortfolioSectionProps {
  lang: Language;
}

export const PortfolioIntelligenceSection: React.FC<PortfolioSectionProps> = ({ lang }) => {
  return (
    <section className="py-24 bg-[#F6F9FC] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
            {lang === 'ro' ? 'CLADORA Portfolio OS' : lang === 'fa' ? 'سیستم‌عامل پایش سبد املاک CLADORA' : 'CLADORA Portfolio OS'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-[#102A43] tracking-tight">
            {lang === 'ro' 
              ? 'Inteligență Financiară pentru Portofoliul Tău' 
              : lang === 'fa'
              ? 'پایش هوشمند و تجمیعی سبد دارایی‌های ملکی'
              : 'Consolidated Portfolio Intelligence'}
          </h2>
          <p className="text-base sm:text-lg text-[#52667A]">
            {lang === 'ro'
              ? 'Un proprietar din România poate locui într-un apartament și închiria alte 3 proprietăți. CLADORA îți oferă o singură consolă pentru randament, chirii, garanții și contracte.'
              : lang === 'fa'
              ? 'یک مالک می‌تواند در یک واحد ساکن بوده و هم‌زمان چند ملک استیجاری داشته باشد. کلادورا یک داشبورد جامع برای پایش بازده خالص، وصول اجاره‌ها، حساب امانی ودیعه و سررسید قراردادها فراهم می‌کند.'
              : 'One Romanian owner can live in one condo while renting out 3 others. CLADORA gives you a single dashboard for gross rent, net yield, tenant recovery, and renewals.'}
          </p>
        </div>

        {/* Portfolio KPI Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
          <div className="card-proptech p-5 bg-white">
            <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wide">
              {lang === 'ro' ? 'Total Proprietăți Active' : lang === 'fa' ? 'تعداد کل املاک تحت پوشش' : 'Total Properties'}
            </div>
            <div className="text-2xl font-display font-extrabold text-[#102A43] mt-2">
              {lang === 'ro' ? '4 Apartamente' : lang === 'fa' ? '۴ واحد مسکونی' : '4 Properties'}
            </div>
            <div className="text-xs text-[#059669] font-bold mt-1">
              {lang === 'ro' ? '✓ 100% Grad Ocupare' : lang === 'fa' ? '✓ نرخ اشغال ۱۰۰٪' : '✓ 100% Occupancy'}
            </div>
          </div>

          <div className="card-proptech p-5 bg-white">
            <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wide">
              {lang === 'ro' ? 'Venit Lunar Brut Chirii' : lang === 'fa' ? 'درآمد ماهانه ناخالص اجاره' : 'Gross Monthly Rent'}
            </div>
            <div className="text-2xl font-display font-extrabold text-[#0E9F8E] mt-2">
              <Money amount={3180} currency="EUR" locale={lang} minimumFractionDigits={0} maximumFractionDigits={0} />
            </div>
            <div className="text-xs text-[#52667A] mt-1 font-mono">
              ~<Money amount={15900} currency="RON" locale={lang} minimumFractionDigits={0} maximumFractionDigits={0} /> / {lang === 'ro' ? 'lună' : lang === 'fa' ? 'ماه' : 'month'}
            </div>
          </div>

          <div className="card-proptech p-5 bg-white">
            <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wide">
              {lang === 'ro' ? 'Randament Mediu Net' : lang === 'fa' ? 'میانگین بازده خالص سالانه' : 'Average Net Yield'}
            </div>
            <div className="text-2xl font-display font-extrabold text-[#2F80ED] mt-2">
              {formatPercent(6.8, lang, 1)} / {lang === 'ro' ? 'an' : lang === 'fa' ? 'سال' : 'year'}
            </div>
            <div className="text-xs text-[#52667A] mt-1">
              {lang === 'ro' ? 'După scădere fonduri & taxe' : lang === 'fa' ? 'پس از کسر مالیات و هزینه‌ها' : 'Net of fees & taxes'}
            </div>
          </div>

          <div className="card-proptech p-5 bg-white">
            <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wide">
              {lang === 'ro' ? 'Garanții Păstrate' : lang === 'fa' ? 'مجموع مبالغ ودیعه نزد امین' : 'Total Deposits Held'}
            </div>
            <div className="text-2xl font-display font-extrabold text-[#102A43] mt-2">
              <Money amount={5400} currency="EUR" locale={lang} minimumFractionDigits={0} maximumFractionDigits={0} />
            </div>
            <div className="text-xs text-[#52667A] mt-1">
              {lang === 'ro' ? 'Evidență separată depozite' : lang === 'fa' ? 'پایش در حساب‌های سپرده مجزا' : 'Separate escrow tracking'}
            </div>
          </div>
        </div>

        {/* Properties Mini Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {MOCK_PORTFOLIO_PROPERTIES.slice(0, 2).map((prop) => (
            <div key={prop.id} className="card-proptech p-6 bg-white space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF8F5] text-[#0A6E62]">
                    {prop.unit}
                  </span>
                  <h3 className="text-base font-bold text-[#102A43] mt-1">
                    {prop.address}
                  </h3>
                  <p className="text-xs text-[#52667A]">{prop.associationName}</p>
                </div>
                <div className="text-end">
                  <div className="text-lg font-display font-extrabold text-[#0E9F8E]">
                    <Money amount={prop.monthlyRent} currency={prop.currency as any} locale={lang} minimumFractionDigits={0} maximumFractionDigits={0} />
                  </div>
                  <span className="text-[10px] font-semibold text-[#52667A]">
                    {lang === 'ro' ? 'chirie lunară' : lang === 'fa' ? 'اجاره ماهانه' : 'monthly rent'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#F0F4F8] text-center text-xs">
                <div className="p-2 rounded-lg bg-[#F6F9FC]">
                  <div className="text-[#7B8A9A] text-[10px]">{lang === 'ro' ? 'Chiriaș' : lang === 'fa' ? 'مستأجر' : 'Tenant'}</div>
                  <div className="font-bold text-[#102A43] truncate mt-0.5">{prop.tenantName || (lang === 'ro' ? 'Vacant' : lang === 'fa' ? 'خالی' : 'Vacant')}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#F6F9FC]">
                  <div className="text-[#7B8A9A] text-[10px]">{lang === 'ro' ? 'Expirare Contract' : lang === 'fa' ? 'انقضای قرارداد' : 'Lease Expiry'}</div>
                  <div className="font-bold text-[#102A43] font-mono mt-0.5 ltr-isolate">{prop.leaseEndDate}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#F6F9FC]">
                  <div className="text-[#7B8A9A] text-[10px]">{lang === 'ro' ? 'Yield Net' : lang === 'fa' ? 'بازده خالص' : 'Net Yield'}</div>
                  <div className="font-bold text-[#2F80ED] mt-0.5">{formatPercent(prop.netYieldPercent, lang, 1)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href={`/${lang}/solutions/property-owners`}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#0E9F8E] hover:text-[#0C8778]"
          >
            <span>
              {lang === 'ro' 
                ? 'Vezi toate funcționalitățile pentru proprietari de portofoliu' 
                : lang === 'fa'
                ? 'مشاهده تمامی امکانات ویژه مالکان چند ملک'
                : 'Explore all portfolio owner features'}
            </span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>

      </div>
    </section>
  );
};
