'use client';

import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileSpreadsheet, 
  Receipt, 
  Gauge, 
  Wrench, 
  TrendingUp, 
  Vote, 
  ShieldCheck, 
  ArrowRight,
  DollarSign,
  FileCheck2,
  Calendar,
  Users
} from 'lucide-react';
import { useDemoStore } from '@/data/demoStore';

export default function DashboardPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;
  const { 
    activeRole, 
    context, 
    monthCloseState, 
    workOrders, 
    meterReadings, 
    portfolioProperties,
    chargeBreakdown
  } = useDemoStore();

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            <span>{context.associationName}</span>
            <span>·</span>
            <span>Perioadă Contabilă: {context.accountingPeriod}</span>
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {activeRole === 'association_admin' && (lang === 'ro' ? 'Panou de Control Administrator' : 'Administrator Control Center')}
            {activeRole === 'president' && (lang === 'ro' ? 'Panou Președinte de Asociație' : 'President Governance Board')}
            {activeRole === 'censor' && (lang === 'ro' ? 'Panou Cenzor & Audit Financiar' : 'Censor & Audit Workspace')}
            {activeRole === 'owner' && (lang === 'ro' ? 'Panoul Meu de Proprietar (Ap. 14)' : 'Owner Portal (Unit 14)')}
            {activeRole === 'tenant_resident' && (lang === 'ro' ? 'Portal Chiriaș & Consum' : 'Tenant Living & Consumption')}
            {activeRole === 'portfolio_owner' && (lang === 'ro' ? 'Consolă Portofoliu Imobiliar (4 Proprietăți)' : 'Portfolio Console (4 Properties)')}
            {activeRole === 'property_manager' && (lang === 'ro' ? 'Dispecerat Manager Pro (8 Asociații)' : 'Manager Pro Dispatch (8 Associations)')}
            {activeRole === 'platform_admin' && (lang === 'ro' ? 'Consolă Administrator Sistem CLADORA' : 'Platform System Administration')}
          </h1>
        </div>

        {/* Quick Action */}
        {activeRole === 'association_admin' && (
          <Link
            href={`/${lang}/app/accounting/month-close`}
            className="px-5 py-2.5 rounded-xl bg-[#0E9F8E] hover:bg-[#0C8778] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{lang === 'ro' ? 'Continuă Închiderea Lunară' : 'Resume Month-Close'}</span>
          </Link>
        )}
        {activeRole === 'owner' && (
          <Link
            href={`/${lang}/app/meters`}
            className="px-5 py-2.5 rounded-xl bg-[#0E9F8E] hover:bg-[#0C8778] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Gauge className="w-4 h-4" />
            <span>{lang === 'ro' ? 'Transmite Index Contoare' : 'Submit Meter Index'}</span>
          </Link>
        )}
      </div>

      {/* DASHBOARD 1: ASSOCIATION ADMINISTRATOR */}
      {activeRole === 'association_admin' && (
        <div className="space-y-6">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wide">Status Închidere Lună</div>
              <div className="text-xl font-display font-extrabold text-[#D97706] mt-1">
                {monthCloseState.status === 'SEALED' ? 'Sigilat (Închis)' : 'În Validare (3/5 Pași)'}
              </div>
              <div className="text-[11px] text-[#52667A]">Termen afișare: 28 Octombrie</div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wide">Sold Cont Curent BCR</div>
              <div className="text-xl font-display font-extrabold text-[#102A43] tabular-nums mt-1">
                34.820,40 RON
              </div>
              <div className="text-[11px] text-[#059669]">✓ Reconciliat cu extras bancar</div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wide">Index Contoare Transmise</div>
              <div className="text-xl font-display font-extrabold text-[#0E9F8E] tabular-nums mt-1">
                116 / 120 (97%)
              </div>
              <div className="text-[11px] text-[#D97706]">4 apartamente necesită estimare</div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wide">Tichete Mentenanță Deschise</div>
              <div className="text-xl font-display font-extrabold text-[#E5484D] mt-1">
                {workOrders.filter(w => w.status !== 'COMPLETED').length} Active
              </div>
              <div className="text-[11px] text-[#52667A]">1 urgență coloană Scara B</div>
            </div>
          </div>

          {/* Operational Modules Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Checklist & Invoices */}
            <div className="lg:col-span-7 card-proptech p-6 bg-white space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h3 className="text-sm font-bold text-[#102A43]">
                  {lang === 'ro' ? 'Pași Închidere Lunară Octombrie' : 'Month-End Closing Progress'}
                </h3>
                <Link href={`/${lang}/app/accounting/month-close`} className="text-xs font-bold text-[#0E9F8E] hover:underline">
                  {lang === 'ro' ? 'Deschide asistentul de închidere →' : 'Open closing stepper →'}
                </Link>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                    <span className="font-bold text-[#059669]">1. Facturi Furnizori Înregistrate (Engie, Apa Nova, Enel)</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#059669]">FINALIZAT</span>
                </div>

                <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                    <span className="font-bold text-[#059669]">2. Perioadă Citire Contoare Închisă (116 foto OCR)</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#059669]">FINALIZAT</span>
                </div>

                <div className="p-3 rounded-xl bg-[#FFF7E6] border border-[#FDE68A] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#D97706]" />
                    <span className="font-bold text-[#92400E]">3. Generare Cote & Verificare Discrepanțe CPI</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#B45309]">ÎN CURS</span>
                </div>

                <div className="p-3 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0] flex items-center justify-between opacity-70">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-[#7B8A9A] flex items-center justify-center text-[9px]">4</span>
                    <span className="font-medium text-[#52667A]">4. Avizare Cenzor & Tipărire Liste de Plată</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#7B8A9A]">AȘTEPTARE</span>
                </div>
              </div>
            </div>

            {/* Right: Urgent Maintenance Tickets */}
            <div className="lg:col-span-5 card-proptech p-6 bg-white space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h3 className="text-sm font-bold text-[#102A43]">
                  {lang === 'ro' ? 'Tichete Mentenanță & Urgențe' : 'Maintenance Dispatch'}
                </h3>
                <Link href={`/${lang}/app/maintenance`} className="text-xs font-bold text-[#0E9F8E] hover:underline">
                  {lang === 'ro' ? 'Toate tichetele' : 'View all'}
                </Link>
              </div>

              <div className="space-y-3">
                {workOrders.map((wo) => (
                  <div key={wo.id} className="p-3 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#102A43] truncate max-w-[200px]">{wo.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFF7E6] text-[#B45309]">
                        {wo.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#52667A]">
                      {wo.unitOrArea} · SLA: {wo.slaDeadline}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* DASHBOARD 2: OWNER (RESIDENT) */}
      {activeRole === 'owner' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">Sumă Totală Datorată (Octombrie)</div>
              <div className="text-2xl font-display font-extrabold text-[#102A43] tabular-nums mt-1">
                241,77 RON
              </div>
              <div className="text-[11px] text-[#D97706]">Scadență: 15 Noiembrie 2026</div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">Index Contor Apă Rece</div>
              <div className="text-2xl font-display font-extrabold text-[#059669] tabular-nums mt-1">
                148.20 m³
              </div>
              <div className="text-[11px] text-[#059669]">✓ Transmis & Validat Foto OCR</div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">Voturi Active Adunare Generală</div>
              <div className="text-2xl font-display font-extrabold text-[#2F80ED] mt-1">
                1 Vot Deschis
              </div>
              <div className="text-[11px] text-[#52667A]">Reabilitare termică fațadă</div>
            </div>
          </div>

          <div className="card-proptech p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-[#102A43]">
              {lang === 'ro' ? 'Descompunerea Notei Tale de Plată (Ap. 14)' : 'Breakdown of Your Monthly Statement'}
            </h3>
            <div className="space-y-2">
              {chargeBreakdown.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#102A43]">{item.expenseCategory}</div>
                    <div className="text-[#7B8A9A] font-mono text-[10px]">{item.supplierInvoiceRef} · Metodă: {item.allocationMethod}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#102A43] tabular-nums">{item.calculatedAmount.toFixed(2)} RON</div>
                    <div className="text-[10px] text-[#0A6E62]">Responsabil: {item.operationalPayer}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD 3: TENANT */}
      {activeRole === 'tenant_resident' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card-proptech p-5 bg-white space-y-1 border-l-4 border-l-[#0E9F8E]">
              <div className="text-xs font-bold text-[#7B8A9A]">Consum Operațional Lunar de Achitat</div>
              <div className="text-2xl font-display font-extrabold text-[#102A43] tabular-nums mt-1">
                179,27 RON
              </div>
              <div className="text-[11px] text-[#52667A]">Apă, încălzire, salubrizare, lift</div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">Confidențialitate Fonduri Proprietar</div>
              <div className="text-sm font-bold text-[#059669] mt-2">
                ✓ Fondul de reparații este alocat direct proprietarului
              </div>
              <div className="text-[11px] text-[#7B8A9A]">Conform contractului de închiriere</div>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD 4: PORTFOLIO OWNER */}
      {activeRole === 'portfolio_owner' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">Total Chirii Încasate Octombrie</div>
              <div className="text-2xl font-display font-extrabold text-[#10B981] tabular-nums mt-1">
                3.180 EUR
              </div>
              <div className="text-[11px] text-[#059669]">✓ 4/4 Proprietăți încasate</div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">Randament Mediu Net</div>
              <div className="text-2xl font-display font-extrabold text-[#2F80ED] tabular-nums mt-1">
                6.8% / an
              </div>
              <div className="text-[11px] text-[#52667A]">Deducere fonduri & taxe inclusă</div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">Garanții Depozitate</div>
              <div className="text-2xl font-display font-extrabold text-[#102A43] tabular-nums mt-1">
                5.400 EUR
              </div>
              <div className="text-[11px] text-[#52667A]">În conturi bancare separate</div>
            </div>
          </div>

          <div className="card-proptech p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-[#102A43]">Proprietățile Tale Active</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolioProperties.map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0] space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF8F5] text-[#0A6E62]">{p.unit}</span>
                      <h4 className="text-sm font-bold text-[#102A43] mt-1">{p.address}</h4>
                    </div>
                    <span className="text-sm font-extrabold text-[#0E9F8E] tabular-nums">{p.monthlyRent} {p.currency}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#52667A] pt-2 border-t border-[#E2E8F0]">
                    <span>Chiriaș: {p.tenantName || 'Vacant'}</span>
                    <span className="font-bold text-[#2F80ED]">Yield: {p.netYieldPercent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD 5: CENSOR */}
      {activeRole === 'censor' && (
        <div className="space-y-6">
          <div className="card-proptech p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-[#102A43]">Pachet de Audit Financiar & Balanță</h3>
            <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between text-xs text-[#059669]">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck className="w-5 h-5" />
                <span>Balanța pe luna Septembrie 2026 este echilibrată: Debit (18.420,50) = Credit (18.420,50)</span>
              </div>
              <span className="px-3 py-1 rounded bg-[#059669] text-white text-[10px] font-bold">VALIDAT</span>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD 6: PROPERTY MANAGER */}
      {activeRole === 'property_manager' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">Total Asociații Gestionate</div>
              <div className="text-2xl font-display font-extrabold text-[#102A43] mt-1">8 Asociații</div>
              <div className="text-[11px] text-[#52667A]">680 unități totale</div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">Închidere Lună Centralizată</div>
              <div className="text-2xl font-display font-extrabold text-[#0E9F8E] mt-1">7 / 8 Închise</div>
              <div className="text-[11px] text-[#059669]">1 asociație în validare</div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-1">
              <div className="text-xs font-bold text-[#7B8A9A]">Performanță SLA Echipă</div>
              <div className="text-2xl font-display font-extrabold text-[#10B981] mt-1">98.4%</div>
              <div className="text-[11px] text-[#059669]">Timp mediu răspuns: 1.8h</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
