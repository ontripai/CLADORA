'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Lock, 
  ShieldAlert, 
  ArrowRight,
  FileCheck2,
  FileSpreadsheet
} from 'lucide-react';
import { useDemoStore } from '@/data/demoStore';

export default function MonthClosePage({ params }: { params: { lang: Language } }) {
  const { lang } = params;
  const { monthCloseState, updateMonthCloseChecklist, sealMonthClose } = useDemoStore();

  const [sealModalOpen, setSealModalOpen] = useState(false);

  const canSeal = 
    monthCloseState.checklist.invoicesEntered &&
    monthCloseState.checklist.metersClosed &&
    monthCloseState.checklist.bankReconciled &&
    monthCloseState.checklist.allocationsGenerated;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            Nucleul C01 — Month-End Closing Engine
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' ? 'Asistent Închidere Lunară Contabilă' : 'Month-End Close Stepper'}
          </h1>
          <p className="text-xs text-[#52667A]">
            Perioadă: <strong className="text-[#102A43]">{monthCloseState.period}</strong> · Status: {monthCloseState.status}
          </p>
        </div>

        {monthCloseState.status === 'SEALED' ? (
          <div className="px-4 py-2 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-bold text-[#059669] flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>{lang === 'ro' ? 'Lună Sigilată Contabil' : 'Month Accounting Sealed'}</span>
          </div>
        ) : (
          <button
            type="button"
            disabled={!canSeal}
            onClick={() => setSealModalOpen(true)}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              canSeal
                ? 'bg-[#E5484D] hover:bg-[#DC2626] text-white shadow-md'
                : 'bg-[#E2E8F0] text-[#7B8A9A] cursor-not-allowed'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{lang === 'ro' ? 'Sigilează Luna Contabilă' : 'Seal Accounting Month'}</span>
          </button>
        )}
      </div>

      {/* Stepper Checklist */}
      <div className="card-proptech p-6 sm:p-8 bg-white space-y-6">
        <h3 className="text-base font-bold text-[#102A43]">
          {lang === 'ro' ? 'Verificare Puncte Cheie Înainte de Sigilare' : 'Pre-Closing Verification Checklist'}
        </h3>

        <div className="space-y-4 text-xs">
          
          {/* Step 1 */}
          <div className="p-4 rounded-xl border flex items-center justify-between bg-[#F6F9FC] border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="chk-invoices"
                checked={monthCloseState.checklist.invoicesEntered}
                onChange={(e) => updateMonthCloseChecklist('invoicesEntered', e.target.checked)}
                className="w-4 h-4 text-[#0E9F8E] rounded"
              />
              <div>
                <label htmlFor="chk-invoices" className="font-bold text-[#102A43] cursor-pointer">
                  1. Înregistrare Facturi Furnizori Utilități (Apă, Gaze, Energie, Salubrizare)
                </label>
                <div className="text-[11px] text-[#52667A]">3 facturi înregistrate în valoare de 13.670,50 RON</div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#059669]">✓ VERIFICAT</span>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl border flex items-center justify-between bg-[#F6F9FC] border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="chk-meters"
                checked={monthCloseState.checklist.metersClosed}
                onChange={(e) => updateMonthCloseChecklist('metersClosed', e.target.checked)}
                className="w-4 h-4 text-[#0E9F8E] rounded"
              />
              <div>
                <label htmlFor="chk-meters" className="font-bold text-[#102A43] cursor-pointer">
                  2. Închidere Perioadă Citire Contoare & Estimare Apartamente Lipsă
                </label>
                <div className="text-[11px] text-[#52667A]">116 citiri validate prin foto OCR, 4 estimate conform mediei</div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#059669]">✓ VERIFICAT</span>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl border flex items-center justify-between bg-[#F6F9FC] border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="chk-bank"
                checked={monthCloseState.checklist.bankReconciled}
                onChange={(e) => updateMonthCloseChecklist('bankReconciled', e.target.checked)}
                className="w-4 h-4 text-[#0E9F8E] rounded"
              />
              <div>
                <label htmlFor="chk-bank" className="font-bold text-[#102A43] cursor-pointer">
                  3. Reconciliere Sold Extras de Cont Bancar BCR
                </label>
                <div className="text-[11px] text-[#52667A]">Sold registru casă & bancă = 34.820,40 RON (Discrepanță: 0,00 RON)</div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#059669]">✓ VERIFICAT</span>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl border flex items-center justify-between bg-[#F6F9FC] border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="chk-alloc"
                checked={monthCloseState.checklist.allocationsGenerated}
                onChange={(e) => updateMonthCloseChecklist('allocationsGenerated', e.target.checked)}
                className="w-4 h-4 text-[#0E9F8E] rounded"
              />
              <div>
                <label htmlFor="chk-alloc" className="font-bold text-[#102A43] cursor-pointer">
                  4. Generare Cote de Întreținere pe Apartamente (CPI & Persoane)
                </label>
                <div className="text-[11px] text-[#52667A]">Calculul listei de plată este gata pentru afișare</div>
              </div>
            </div>
            <span className={`text-[10px] font-bold ${monthCloseState.checklist.allocationsGenerated ? 'text-[#059669]' : 'text-[#D97706]'}`}>
              {monthCloseState.checklist.allocationsGenerated ? '✓ GENERAT' : 'AȘTEPTARE BIFĂ'}
            </span>
          </div>

        </div>

        {/* High Risk Confirmation Modal */}
        {sealModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="card-proptech p-6 sm:p-8 bg-white max-w-md w-full space-y-4 shadow-elevated border-t-4 border-t-[#E5484D]">
              <div className="flex items-center gap-3 text-[#E5484D]">
                <ShieldAlert className="w-6 h-6" />
                <h3 className="text-base font-bold text-[#102A43]">
                  {lang === 'ro' ? 'Confirmare Sigilare Lună Contabilă' : 'Confirm Month Sealing'}
                </h3>
              </div>

              <p className="text-xs text-[#52667A] leading-relaxed">
                {lang === 'ro'
                  ? 'După sigilare, jurnalele contabile ale lunii Octombrie 2026 devin imutabile. Orice corecție ulterioară se va putea efectua exclusiv prin notă de stornare în luna următoare.'
                  : 'Once sealed, October 2026 ledgers become immutable. Any corrections will require an auditable reversing entry in the subsequent period.'}
              </p>

              <div className="p-3 rounded-xl bg-[#FFF7E6] text-xs text-[#B45309]">
                ℹ️ În modul demo, această acțiune actualizează starea locală a sandbox-ului.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSealModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#52667A] hover:bg-[#F0F4F8]"
                >
                  Anulează
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sealMonthClose();
                    setSealModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#E5484D] text-white text-xs font-bold shadow-sm hover:bg-[#DC2626]"
                >
                  Confirmă & Sigilează
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
