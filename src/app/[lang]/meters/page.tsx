import React from 'react';
import type { Metadata } from 'next';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { Zap, Camera, QrCode, Radio, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  const isRo = params.lang === 'ro';
  return {
    title: isRo ? 'Citire Contoare & Validare AI OCR | CLADORA' : 'Smart Meter Reading & AI OCR Validation | CLADORA',
    description: isRo
      ? 'Colectare indexuri apă, gaz, electricitate și căldură prin poză AI OCR, etichete QR/NFC sau senzori radio LoRaWAN/M-Bus.'
      : 'Automated utility index ingestion for water, gas, power, and heating via AI photo OCR, physical QR tags, and LoRaWAN/M-Bus sensors.',
  };
}

export default function MetersPage({
  params,
}: {
  params: { lang: Language };
}) {
  const dict = getDictionary(params.lang);
  const lang = params.lang;
  const isRo = lang === 'ro';

  return (
    <div className="pt-32 pb-24 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-brand-500/20 text-xs font-semibold text-brand-300">
          <Zap className="w-3.5 h-3.5" />
          <span>Core C08</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight">
          {dict.metersSection.title}
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          {dict.metersSection.description}
        </p>
      </div>

      {/* 4 Ingestion Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dict.metersSection.features.map((feat, idx) => (
          <div key={idx} className="p-8 rounded-3xl glass-panel border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold">
              0{idx + 1}
            </div>
            <h3 className="text-xl font-bold text-white">{feat.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </div>

      {/* Riser Leak Detection Callout */}
      <div className="p-8 rounded-3xl bg-surface-100/90 border border-brand-500/30 space-y-4">
        <div className="flex items-center gap-2 text-brand-300 font-bold">
          <Cpu className="w-5 h-5" />
          <span>{isRo ? 'Algoritmul de Reconciliere Contor General vs. Apometre Individuale' : 'Main Bulk Meter vs. Submeter Reconciliation Algorithm'}</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          {isRo 
            ? 'Diferențele de apă dintre factura Apa Nova și consumurile declarate sunt adesea sursa celor mai mari certuri în bloc. CLADORA ajustează coeficienții pe baza sincronizării orelor de citire, a consumului comun al aspersoarelor/curățeniei și avertizează din timp asupra pierderilor ascunse pe coloana verticală.'
            : 'Water discrepancies between the municipal utility invoice and individual apartment declarations trigger intense resident friction. CLADORA dynamically adjusts synchronization variances and detects vertical riser leaks automatically.'}
        </p>
      </div>

    </div>
  );
}
