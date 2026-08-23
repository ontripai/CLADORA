import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { ShieldCheck, HeartHandshake, CheckCircle2, Lock, ArrowUpRight } from 'lucide-react';

interface FooterProps {
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#102A43] text-white pt-16 pb-12 border-t border-[#173F5F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#173F5F]">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0E9F8E] to-[#10B981] flex items-center justify-center text-white font-display font-extrabold text-lg shadow-md">
                C
              </div>
              <span className="text-2xl font-display font-extrabold tracking-tight text-white">
                CLADORA
              </span>
            </div>
            
            <p className="text-sm text-[#BCCCDC] leading-relaxed max-w-sm">
              {lang === 'ro'
                ? 'Sistemul de operare pentru active rezidențiale. Unifică contabilitatea în partidă dublă, Legea 196/2018, drepturile proprietar-chiriaș, citirea contoarelor și portofoliile imobiliare într-un singur adevăr financiar.'
                : 'The residential asset operating system. Unifying double-entry accounting truth, Law 196/2018 statutory compliance, 5D owner-tenant rights, meter readings, and property portfolios.'}
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-[#0E9F8E] font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>{lang === 'ro' ? 'Creat pentru piața rezidențială din România' : 'Engineered for European & Romanian Residential Real Estate'}</span>
            </div>
          </div>

          {/* Solutions Column */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#75CFC3] uppercase tracking-wider">
              {lang === 'ro' ? 'Soluții pe Roluri' : 'Solutions by Role'}
            </div>
            <ul className="space-y-2 text-sm text-[#BCCCDC]">
              <li>
                <Link href={`/${lang}/solutions/associations`} className="hover:text-white transition-colors">
                  {lang === 'ro' ? 'Asociații de Proprietari' : 'Homeowner Associations'}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/solutions/property-owners`} className="hover:text-white transition-colors">
                  {lang === 'ro' ? 'Proprietari (Multi-Property)' : 'Portfolio Landlords'}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/solutions/property-managers`} className="hover:text-white transition-colors">
                  {lang === 'ro' ? 'Companii de Administrare' : 'Property Managers'}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/solutions/residents`} className="hover:text-white transition-colors">
                  {lang === 'ro' ? 'Proprietari & Rezidenți' : 'Owners & Residents'}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/solutions/tenants`} className="hover:text-white transition-colors">
                  {lang === 'ro' ? 'Chiriași (Consum & Tichete)' : 'Tenants Portal'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Modules Column */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#75CFC3] uppercase tracking-wider">
              {lang === 'ro' ? 'Platformă & Module' : 'Platform & Modules'}
            </div>
            <ul className="space-y-2 text-sm text-[#BCCCDC]">
              <li>
                <Link href={`/${lang}/platform`} className="hover:text-white transition-colors">
                  {lang === 'ro' ? 'Arhitectura Platformei' : 'Platform Architecture'}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/modules`} className="hover:text-white transition-colors">
                  {lang === 'ro' ? 'Cele 17 Module Logice' : 'The 17 Logical Cores'}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/migration`} className="hover:text-white transition-colors">
                  {lang === 'ro' ? 'Protocolul Shadow Ledger' : 'Shadow Ledger Migration'}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/pricing`} className="hover:text-white transition-colors">
                  {lang === 'ro' ? 'Prețuri Pilot & Calculator' : 'Pilot Pricing Calculator'}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/demo`} className="hover:text-white transition-colors flex items-center gap-1">
                  <span>{lang === 'ro' ? 'Demo Sandbox Public' : 'Public Demo Sandbox'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#0E9F8E]" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Legal Column */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#75CFC3] uppercase tracking-wider">
              {lang === 'ro' ? 'Resurse & Conformitate' : 'Resources & Trust'}
            </div>
            <ul className="space-y-2 text-sm text-[#BCCCDC]">
              <li>
                <Link href={`/${lang}/resources/faq`} className="hover:text-white transition-colors">
                  {lang === 'ro' ? 'Întrebări Frecvente (FAQ)' : 'Frequently Asked Questions'}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/resources/guides`} className="hover:text-white transition-colors">
                  {lang === 'ro' ? 'Ghiduri Legea 196/2018' : 'Law 196/2018 Guides'}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/security`} className="hover:text-white transition-colors">
                  {lang === 'ro' ? 'Securitate & Izolare Date' : 'Security & Data Isolation'}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/privacy`} className="hover:text-white transition-colors">
                  {lang === 'ro' ? 'Politica de Confidențialitate (GDPR)' : 'Privacy Policy (GDPR)'}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/terms`} className="hover:text-white transition-colors">
                  {lang === 'ro' ? 'Termeni și Condiții' : 'Terms of Service'}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/accessibility`} className="hover:text-white transition-colors">
                  {lang === 'ro' ? 'Declarație Accesibilitate (WCAG)' : 'Accessibility Statement'}
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Legal Disclaimer & Regulatory Note */}
        <div className="py-6 text-xs text-[#7B8A9A] leading-relaxed border-b border-[#173F5F]">
          <p>
            {lang === 'ro'
              ? 'Notă legală și metodologică: Estimările de economii și calculele de randament sunt orientative și depind de specificul clădirii, starea instalațiilor, istoricul de consum și calitatea datelor importate. Algoritmii de repartizare a cheltuielilor sunt proiectați în conformitate cu prevederile Legii nr. 196/2018 privind înființarea, organizarea și funcționarea asociațiilor de proprietari și administrarea condominiilor din România. Funcționalitatea de migrare Shadow Ledger este concepută pentru a identifica discrepanțele înainte de trecerea operațională efectivă.'
              : 'Legal & methodological disclaimer: Savings estimates and yield projections are indicative and subject to building conditions, contract terms, consumption patterns, and data fidelity. Allocation algorithms are designed to support Romanian Law 196/2018 for condominium management. Shadow Ledger migration is designed to identify historical accounting discrepancies prior to cutover.'}
          </p>
        </div>

        {/* Bottom Strip */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7B8A9A]">
          <div>
            © {currentYear} CLADORA Technologies. {lang === 'ro' ? 'Toate drepturile rezervate.' : 'All rights reserved.'}
          </div>
          <div className="flex items-center gap-6">
            <Link href={`/${lang}/privacy`} className="hover:text-white transition-colors">
              {lang === 'ro' ? 'Confidențialitate' : 'Privacy'}
            </Link>
            <Link href={`/${lang}/terms`} className="hover:text-white transition-colors">
              {lang === 'ro' ? 'Termeni' : 'Terms'}
            </Link>
            <Link href={`/${lang}/cookies`} className="hover:text-white transition-colors">
              Cookies
            </Link>
            <Link href={`/${lang}/accessibility`} className="hover:text-white transition-colors">
              {lang === 'ro' ? 'Accesibilitate' : 'Accessibility'}
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
