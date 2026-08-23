'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { ShieldCheck, CheckCircle2, ArrowRight, Sparkles, Building2, MapPin } from 'lucide-react';
import { PilotApplicationModal } from '@/components/interactive/PilotApplicationModal';

interface PilotSectionProps {
  lang: Language;
}

export const PilotProgramSection: React.FC<PilotSectionProps> = ({ lang }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const perks = [
    lang === 'ro' ? 'Migrare gratuită a bazei de date din softul vechi (BlocManager, Xisoft, Excel)' : 'Free historical database migration from legacy software or spreadsheets',
    lang === 'ro' ? '1-3 luni rulare în paralel fără costuri suplimentare (Shadow Ledger)' : '1-3 months parallel reconciliation with zero financial risk',
    lang === 'ro' ? 'Asistență tehnică dedicată la prima închidere de lună' : 'Dedicated technical onboarding support during the first month-close',
    lang === 'ro' ? 'Configurare gratuită a tiparului tehnic al clădirii (Building DNA)' : 'Complimentary building technical profile setup (Building DNA)',
    lang === 'ro' ? 'Garanție de tarif blocat pe 24 luni după finalizarea pilotului' : 'Guaranteed 24-month locked pricing post-pilot graduation'
  ];

  return (
    <section id="pilot" className="py-24 bg-white border-b border-[#E2E8F0] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="card-proptech p-8 sm:p-14 bg-gradient-to-br from-[#102A43] via-[#173F5F] to-[#0B2239] text-white relative overflow-hidden shadow-elevated">
          
          {/* Subtle background glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#0E9F8E]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-[#75CFC3]">
                <MapPin className="w-3.5 h-3.5 text-[#0E9F8E]" />
                <span>{lang === 'ro' ? 'Cohorta Pilot: București & Județul Ilfov' : 'Pilot Cohort: Bucharest & Ilfov County'}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                {lang === 'ro' ? 'Înscrie-ți asociația sau portofoliul în programul pilot CLADORA' : 'Enroll Your Association or Portfolio in the CLADORA Pilot Cohort'}
              </h2>

              <p className="text-base text-[#BCCCDC] leading-relaxed">
                {lang === 'ro'
                  ? 'Lucrăm direct cu comitetele executive, administratorii profesioniști și proprietarii de portofoliu pentru a asigura o tranziție curată și transparentă la noul standard de administrare.'
                  : 'We partner directly with executive boards, property managers, and portfolio landlords to ensure clean, explainable residential operations.'}
              </p>

              <div className="space-y-3 pt-2">
                {perks.map((perk, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs text-[#E2E8F0]">
                    <CheckCircle2 className="w-4 h-4 text-[#0E9F8E] shrink-0 mt-0.5" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#0E9F8E] hover:bg-[#0C8778] text-white font-display font-bold text-sm shadow-card-hover transition-all flex items-center justify-center gap-2"
                >
                  <span>{lang === 'ro' ? 'Completează cererea de pilot' : 'Submit Pilot Application'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  href={`/${lang}/pilot`}
                  className="text-xs text-[#BCCCDC] hover:text-white font-semibold underline underline-offset-4"
                >
                  {lang === 'ro' ? 'Află mai multe despre criteriile de selecție →' : 'Learn about selection criteria →'}
                </Link>
              </div>

            </div>

            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 backdrop-blur-sm">
                <div className="text-xs font-bold text-[#75CFC3] uppercase tracking-wider">
                  {lang === 'ro' ? 'Profiluri Eligibile pentru Pilot' : 'Eligible Cohort Profiles'}
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="font-bold text-white">Asociații de Bloc (30–300 Unități)</div>
                    <div className="text-[#BCCCDC] mt-0.5">Blocuri vechi sau ansambluri noi din Sectoarele 1-6 sau Ilfov</div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="font-bold text-white">Proprietari Multi-Apartamente</div>
                    <div className="text-[#BCCCDC] mt-0.5">Deținători de 2+ locuințe închiriate în București/Ilfov</div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="font-bold text-white">Firme de Administrare Imobile</div>
                    <div className="text-[#BCCCDC] mt-0.5">Companii care doresc să automatizeze închiderea lunară</div>
                  </div>
                </div>

                <div className="text-[11px] text-[#7B8A9A] text-center pt-2">
                  🛡️ Fără obligații contractuale pe perioada de testare paralelă
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      <PilotApplicationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        lang={lang}
      />
    </section>
  );
};
