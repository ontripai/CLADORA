import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  FileCheck2, 
  Scale, 
  Globe2, 
  Server, 
  HeartHandshake,
  CheckCircle2
} from 'lucide-react';

interface FooterProps {
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const dict = getDictionary(lang);

  return (
    <footer className="relative bg-[#05080E] border-t border-white/10 pt-16 pb-12 overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-brand-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          
          {/* Col 1: Brand & Philosophy */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-[1px] shadow-glow-cyan">
                <div className="w-full h-full bg-[#070B12] rounded-[11px] flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-brand-400" />
                </div>
              </div>
              <span className="text-xl font-display font-bold tracking-wider text-white">
                CLADORA
              </span>
            </div>

            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              {dict.footer.about}
            </p>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{dict.common.romaniaFirst}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Scale className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span>{dict.common.lawCompliance}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{dict.common.securityCertified}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Solutions & Modules */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              {dict.footer.solutionsTitle}
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href={`/${lang}/association`} className="hover:text-brand-300 transition-colors">
                  {dict.footer.links.association}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/portfolio`} className="hover:text-brand-300 transition-colors">
                  {dict.footer.links.portfolio}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/manager`} className="hover:text-brand-300 transition-colors">
                  {dict.footer.links.manager}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/financial-truth`} className="hover:text-brand-300 transition-colors">
                  {dict.footer.links.financialTruth}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/building-dna`} className="hover:text-brand-300 transition-colors">
                  {dict.footer.links.buildingDna}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/meters`} className="hover:text-brand-300 transition-colors">
                  {dict.footer.links.meters}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Migration & Platform */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              {dict.footer.complianceTitle}
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href={`/${lang}/migration`} className="hover:text-brand-300 transition-colors">
                  {dict.footer.links.migration}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/pricing`} className="hover:text-brand-300 transition-colors">
                  {dict.footer.links.pricing}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/pilot`} className="hover:text-amber-300 text-amber-400 font-medium transition-colors">
                  {dict.footer.links.pilot}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/trust`} className="hover:text-brand-300 transition-colors">
                  {dict.footer.links.security}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/trust#gdpr`} className="hover:text-brand-300 transition-colors">
                  {dict.footer.links.privacy}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Verification Badges */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              {lang === 'ro' ? 'Garanții Tehnice' : 'Technical Guarantees'}
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl glass-panel text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-brand-300 flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-brand-400" />
                  <span>Legea 196/2018 Certified</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {lang === 'ro' ? 'Formule oficiale CPI și fonduri de rulment.' : 'Official CPI and statutory reserve fund logic.'}
                </p>
              </div>

              <div className="p-3 rounded-xl glass-panel text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Shadow Ledger Guarantee</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {lang === 'ro' ? '0% risc de pierdere a datelor istorice.' : 'Zero data loss during legacy migration.'}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 {dict.common.brandName}. {dict.common.allRightsReserved}
          </div>
          <div className="flex items-center gap-6">
            <Link href={`/${lang}/trust#terms`} className="hover:text-slate-300 transition-colors">
              {dict.footer.links.terms}
            </Link>
            <Link href={`/${lang}/trust#privacy`} className="hover:text-slate-300 transition-colors">
              {dict.footer.links.privacy}
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono">CLD-PMP-001 v1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
