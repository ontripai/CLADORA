import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { 
  KeyRound, 
  CheckCircle2, 
  Receipt, 
  Camera, 
  Wrench, 
  ShieldCheck, 
  ArrowRight,
  EyeOff
} from 'lucide-react';

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }];
}

export default function TenantsSolutionPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;

  return (
    <main className="min-h-screen pt-32 pb-24 bg-[#F6F9FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-[#52667A] mb-8 font-medium">
          <Link href={`/${lang}`} className="hover:text-[#102A43]">
            {lang === 'ro' ? 'Acasă' : 'Home'}
          </Link>
          <span>/</span>
          <span className="text-[#52667A]">{lang === 'ro' ? 'Soluții' : 'Solutions'}</span>
          <span>/</span>
          <span className="text-[#102A43] font-bold">
            {lang === 'ro' ? 'Chiriași' : 'Tenants'}
          </span>
        </div>

        {/* Hero */}
        <div className="card-proptech p-8 sm:p-12 bg-white border-[#D3DCE6] space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF8F5] text-xs font-bold text-[#0A6E62]">
            <KeyRound className="w-4 h-4 text-[#0E9F8E]" />
            <span>CLADORA Tenant Portal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-[#102A43] tracking-tight max-w-3xl">
            {lang === 'ro'
              ? 'Plătești doar ce consumi, transmiți indexul și raportezi reparațiile direct'
              : 'Pay Only What You Consume, Submit Meters & Report Repairs Directly'}
          </h1>

          <p className="text-base sm:text-lg text-[#52667A] max-w-3xl leading-relaxed">
            {lang === 'ro'
              ? 'Fără calcule complicate pe șervețel la sfârșit de lună. CLADORA separă automat cheltuielile operaționale de consum de fondurile de capital ale proprietarului.'
              : 'Zero confusing napkin calculations with your landlord. CLADORA isolates day-to-day consumption costs from owner-specific capital funds.'}
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              href={`/${lang}/demo`}
              className="px-6 py-3.5 rounded-xl bg-[#0E9F8E] hover:bg-[#0C8778] text-white text-xs font-bold shadow-sm transition-all"
            >
              {lang === 'ro' ? 'Vezi portalul chiriașului' : 'Launch tenant demo'}
            </Link>
          </div>
        </div>

        {/* Feature Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="card-proptech p-6 bg-white space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF8F5] text-[#0E9F8E] flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#102A43]">
              {lang === 'ro' ? 'Doar Cheltuieli de Consum' : 'Pure Consumption Costs'}
            </h2>
            <p className="text-xs text-[#52667A] leading-relaxed">
              {lang === 'ro' ? 'Vezi doar apa rece/caldă, încălzirea și salubrizarea pe care le utilizezi efectiv.' : 'Clear view of individual water, heating, and trash without owner capital contributions.'}
            </p>
          </div>

          <div className="card-proptech p-6 bg-white space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EDF5FF] text-[#2F80ED] flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#102A43]">
              {lang === 'ro' ? 'Tichete Directe de Reparații' : 'Direct Repair Requests'}
            </h2>
            <p className="text-xs text-[#52667A] leading-relaxed">
              {lang === 'ro' ? 'Dacă o țeavă picură sau liftul e blocat, deschizi tichet direct către administrație și proprietar.' : 'Directly dispatch maintenance tickets with photos to building teams and your landlord.'}
            </p>
          </div>

          <div className="card-proptech p-6 bg-white space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF7E6] text-[#D99B26] flex items-center justify-center">
              <EyeOff className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#102A43]">
              {lang === 'ro' ? 'Confidențialitate & Respect' : 'Privacy Protection'}
            </h2>
            <p className="text-xs text-[#52667A] leading-relaxed">
              {lang === 'ro' ? 'Datele tale de contact și plățile sunt protejate și accesibile doar entităților autorizate.' : 'Your personal data is isolated under strict GDPR protection boundaries.'}
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
