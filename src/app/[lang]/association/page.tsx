import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { 
  Building2, 
  FileCheck2, 
  Scale, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Layers
} from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  const isRo = params.lang === 'ro';
  return {
    title: isRo ? 'Cladora Association | Soft Asociații de Proprietari Conform Legii 196/2018' : 'Cladora Association | HOA Management & Statutory Double-Entry Accounting',
    description: isRo
      ? 'Platformă completă pentru asociații de proprietari: liste de plată, adunări generale online, registrul cenzorului și reconciliere bancară automată.'
      : 'Comprehensive HOA Operating System: statutory fee allocations, digital notice boards, online General Assemblies, and Cenzor audit trails.',
  };
}

export default function AssociationPage({
  params,
}: {
  params: { lang: Language };
}) {
  const dict = getDictionary(params.lang);
  const lang = params.lang;
  const isRo = lang === 'ro';

  const capabilities = [
    {
      title: isRo ? 'Calcul Cote Întreținere (Legea 196/2018)' : 'Statutory Fee Distribution (Law 196/2018)',
      desc: isRo
        ? 'Împărțire automată și fără erori pe: număr de persoane, suprafață utilă, cotă-parte indiviză (CPI), consumuri individuale de contoare și servicii speciale.'
        : 'Automated, zero-error distribution based on person count, usable area, undivided equity share (CPI), individual meter readings, and dedicated services.',
    },
    {
      title: isRo ? 'Portal Dedicat pentru Cenzor & Comitet' : 'Auditor (Cenzor) & Board Portal',
      desc: isRo
        ? 'Cenzorul are acces direct la toate facturile originale, jurnalele contabile, extrasele de cont și fișele de apartament pentru o verificare rapidă înainte de publicare.'
        : 'Auditors get instant read-only audit access to source invoice PDFs, bank statements, GL posting logs, and unit sheets before month-end publishing.',
    },
    {
      title: isRo ? 'Adunări Generale Online & Vot Securizat' : 'Online General Assemblies & Legal E-Voting',
      desc: isRo
        ? 'Organizează adunări generale statutare cu calcul automat al cvorumului, vot secret sau deschis cu semnătură electronică și generare automată a procesului verbal.'
        : 'Conduct statutory hybrid or digital assemblies with automated quorum calculation, certified e-voting, and instant minute-to-task conversion.',
    },
    {
      title: isRo ? 'Reconciliere Bancară & Plăți cu Cardul' : 'Automated Bank Reconciliation & Card Payments',
      desc: isRo
        ? 'Importă extrasele bancare din BCR, ING, BT, CEC, Raiffeisen etc. și potrivește automat plățile locatarilor cu zero intervenție manuală.'
        : 'Import bank statements from major banks and automatically match resident bank transfers with zero manual reconciliation overhead.',
    },
  ];

  return (
    <div className="pt-32 pb-24 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-brand-500/20 text-xs font-semibold text-brand-300">
          <Building2 className="w-3.5 h-3.5" />
          <span>Association OS</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight">
          {isRo ? 'Administrare Impecabilă pentru Asociațiile de Proprietari' : 'Flawless Management for Homeowner Associations'}
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          {dict.modesSection.association.tagline}
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Link
            href={`/${lang}/pilot`}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-500 to-emerald-500 shadow-glow-cyan"
          >
            {dict.common.startPilot}
          </Link>
          <Link
            href={`/${lang}/pricing`}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-300 glass-panel hover:text-white"
          >
            {dict.nav.pricing}
          </Link>
        </div>
      </div>

      {/* Core Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {capabilities.map((cap, idx) => (
          <div key={idx} className="p-8 rounded-3xl glass-panel border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold">
              0{idx + 1}
            </div>
            <h3 className="text-xl font-display font-bold text-white">{cap.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{cap.desc}</p>
          </div>
        ))}
      </div>

      {/* Statutory Law 196/2018 Deep Dive Box */}
      <div className="p-8 sm:p-12 rounded-3xl bg-surface-100/90 border border-brand-500/30 space-y-6">
        <div className="flex items-center gap-3">
          <Scale className="w-6 h-6 text-brand-400" />
          <h2 className="text-2xl font-display font-bold text-white">
            {isRo ? 'Cum Asigură CLADORA Respectarea Legii 196/2018 din România' : 'Romanian Law 196/2018 Statutory Rigor'}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-slate-300">
          <div className="space-y-2 p-4 rounded-xl glass-panel">
            <span className="font-bold text-brand-300 block">1. Fond de Rulment & Reparații</span>
            <p className="text-slate-400 text-xs">
              {isRo 
                ? 'Gestiune strict separată a fondului de rulment și de reparații. Dobânzile bancare se capitalizează conform legii.'
                : 'Strict segregation between working capital and repair reserves with statutory interest capitalization.'}
            </p>
          </div>
          <div className="space-y-2 p-4 rounded-xl glass-panel">
            <span className="font-bold text-brand-300 block">2. Penalități & Termene</span>
            <p className="text-slate-400 text-xs">
              {isRo 
                ? 'Calcul automat al penalităților (max 0.2%/zi după 30 de zile) fără depășirea debitului de bază.'
                : 'Automated statutory penalty calculations (statutory ceiling applied) with auditable grace periods.'}
            </p>
          </div>
          <div className="space-y-2 p-4 rounded-xl glass-panel">
            <span className="font-bold text-brand-300 block">3. Transparență & Avizier Digital</span>
            <p className="text-slate-400 text-xs">
              {isRo 
                ? 'Publicare simultană la avizierul fizic și digital. Locatarii văd factura furnizorului cu un simplu click.'
                : 'Synchronous dual publishing to physical notice boards and mobile app with source PDF attachment.'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
