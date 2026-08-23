'use client';

import React, { useState } from 'react';
import { Language } from '@/types';
import { 
  Gauge, 
  Camera, 
  AlertTriangle, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  UploadCloud,
  FileCheck
} from 'lucide-react';

interface MeteringProps {
  lang: Language;
}

export const MeteringAndOperationsSection: React.FC<MeteringProps> = ({ lang }) => {
  const [readingInput, setReadingInput] = useState<string>('148.20');
  const [ocrStatus, setOcrStatus] = useState<'IDLE' | 'ANALYZING' | 'CONFIRMED'>('CONFIRMED');

  const handleSimulateOcr = () => {
    setOcrStatus('ANALYZING');
    setTimeout(() => {
      setReadingInput('148.20');
      setOcrStatus('CONFIRMED');
    }, 1200);
  };

  return (
    <section className="py-24 bg-[#F6F9FC] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
            {lang === 'ro' ? 'Nucleul C08 & C09' : 'C08 & C09 Cores'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-[#102A43] tracking-tight">
            {lang === 'ro' ? 'Contorizare, Mentenanță și Operațiuni Zilnice' : 'Metering, Maintenance & Daily Operations'}
          </h2>
          <p className="text-base sm:text-lg text-[#52667A]">
            {lang === 'ro'
              ? 'Elimină bătăile din ușă în ușă pentru citirea apei și tichetele uitate pe WhatsApp. Totul se transmite cu verificare foto și SLA clar.'
              : 'Eliminate door-to-door water index collection and messy WhatsApp group chats. Automated photo review workflows and clear resolution SLAs.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-14 items-center">
          
          {/* Left: Meter Reading with Demo OCR Flow */}
          <div className="lg:col-span-6 card-proptech p-6 sm:p-8 bg-white space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAF8F5] text-[#0E9F8E] flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102A43]">
                    {lang === 'ro' ? 'Transmitere Index Contor Apă (Demo Workflow)' : 'Submit Water Meter Index (Demo Workflow)'}
                  </h3>
                  <p className="text-[11px] text-[#7B8A9A]">Ap. 14 · Contor Apă Rece Bucătărie (RO-APA-882194)</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFF7E6] text-[#B45309] border border-[#FDE68A]">
                Perioadă Deschiză: 20-25 Oct
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0] space-y-2">
                <div className="flex justify-between text-xs text-[#52667A]">
                  <span>Index precedent (Septembrie):</span>
                  <span className="font-bold text-[#102A43] tabular-nums font-mono">142.50 m³</span>
                </div>
                <div className="flex justify-between text-xs text-[#52667A]">
                  <span>Consum mediu istoric ap.:</span>
                  <span className="font-bold text-[#0E9F8E] tabular-nums font-mono">5.80 m³ / lună</span>
                </div>
              </div>

              {/* Photo Upload Area */}
              <div className="p-4 rounded-xl border-2 border-dashed border-[#B2E5DF] bg-[#EAF8F5]/40 text-center space-y-2">
                <Camera className="w-6 h-6 text-[#0E9F8E] mx-auto" />
                <div className="text-xs font-bold text-[#102A43]">
                  {lang === 'ro' ? 'Foto contor încărcată pentru validare' : 'Meter photo uploaded for review'}
                </div>
                <p className="text-[11px] text-[#52667A]">
                  {lang === 'ro' ? 'AI OCR extrage indexul automat cu validare împotriva anomaliilor' : 'AI OCR extracts index digits with anomaly threshold verification'}
                </p>
                <button
                  type="button"
                  onClick={handleSimulateOcr}
                  className="px-3 py-1.5 rounded-lg bg-[#0E9F8E] text-white text-xs font-bold shadow-sm hover:bg-[#0C8778] transition-colors"
                >
                  {ocrStatus === 'ANALYZING' ? (lang === 'ro' ? 'Se analizează...' : 'Analyzing...') : (lang === 'ro' ? 'Re-procesează Foto OCR' : 'Simulate OCR Read')}
                </button>
              </div>

              {/* Index Input & Consumption calculation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#102A43] mb-1">Index Nou Citit (m³)</label>
                  <input
                    type="text"
                    value={readingInput}
                    onChange={(e) => setReadingInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D3DCE6] text-sm font-mono font-bold text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#102A43] mb-1">Consum Rezultat</label>
                  <div className="px-3 py-2 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-sm font-mono font-extrabold text-[#059669]">
                    +{(parseFloat(readingInput || '0') - 142.50).toFixed(2)} m³
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#059669] font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{lang === 'ro' ? 'Consum în marja normală de toleranță (Fără anomalii detectate).' : 'Consumption within expected variance range.'}</span>
              </div>
            </div>
          </div>

          {/* Right: Maintenance Work Orders & SLA */}
          <div className="lg:col-span-6 space-y-4">
            
            <div className="card-proptech p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-[#102A43]">
                  <Wrench className="w-4 h-4 text-[#0E9F8E]" />
                  <span>{lang === 'ro' ? 'Registru Active & Mentenanță Preventivă' : 'Asset Register & Work Orders'}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669]">
                  3 Active
                </span>
              </div>
              <p className="text-xs text-[#52667A] leading-relaxed">
                {lang === 'ro'
                  ? 'Fiecare intervenție are responsabil desemnat, termen SLA și atașament deviz/factură conectat direct la contabilitate.'
                  : 'Every maintenance request is mapped to an asset, contractor SLA, and directly linked to accounting expenses.'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="card-proptech p-4 bg-white flex items-start justify-between gap-4 border-l-4 border-l-[#E5484D]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#E5484D] px-2 py-0.5 rounded bg-[#FEE2E2]">URGENȚĂ MARE</span>
                    <span className="text-xs text-[#7B8A9A]">WO-2026-089</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#102A43] mt-1.5">
                    Pierdere presiune coloană apă caldă - Scara B
                  </h4>
                  <p className="text-xs text-[#52667A] mt-0.5">Alocat: InstalSanit SRL · Termen SLA: 18:00 Azi</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FFF7E6] text-[#B45309] shrink-0">
                  În Lucru
                </span>
              </div>

              <div className="card-proptech p-4 bg-white flex items-start justify-between gap-4 border-l-4 border-l-[#2F80ED]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#2F80ED] px-2 py-0.5 rounded bg-[#EDF5FF]">REVIZIE PERIODICĂ</span>
                    <span className="text-xs text-[#7B8A9A]">WO-2026-090</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#102A43] mt-1.5">
                    Revizie Tehnică Ascensor & Verificare ISCIR
                  </h4>
                  <p className="text-xs text-[#52667A] mt-0.5">Alocat: Otis Lift Servicii · Programat: 28 Octombrie</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669] shrink-0">
                  Programat
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
