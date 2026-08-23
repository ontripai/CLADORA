'use client';

import React, { useState } from 'react';
import { Language } from '@/types';
import { 
  Gauge, 
  Camera, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  UploadCloud 
} from 'lucide-react';
import { useDemoStore } from '@/data/demoStore';

export default function MetersPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;
  const { meterReadings, addMeterReading } = useDemoStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [unitInput, setUnitInput] = useState('Ap. 14');
  const [meterType, setMeterType] = useState<'COLD_WATER' | 'HOT_WATER'>('COLD_WATER');
  const [newIndex, setNewIndex] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndex) return;
    const num = parseFloat(newIndex);
    addMeterReading({
      unitNumber: unitInput,
      meterType: meterType,
      meterSerialNumber: `RO-MTR-${Date.now().toString().slice(-6)}`,
      previousIndex: 142.50,
      currentIndex: num,
      consumption: num - 142.50 > 0 ? num - 142.50 : 0,
      submissionMethod: 'PHOTO_OCR',
      validationStatus: num - 142.50 > 15 ? 'ANOMALY_FLAGGED' : 'VALIDATED'
    });
    setNewIndex('');
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            Nucleul C08 — Utilities & Meter Readings
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' ? 'Gestiune Contoare & Consum' : 'Utilities & Meter Readings'}
          </h1>
          <p className="text-xs text-[#52667A]">
            Transmitere index foto OCR, validare automată și detecție anomalii consum
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#0E9F8E] hover:bg-[#0C8778] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'ro' ? 'Adaugă Citire Index' : 'Add Meter Reading'}</span>
        </button>
      </div>

      {/* Meter Readings Table */}
      <div className="card-proptech bg-white overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F6F9FC] border-b border-[#E2E8F0] text-[#7B8A9A] font-bold uppercase text-[10px]">
              <th className="p-3.5">Apartament</th>
              <th className="p-3.5">Tip Contor & Serie</th>
              <th className="p-3.5">Index Precedent</th>
              <th className="p-3.5">Index Nou</th>
              <th className="p-3.5">Consum Rezultat</th>
              <th className="p-3.5">Metodă Citire</th>
              <th className="p-3.5 text-center">Status Validare</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F4F8]">
            {meterReadings.map((reading) => (
              <tr key={reading.id} className="hover:bg-[#F6F9FC]">
                <td className="p-3.5 font-bold text-[#102A43]">{reading.unitNumber}</td>
                <td className="p-3.5">
                  <div className="font-semibold text-[#102A43]">
                    {reading.meterType === 'COLD_WATER' ? 'Apă Rece' : 'Apă Caldă'}
                  </div>
                  <div className="text-[10px] text-[#7B8A9A] font-mono">{reading.meterSerialNumber}</div>
                </td>
                <td className="p-3.5 font-mono tabular-nums text-[#52667A]">{reading.previousIndex.toFixed(2)} m³</td>
                <td className="p-3.5 font-mono font-bold tabular-nums text-[#102A43]">{reading.currentIndex.toFixed(2)} m³</td>
                <td className="p-3.5 font-mono font-extrabold tabular-nums text-[#0E9F8E]">+{reading.consumption.toFixed(2)} m³</td>
                <td className="p-3.5 text-[#52667A]">{reading.submissionMethod}</td>
                <td className="p-3.5 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    reading.validationStatus === 'VALIDATED'
                      ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                      : 'bg-[#FEE2E2] text-[#E5484D] border border-[#FECACA]'
                  }`}>
                    {reading.validationStatus === 'VALIDATED' ? '✓ VALIDAT' : '⚠️ ANOMALIE'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Reading Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-proptech p-6 sm:p-8 bg-white max-w-md w-full space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#102A43]">
                {lang === 'ro' ? 'Adaugă Citire Index Contor' : 'Submit Meter Reading'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-xs font-bold text-[#7B8A9A]">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#102A43] mb-1">Apartament</label>
                <input
                  type="text"
                  value={unitInput}
                  onChange={(e) => setUnitInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D3DCE6] text-[#102A43]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#102A43] mb-1">Tip Contor</label>
                <select
                  value={meterType}
                  onChange={(e) => setMeterType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D3DCE6] text-[#102A43]"
                >
                  <option value="COLD_WATER">Apă Rece</option>
                  <option value="HOT_WATER">Apă Caldă</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#102A43] mb-1">Index Nou Citit (m³)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="148.20"
                  value={newIndex}
                  onChange={(e) => setNewIndex(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D3DCE6] text-[#102A43] font-mono text-sm font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#52667A]"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0E9F8E] text-white text-xs font-bold shadow-sm"
                >
                  Salvează Citirea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
