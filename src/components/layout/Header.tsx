'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { 
  Building2, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Sparkles, 
  ChevronDown, 
  Menu, 
  X, 
  Globe, 
  ArrowRight,
  TrendingUp,
  Gauge,
  Scale
} from 'lucide-react';

interface HeaderProps {
  lang: Language;
}

export const Header: React.FC<HeaderProps> = ({ lang }) => {
  const dict = getDictionary(lang);
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsDropdown, setSolutionsDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Compute alternative language URL preserving the current route
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

  const navLinks = [
    { label: dict.nav.modes, href: `#modes`, isDropdown: true },
    { label: dict.nav.financialTruth, href: `/${lang}/financial-truth` },
    { label: dict.nav.buildingDna, href: `/${lang}/building-dna` },
    { label: dict.nav.meters, href: `/${lang}/meters` },
    { label: dict.nav.migration, href: `/${lang}/migration` },
    { label: dict.nav.pricing, href: `/${lang}/pricing` },
    { label: dict.nav.pilot, href: `/${lang}/pilot`, isSpecial: true },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#070B12]/85 backdrop-blur-xl border-b border-white/10 shadow-2xl py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link href={`/${lang}`} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-400 to-emerald-400 p-[1px] shadow-glow-cyan transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-[#070B12] rounded-[11px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-brand-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-display font-extrabold tracking-wider text-white group-hover:text-brand-300 transition-colors">
                CLADORA
              </span>
              <span className="text-[10px] font-medium tracking-widest text-emerald-400 uppercase -mt-1">
                Asset OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {/* Solutions Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setSolutionsDropdown(true)}
              onMouseLeave={() => setSolutionsDropdown(false)}
            >
              <button
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                aria-expanded={solutionsDropdown}
              >
                <span>{dict.nav.modes}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${solutionsDropdown ? 'rotate-180 text-brand-400' : ''}`} />
              </button>

              {solutionsDropdown && (
                <div className="absolute top-full left-0 w-80 pt-2 animate-fade-in">
                  <div className="p-3 rounded-2xl glass-panel shadow-2xl border border-white/10 space-y-1">
                    <Link
                      href={`/${lang}/association`}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 group-hover:bg-brand-500/20">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-brand-300">
                          {dict.nav.association}
                        </div>
                        <div className="text-xs text-slate-400">
                          {lang === 'ro' ? 'Legea 196/2018, liste de plată, adunări' : 'HOA compliance, double-entry, AGMs'}
                        </div>
                      </div>
                    </Link>

                    <Link
                      href={`/${lang}/portfolio`}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-emerald-300">
                          {dict.nav.portfolio}
                        </div>
                        <div className="text-xs text-slate-400">
                          {lang === 'ro' ? 'Portofolii proprietari & drepturi chiriași' : 'Multi-property landlord & tenant rights'}
                        </div>
                      </div>
                    </Link>

                    <Link
                      href={`/${lang}/manager`}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-violet-300">
                          {dict.nav.manager}
                        </div>
                        <div className="text-xs text-slate-400">
                          {lang === 'ro' ? 'Companii de administrare multi-bloc' : 'Multi-building management company OS'}
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href={`/${lang}/financial-truth`}
              className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
            >
              {dict.nav.financialTruth}
            </Link>

            <Link
              href={`/${lang}/building-dna`}
              className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
            >
              {dict.nav.buildingDna}
            </Link>

            <Link
              href={`/${lang}/meters`}
              className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
            >
              {dict.nav.meters}
            </Link>

            <Link
              href={`/${lang}/migration`}
              className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
            >
              {dict.nav.migration}
            </Link>

            <Link
              href={`/${lang}/pricing`}
              className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
            >
              {dict.nav.pricing}
            </Link>

            <Link
              href={`/${lang}/pilot`}
              className="ml-1 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full hover:bg-amber-500/20 transition-all flex items-center gap-1.5 animate-pulse-subtle"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{dict.nav.pilot}</span>
            </Link>
          </nav>

          {/* Right Action Section */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language Switcher */}
            <Link
              href={getAltLangPath()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              title={lang === 'ro' ? 'Switch to English' : 'Comută în Română'}
            >
              <Globe className="w-3.5 h-3.5 text-brand-400" />
              <span>{dict.common.switchLang}</span>
            </Link>

            <Link
              href={`/${lang}/pilot`}
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs font-semibold rounded-xl group bg-gradient-to-br from-brand-400 via-emerald-400 to-teal-500 group-hover:from-brand-500 group-hover:to-teal-600 text-white shadow-glow-cyan"
            >
              <span className="relative px-4 py-2 transition-all ease-in duration-75 bg-[#070B12] rounded-[10px] group-hover:bg-opacity-0 flex items-center gap-1.5">
                <span>{dict.common.startPilot}</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-300 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href={getAltLangPath()}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 rounded-lg bg-white/5 border border-white/10"
            >
              <Globe className="w-3.5 h-3.5 text-brand-400" />
              <span>{lang === 'ro' ? 'EN' : 'RO'}</span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg bg-white/5 border border-white/10"
              aria-label="Open Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden animate-fade-in bg-[#070B12]/95 backdrop-blur-2xl border-b border-white/10 px-4 pt-4 pb-6 space-y-3">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
              {dict.nav.modes}
            </div>
            <Link
              href={`/${lang}/association`}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              {dict.nav.association}
            </Link>
            <Link
              href={`/${lang}/portfolio`}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              {dict.nav.portfolio}
            </Link>
            <Link
              href={`/${lang}/manager`}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              {dict.nav.manager}
            </Link>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-1">
            <Link
              href={`/${lang}/financial-truth`}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              {dict.nav.financialTruth}
            </Link>
            <Link
              href={`/${lang}/building-dna`}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              {dict.nav.buildingDna}
            </Link>
            <Link
              href={`/${lang}/meters`}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              {dict.nav.meters}
            </Link>
            <Link
              href={`/${lang}/migration`}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              {dict.nav.migration}
            </Link>
            <Link
              href={`/${lang}/pricing`}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              {dict.nav.pricing}
            </Link>
            <Link
              href={`/${lang}/trust`}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              {dict.nav.trust}
            </Link>
          </div>

          <div className="pt-3">
            <Link
              href={`/${lang}/pilot`}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-500 text-white font-semibold text-sm shadow-glow-cyan"
            >
              <Sparkles className="w-4 h-4" />
              <span>{dict.common.startPilot}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
