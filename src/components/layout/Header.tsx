'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Language } from '@/types';
import { 
  Building2, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  ChevronDown, 
  Menu, 
  X, 
  Globe, 
  ArrowRight,
  TrendingUp,
  KeyRound,
  Home,
  FileSpreadsheet,
  Zap,
  PlayCircle,
  Sparkles,
  Users,
  BookOpen,
  HelpCircle
} from 'lucide-react';

interface HeaderProps {
  lang: Language;
}

export const Header: React.FC<HeaderProps> = ({ lang }) => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'solutions' | 'modules' | 'resources' | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute alternative language URL preserving current sub-route
  const getAltLangPath = () => {
    if (!pathname) return lang === 'ro' ? '/en' : '/ro';
    if (pathname.startsWith('/ro')) {
      const rest = pathname.slice(3) || '';
      return `/en${rest}`;
    }
    if (pathname.startsWith('/en')) {
      const rest = pathname.slice(3) || '';
      return `/ro${rest}`;
    }
    return lang === 'ro' ? '/en' : '/ro';
  };

  const solutions = [
    {
      title: lang === 'ro' ? 'Asociații de Proprietari' : 'Homeowner Associations',
      desc: lang === 'ro' ? 'Gestiune Legea 196/2018, liste de plată, cenzori și adunări generale' : 'Statutory compliance, payment lists, censors, and AGM governance',
      href: `/${lang}/solutions/associations`,
      icon: Building2,
      tag: 'Association OS'
    },
    {
      title: lang === 'ro' ? 'Proprietari Portofoliu (Multi-Property)' : 'Multi-Property Owners',
      desc: lang === 'ro' ? 'Consolidare apartamente, monitorizare chirii, yield net și contracte' : 'Consolidated rental income, net yields, tenant costs, and contracts',
      href: `/${lang}/solutions/property-owners`,
      icon: TrendingUp,
      tag: 'Portfolio OS'
    },
    {
      title: lang === 'ro' ? 'Companii de Administrare' : 'Property Management Firms',
      desc: lang === 'ro' ? 'Închidere centralizată multi-bloc, SLA mentenanță și furnizori' : 'Multi-association batch close, maintenance SLAs, and operations',
      href: `/${lang}/solutions/property-managers`,
      icon: Layers,
      tag: 'Manager OS'
    },
    {
      title: lang === 'ro' ? 'Proprietari & Rezidenți' : 'Owners & Residents',
      desc: lang === 'ro' ? 'Transparență totală la calculul cotelor, index contoare și plăți' : 'Explainable charges, online meter submission, and notices',
      href: `/${lang}/solutions/residents`,
      icon: Home,
      tag: 'Resident App'
    },
    {
      title: lang === 'ro' ? 'Chiriași' : 'Tenants',
      desc: lang === 'ro' ? 'Acces strict la cheltuielile operaționale de consum și tichete' : 'Direct access to consumption costs without owner ledger access',
      href: `/${lang}/solutions/tenants`,
      icon: KeyRound,
      tag: 'Tenant Portal'
    }
  ];

  const modulesPreview = [
    {
      title: lang === 'ro' ? 'C01 — Financial Truth & Contabilitate' : 'C01 — Financial Truth & Accounting',
      desc: lang === 'ro' ? 'Partidă dublă, jurnal operațiuni, fără ștergeri (stornare)' : 'Double-entry ledger, immutable journals, no silent deletions',
      href: `/${lang}/modules#c01`
    },
    {
      title: lang === 'ro' ? 'C02 — Alocare & Drepturi 5D' : 'C02 — Allocation & Rights Engine',
      desc: lang === 'ro' ? 'Algoritmi CPI, persoane, suprafață și separare debitor/plătitor' : 'Statutory CPI shares, person count, and debtor/payer isolation',
      href: `/${lang}/modules#c02`
    },
    {
      title: lang === 'ro' ? 'C08 — Contoare & Consum' : 'C08 — Utilities & Meter Readings',
      desc: lang === 'ro' ? 'Citire index foto OCR, detecție anomalii și validare' : 'Photo OCR validation, anomaly detection, and radio meters',
      href: `/${lang}/modules#c08`
    },
    {
      title: lang === 'ro' ? 'C16 — Migrare & Shadow Ledger' : 'C16 — Shadow Ledger Migration',
      desc: lang === 'ro' ? 'Reconciliere automată cu softurile vechi în paralel' : 'Zero-risk parallel reconciliation against legacy exports',
      href: `/${lang}/migration`
    }
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-sm py-3'
          : 'bg-[#F6F9FC]/90 backdrop-blur-sm border-b border-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link href={`/${lang}`} className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-[#0E9F8E] rounded-lg">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#102A43] to-[#0E9F8E] flex items-center justify-center text-white font-display font-extrabold text-xl shadow-md group-hover:scale-105 transition-transform">
              C
            </div>
            <div>
              <span className="text-2xl font-display font-extrabold tracking-tight text-[#102A43]">
                CLADORA
              </span>
              <span className="block text-[10px] font-semibold text-[#0E9F8E] uppercase tracking-wider -mt-1">
                Asset OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" ref={dropdownRef}>
            <Link
              href={`/${lang}/platform`}
              className="px-3.5 py-2 rounded-lg text-sm font-semibold text-[#52667A] hover:text-[#102A43] hover:bg-[#F0F4F8] transition-colors"
            >
              {lang === 'ro' ? 'Platformă' : 'Platform'}
            </Link>

            {/* Solutions Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'solutions' ? null : 'solutions')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeDropdown === 'solutions'
                    ? 'text-[#0E9F8E] bg-[#EAF8F5]'
                    : 'text-[#52667A] hover:text-[#102A43] hover:bg-[#F0F4F8]'
                }`}
              >
                <span>{lang === 'ro' ? 'Soluții' : 'Solutions'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'solutions' ? 'rotate-180 text-[#0E9F8E]' : ''}`} />
              </button>

              {activeDropdown === 'solutions' && (
                <div className="absolute top-full left-0 mt-2 w-[480px] bg-white rounded-2xl border border-[#E2E8F0] shadow-elevated p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wider px-3 pb-2 border-b border-[#F0F4F8]">
                    {lang === 'ro' ? 'Soluții pe Tipuri de Utilizatori' : 'Solutions by Customer Type'}
                  </div>
                  <div className="mt-2 space-y-1">
                    {solutions.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F6F9FC] transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-[#EAF8F5] text-[#0E9F8E] flex items-center justify-center shrink-0 group-hover:bg-[#0E9F8E] group-hover:text-white transition-colors">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-[#102A43] group-hover:text-[#0E9F8E] transition-colors">
                                {item.title}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F0F4F8] text-[#52667A]">
                                {item.tag}
                              </span>
                            </div>
                            <p className="text-xs text-[#52667A] mt-0.5 line-clamp-1">
                              {item.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modules Mega Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'modules' ? null : 'modules')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeDropdown === 'modules'
                    ? 'text-[#0E9F8E] bg-[#EAF8F5]'
                    : 'text-[#52667A] hover:text-[#102A43] hover:bg-[#F0F4F8]'
                }`}
              >
                <span>{lang === 'ro' ? 'Module (17 Nuclee)' : 'Modules (17 Cores)'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'modules' ? 'rotate-180 text-[#0E9F8E]' : ''}`} />
              </button>

              {activeDropdown === 'modules' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[540px] bg-white rounded-2xl border border-[#E2E8F0] shadow-elevated p-5 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0F4F8]">
                    <span className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wider">
                      {lang === 'ro' ? 'Arhitectura Modulară CLADORA' : 'CLADORA Modular Architecture'}
                    </span>
                    <Link
                      href={`/${lang}/modules`}
                      onClick={() => setActiveDropdown(null)}
                      className="text-xs font-bold text-[#0E9F8E] hover:underline flex items-center gap-1"
                    >
                      <span>{lang === 'ro' ? 'Vezi toate cele 17 module' : 'View all 17 cores'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {modulesPreview.map((mod, idx) => (
                      <Link
                        key={idx}
                        href={mod.href}
                        onClick={() => setActiveDropdown(null)}
                        className="p-2.5 rounded-xl hover:bg-[#F6F9FC] border border-transparent hover:border-[#E2E8F0] transition-all"
                      >
                        <div className="text-xs font-bold text-[#102A43] line-clamp-1">{mod.title}</div>
                        <div className="text-[11px] text-[#7B8A9A] mt-1 line-clamp-2">{mod.desc}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href={`/${lang}/migration`}
              className="px-3.5 py-2 rounded-lg text-sm font-semibold text-[#52667A] hover:text-[#102A43] hover:bg-[#F0F4F8] transition-colors"
            >
              {lang === 'ro' ? 'Migrare Fără Risc' : 'Safe Migration'}
            </Link>

            <Link
              href={`/${lang}/pricing`}
              className="px-3.5 py-2 rounded-lg text-sm font-semibold text-[#52667A] hover:text-[#102A43] hover:bg-[#F0F4F8] transition-colors"
            >
              {lang === 'ro' ? 'Prețuri Pilot' : 'Pilot Pricing'}
            </Link>

            <Link
              href={`/${lang}/resources/faq`}
              className="px-3.5 py-2 rounded-lg text-sm font-semibold text-[#52667A] hover:text-[#102A43] hover:bg-[#F0F4F8] transition-colors"
            >
              FAQ
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* Interactive Demo Shortcut */}
            <Link
              href={`/${lang}/demo`}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-[#0E9F8E] bg-[#EAF8F5] border border-[#B2E5DF] hover:bg-[#0E9F8E] hover:text-white transition-all shadow-sm"
            >
              <PlayCircle className="w-4 h-4" />
              <span>{lang === 'ro' ? 'Demo Interactiv' : 'Interactive Demo'}</span>
            </Link>

            {/* Language Switcher */}
            <Link
              href={getAltLangPath()}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold text-[#52667A] hover:text-[#102A43] hover:bg-[#F0F4F8] transition-colors border border-[#E2E8F0]"
              aria-label={`Switch to ${lang === 'ro' ? 'English' : 'Română'}`}
            >
              <Globe className="w-3.5 h-3.5 text-[#0E9F8E]" />
              <span className="uppercase">{lang === 'ro' ? 'EN' : 'RO'}</span>
            </Link>

            {/* Sign In to App */}
            <Link
              href={`/${lang}/login`}
              className="text-xs font-bold text-[#102A43] hover:text-[#0E9F8E] px-3 py-2 transition-colors"
            >
              {lang === 'ro' ? 'Autentificare' : 'Sign in'}
            </Link>

            {/* Primary Pilot CTA */}
            <Link
              href={`/${lang}/pilot`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-[#102A43] to-[#0E9F8E] hover:from-[#173F5F] hover:to-[#0C8778] shadow-md hover:shadow-lg transition-all"
            >
              <span>{lang === 'ro' ? 'Aplică în Pilot' : 'Apply for Pilot'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              href={getAltLangPath()}
              className="p-2 rounded-lg text-xs font-bold text-[#52667A] border border-[#E2E8F0]"
            >
              <span className="uppercase">{lang === 'ro' ? 'EN' : 'RO'}</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#102A43] hover:bg-[#F0F4F8] focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[65px] bottom-0 bg-white border-t border-[#E2E8F0] z-40 overflow-y-auto p-6 space-y-6 animate-in slide-in-from-top-4 duration-200">
          
          <div className="p-4 rounded-2xl bg-[#EAF8F5] border border-[#B2E5DF] flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[#0A6E62]">
                {lang === 'ro' ? 'Explorează fără cont' : 'Explore with zero login'}
              </div>
              <div className="text-sm font-extrabold text-[#102A43]">
                {lang === 'ro' ? 'Demo Sandbox Interactiv' : 'Interactive Demo Sandbox'}
              </div>
            </div>
            <Link
              href={`/${lang}/demo`}
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#0E9F8E] text-white text-xs font-bold shadow-sm"
            >
              {lang === 'ro' ? 'Deschide' : 'Launch'}
            </Link>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wider px-2">
              {lang === 'ro' ? 'Soluții' : 'Solutions'}
            </div>
            {solutions.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F6F9FC] border border-[#E2E8F0]/60 text-sm font-bold text-[#102A43]"
              >
                <span>{item.title}</span>
                <ArrowRight className="w-4 h-4 text-[#7B8A9A]" />
              </Link>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
            <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wider px-2">
              {lang === 'ro' ? 'Navigare' : 'Navigation'}
            </div>
            <Link
              href={`/${lang}/platform`}
              onClick={() => setMobileMenuOpen(false)}
              className="block p-3 rounded-xl hover:bg-[#F6F9FC] text-sm font-bold text-[#102A43]"
            >
              {lang === 'ro' ? 'Platformă' : 'Platform'}
            </Link>
            <Link
              href={`/${lang}/modules`}
              onClick={() => setMobileMenuOpen(false)}
              className="block p-3 rounded-xl hover:bg-[#F6F9FC] text-sm font-bold text-[#102A43]"
            >
              {lang === 'ro' ? 'Module (17 Nuclee)' : 'Modules (17 Cores)'}
            </Link>
            <Link
              href={`/${lang}/migration`}
              onClick={() => setMobileMenuOpen(false)}
              className="block p-3 rounded-xl hover:bg-[#F6F9FC] text-sm font-bold text-[#102A43]"
            >
              {lang === 'ro' ? 'Migrare Shadow Ledger' : 'Shadow Ledger Migration'}
            </Link>
            <Link
              href={`/${lang}/pricing`}
              onClick={() => setMobileMenuOpen(false)}
              className="block p-3 rounded-xl hover:bg-[#F6F9FC] text-sm font-bold text-[#102A43]"
            >
              {lang === 'ro' ? 'Prețuri Pilot' : 'Pilot Pricing'}
            </Link>
            <Link
              href={`/${lang}/resources/faq`}
              onClick={() => setMobileMenuOpen(false)}
              className="block p-3 rounded-xl hover:bg-[#F6F9FC] text-sm font-bold text-[#102A43]"
            >
              FAQ
            </Link>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
            <Link
              href={`/${lang}/pilot`}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#0E9F8E] text-white text-sm font-extrabold shadow-md"
            >
              <span>{lang === 'ro' ? 'Aplică în Programul Pilot' : 'Apply for Pilot Cohort'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/${lang}/login`}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl border border-[#E2E8F0] text-[#102A43] text-sm font-bold bg-white"
            >
              {lang === 'ro' ? 'Autentificare în Aplicație' : 'Sign in to App'}
            </Link>
          </div>

        </div>
      )}
    </header>
  );
};
