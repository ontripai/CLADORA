import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { 
  Building2, 
  CheckCircle2, 
  Scale, 
  FileSpreadsheet, 
  Users, 
  ShieldCheck, 
  ArrowRight,
  Vote,
  Receipt,
  FileCheck2
} from 'lucide-react';

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}

export default function AssociationsSolutionPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;

  const painPoints = [
    lang === 'ro' ? 'Dispute nesfârșite la afișarea listei de plată din cauza formulelor opace' : 'Recurring disputes over monthly payment lists due to obscure Excel formulas',
    lang === 'ro' ? 'Balanțe contabile neînchise și reconcilieri bancare amânate de la o lună la alta' : 'Unbalanced ledgers and delayed bank reconciliations accumulating arrears',
    lang === 'ro' ? 'Dificultăți în colectarea indexului de apă și erori repetate de citire manuală' : 'Manual door-to-door water meter reading friction and typo errors',
    lang === 'ro' ? 'Lipsa de transparență care duce la neîncredere între locatari, președinte și administrator' : 'Erosion of trust between owners, board members, and building administrators'
  ];

  const outcomes = [
    lang === 'ro' ? 'Închidere de lună în 2 ore în loc de 3 zile prin reconciliere bancară automată' : 'Month-end closing reduced to under 2 hours with automated bank statement matching',
    lang === 'ro' ? 'Fiecare sumă are fișă justificativă cu acces la factura furnizorului' : 'Every charge line has an explainable proof card linking to the supplier invoice',
    lang === 'ro' ? 'Pachet complet de audit pregătit pentru cenzor la un singur click' : 'One-click statutory audit packages for censors and auditors',
    lang === 'ro' ? 'Convocare și vot adunare generală cu calcul automat al cvorumului' : 'Streamlined AGM convening with automated legal quorum calculation'
  ];

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
            {lang === 'ro' ? 'Asociații de Proprietari' : 'Homeowner Associations'}
          </span>
        </div>

        {/* Hero Banner */}
        <div className="card-proptech p-8 sm:p-12 bg-white border-[#D3DCE6] space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF8F5] text-xs font-bold text-[#0A6E62]">
            <Building2 className="w-4 h-4 text-[#0E9F8E]" />
            <span>CLADORA Association OS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-[#102A43] tracking-tight max-w-3xl">
            {lang === 'ro'
              ? 'Administrare transparentă, contabilitate impecabilă și armonie în bloc'
              : 'Transparent Administration, Flawless Accounting & Condo Harmony'}
          </h1>

          <p className="text-base sm:text-lg text-[#52667A] max-w-3xl leading-relaxed">
            {lang === 'ro'
              ? 'Conceput special pentru asociațiile de proprietari din România, conform Legii 196/2018. Oferă președintelui, administratorului, cenzorului și proprietarilor o singură sursă de adevăr financiar.'
              : 'Engineered specifically for Romanian homeowner associations under Law 196/2018. Connects administrators, board presidents, auditors, and residents on one single source of truth.'}
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              href={`/${lang}/demo`}
              className="px-6 py-3.5 rounded-xl bg-[#0E9F8E] hover:bg-[#0C8778] text-white text-xs font-bold shadow-sm transition-all"
            >
              {lang === 'ro' ? 'Vezi demo ca administrator' : 'Launch demo as administrator'}
            </Link>
            <Link
              href={`/${lang}/pilot`}
              className="px-6 py-3.5 rounded-xl bg-[#F0F4F8] hover:bg-[#E2E8F0] text-[#102A43] text-xs font-bold transition-all"
            >
              {lang === 'ro' ? 'Înscrie asociația în pilot' : 'Apply for association pilot'}
            </Link>
          </div>
        </div>

        {/* Pain Points vs Outcomes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          
          <div className="card-proptech p-6 sm:p-8 bg-white border-l-4 border-l-[#E5484D] space-y-4">
            <h2 className="text-lg font-bold text-[#102A43]">
              {lang === 'ro' ? 'Provocările Administrării Clasice' : 'Challenges in Legacy Administration'}
            </h2>
            <ul className="space-y-3 text-xs text-[#52667A]">
              {painPoints.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-[#E5484D] font-bold">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-proptech p-6 sm:p-8 bg-white border-l-4 border-l-[#10B981] space-y-4">
            <h2 className="text-lg font-bold text-[#102A43]">
              {lang === 'ro' ? 'Cum Rezolvă CLADORA' : 'How CLADORA Solves It'}
            </h2>
            <ul className="space-y-3 text-xs text-[#52667A]">
              {outcomes.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span className="text-[#102A43] font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </main>
  );
}
