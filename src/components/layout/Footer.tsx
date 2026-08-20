'use client';

import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { Building2, Shield, Lock, FileCheck, Globe, Sparkles } from 'lucide-react';

interface FooterProps {
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const dict = getDictionary(lang);
  const footer = dict.footer;

  return (
    <footer className="relative bg-[#05080E] border-t border-white/10 pt-16 pb-12 overflow-hidden">
      {/* Subtle bottom glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-brand-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Brand & About */}
          <div className="lg:col-span-2 space-y-4">
            <Link href={`/${lang}`} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-400 to-emerald-400 p-[1px]">
                <div className="w-full h-full bg-[#070B12] rounded-[11px] flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-brand-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-display font-extrabold tracking-wider text-white">
                  CLADORA
                </span>
                <span className="text-[9px] font-medium tracking-widest text-emerald-400 uppercase -mt-1">
                  Residential Asset OS
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              {footer.tagline}
            </p>

            {/* Badges / Trust stamps */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] text-slate-200">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 border border-white/15">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>Legea 196/2018</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 border border-white/15">
                <Lock className="w-3 h-3 text-brand-400" />
                <span>GDPR & E2EE</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 border border-white/15">
                <FileCheck className="w-3 h-3 text-gold-400" />
                <span>Double-Entry GL</span>
              </span>
            </div>
          </div>

          {/* Links Column 1: Operating Modes */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'ro' ? 'Moduri de Operare' : 'Operating Modes'}
            </div>
            <ul className="space-y-2 text-xs">
              {footer.links.modes.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={`/${lang}${item.href}`}
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2: Platform Cores */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'ro' ? 'Platformă & Tehnologie' : 'Platform & Tech'}
            </div>
            <ul className="space-y-2 text-xs">
              {footer.links.platform.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={`/${lang}${item.href}`}
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 3: Trust & Company */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'ro' ? 'Securitate & Pilot' : 'Security & Pilot'}
            </div>
            <ul className="space-y-2 text-xs">
              {footer.links.trust.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={`/${lang}${item.href}`}
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <Link
                href={`/${lang}/pilot`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/40 hover:bg-brand-500/30 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-brand-400" />
                <span>{lang === 'ro' ? 'Înscrie-te în Pilot' : 'Apply for Pilot'}</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
          <div>
            {footer.copyright}
          </div>

          <div className="flex items-center gap-6">
            <Link href={`/${lang}/trust#privacy`} className="text-slate-300 hover:text-white transition-colors">
              {lang === 'ro' ? 'Politica de Confidențialitate (GDPR)' : 'Privacy Policy (GDPR)'}
            </Link>
            <Link href={`/${lang}/trust#terms`} className="text-slate-300 hover:text-white transition-colors">
              {lang === 'ro' ? 'Termeni și Condiții' : 'Terms & Conditions'}
            </Link>
            <Link href={lang === 'ro' ? '/en' : '/ro'} className="inline-flex items-center gap-1 text-brand-300 hover:text-brand-200 transition-colors">
              <Globe className="w-3 h-3" />
              <span>{lang === 'ro' ? 'English Version' : 'Versiunea Română'}</span>
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
