import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { 
  TrendingUp, 
  Building, 
  FileText, 
  Calendar, 
  ArrowRight, 
  DollarSign, 
  ShieldCheck,
  PieChart
} from 'lucide-react';
import { MOCK_PORTFOLIO_PROPERTIES } from '@/data/mockData';

interface PortfolioSectionProps {
  lang: Language;
}

export const PortfolioIntelligenceSection: React.FC<PortfolioSectionProps> = ({ lang }) => {
  return (
    <section className="py-24 bg-[#F6F9FC] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
            {lang === 'ro' ? 'CLADORA Portfolio OS' : 'CLADORA Portfolio OS'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-[#102A43] tracking-tight">
            {lang === 'ro' ? 'Inteligență Financiară pentru Portofoliul Tău' : 'Consolidated Portfolio Intelligence'}
          </h2>
          <p className="text-base sm:text-lg text-[#52667A]">
            {lang === 'ro'
              ? 'Un proprietar din România poate locui într-un apartament și închiria alte 3 proprietăți. CLADORA îți oferă o singură consolă pentru randament, chirii, garanții și contracte.'
              : 'One Romanian owner can live in one condo while renting out 3 others. CLADORA gives you a single dashboard for gross rent, net yield, tenant recovery, and renewals.'}
          </p>
        </div>

        {/* Portfolio KPI Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
          <div className="card-proptech p-5 bg-white">
            <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wide">
              {lang === 'ro' ? 'Total Proprietăți Active' : 'Total Properties'}
            </div>
            <div className="text-2xl font-display font-extrabold text-[#102A43] mt-2">
              4 Apartamente
            </div>
            <div className="text-xs text-[#059669] font-semibold mt-1">✓ 100% Grad Ocupare</div>
          </div>

          <div className="card-proptech p-5 bg-white">
            <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wide">
              {lang === 'ro' ? 'Venit Lunar Brut Chirii' : 'Gross Monthly Rent'}
            </div>
            <div className="text-2xl font-display font-extrabold text-[#0E9F8E] mt-2 tabular-nums">
              3.180 EUR
            </div>
            <div className="text-xs text-[#52667A] mt-1">~15.900 RON / lună</div>
          </div>

          <div className="card-proptech p-5 bg-white">
            <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wide">
              {lang === 'ro' ? 'Randament Mediu Net' : 'Average Net Yield'}
            </div>
            <div className="text-2xl font-display font-extrabold text-[#2F80ED] mt-2 tabular-nums">
              6.8% / an
            </div>
            <div className="text-xs text-[#52667A] mt-1">După scădere fonduri & taxe</div>
          </div>

          <div className="card-proptech p-5 bg-white">
            <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wide">
              {lang === 'ro' ? 'Garanții Păstrate' : 'Total Deposits Held'}
            </div>
            <div className="text-2xl font-display font-extrabold text-[#102A43] mt-2 tabular-nums">
              5.400 EUR
            </div>
            <div className="text-xs text-[#52667A] mt-1">Evidență separată depozite</div>
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
                <div className="text-right">
                  <div className="text-lg font-display font-extrabold text-[#0E9F8E] tabular-nums">
                    {prop.monthlyRent} {prop.currency}
                  </div>
                  <span className="text-[10px] font-semibold text-[#52667A]">chirie lunară</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#F0F4F8] text-center text-xs">
                <div className="p-2 rounded-lg bg-[#F6F9FC]">
                  <div className="text-[#7B8A9A] text-[10px]">Chiriaș</div>
                  <div className="font-bold text-[#102A43] truncate mt-0.5">{prop.tenantName || 'Vacant'}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#F6F9FC]">
                  <div className="text-[#7B8A9A] text-[10px]">Expirare Contract</div>
                  <div className="font-bold text-[#102A43] font-mono mt-0.5">{prop.leaseEndDate}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#F6F9FC]">
                  <div className="text-[#7B8A9A] text-[10px]">Yield Net</div>
                  <div className="font-bold text-[#2F80ED] mt-0.5">{prop.netYieldPercent}%</div>
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
            <span>{lang === 'ro' ? 'Vezi toate funcționalitățile pentru proprietari de portofoliu' : 'Explore all portfolio owner features'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
};
