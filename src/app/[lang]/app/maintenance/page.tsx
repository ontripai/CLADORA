'use client';

import React, { useState } from 'react';
import { Language } from '@/types';
import { 
  Wrench, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldAlert,
  Calendar,
  Building
} from 'lucide-react';
import { useDemoStore } from '@/data/demoStore';

export default function MaintenancePage({ params }: { params: { lang: Language } }) {
  const { lang } = params;
  const { workOrders, addWorkOrder } = useDemoStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'PLUMBING' | 'ELECTRICAL' | 'ELEVATOR' | 'CLEANING'>('PLUMBING');
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_SAFETY'>('MEDIUM');
  const [unitOrArea, setUnitOrArea] = useState('Casa scării / Scara A');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    addWorkOrder({
      title,
      buildingName: 'Aviației 12B',
      unitOrArea,
      category,
      urgency,
      status: 'OPEN',
      assignedTo: 'Echipa Tehnică de Gardă',
      slaDeadline: '24 Ore'
    });
    setTitle('');
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            Nucleul C09 — Maintenance & Work Orders
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' ? 'Mentenanță, Tichete & Dispecerat' : 'Maintenance & Work Orders'}
          </h1>
          <p className="text-xs text-[#52667A]">
            Urmărire defecțiuni, SLA orar tehnicieni și devize conectate direct la contabilitate
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#0E9F8E] hover:bg-[#0C8778] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'ro' ? 'Deschide Tichet Nou' : 'Open Work Order'}</span>
        </button>
      </div>

      {/* Work Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workOrders.map((wo) => (
          <div key={wo.id} className="card-proptech p-5 bg-white space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    wo.urgency === 'HIGH' || wo.urgency === 'CRITICAL_SAFETY'
                      ? 'bg-[#FEE2E2] text-[#E5484D]'
                      : 'bg-[#EDF5FF] text-[#2F80ED]'
                  }`}>
                    {wo.urgency}
                  </span>
                  <span className="text-xs font-mono text-[#7B8A9A]">{wo.id}</span>
                </div>
                <h3 className="text-sm font-bold text-[#102A43] mt-1.5">{wo.title}</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FFF7E6] text-[#B45309]">
                {wo.status}
              </span>
            </div>

            <div className="text-xs text-[#52667A] space-y-1 pt-2 border-t border-[#F0F4F8]">
              <div>Locație: <strong>{wo.unitOrArea}</strong></div>
              <div>Alocat: <strong>{wo.assignedTo || 'Nealocat'}</strong></div>
              <div className="text-[11px] text-[#7B8A9A]">Creat: {wo.createdAt} · Termen SLA: {wo.slaDeadline}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-proptech p-6 sm:p-8 bg-white max-w-md w-full space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#102A43]">
                {lang === 'ro' ? 'Deschide Tichet Mentenanță' : 'Open Maintenance Order'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-xs font-bold text-[#7B8A9A]">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#102A43] mb-1">Titlu Problemă</label>
                <input
                  type="text"
                  required
                  placeholder="Ex. Țeavă spartă subsol Sc. B"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D3DCE6] text-[#102A43]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#102A43] mb-1">Locație / Zonă</label>
                <input
                  type="text"
                  value={unitOrArea}
                  onChange={(e) => setUnitOrArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D3DCE6] text-[#102A43]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#102A43] mb-1">Categorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D3DCE6] text-[#102A43]"
                  >
                    <option value="PLUMBING">Instalații Apă</option>
                    <option value="ELECTRICAL">Electric</option>
                    <option value="ELEVATOR">Ascensor</option>
                    <option value="CLEANING">Curățenie</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#102A43] mb-1">Urgență</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D3DCE6] text-[#102A43]"
                  >
                    <option value="LOW">Scăzută</option>
                    <option value="MEDIUM">Medie</option>
                    <option value="HIGH">Urgență Mare</option>
                    <option value="CRITICAL_SAFETY">Pericol Siguranță</option>
                  </select>
                </div>
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
                  Creează Tichet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
