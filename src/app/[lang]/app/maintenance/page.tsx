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
import { getStatusLabel } from '@/config/statuses';
import { getActionLabel } from '@/config/actions';

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
      assignedTo: lang === 'ro' ? 'Echipa Tehnică de Gardă' : lang === 'fa' ? 'تیم فنی شیفت' : 'On-Duty Tech Team',
      slaDeadline: lang === 'ro' ? '24 Ore' : lang === 'fa' ? '۲۴ ساعت' : '24 Hours'
    });
    setTitle('');
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            {lang === 'ro' 
              ? 'Nucleul C09 — Mentenanță & Tichete de Lucru' 
              : lang === 'fa' 
              ? 'هسته C09 — مدیریت نگهداری، تیکت‌های فنی و دیسپچینگ' 
              : 'Core C09 — Maintenance & Work Orders'}
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' ? 'Mentenanță, Tichete & Dispecerat' : lang === 'fa' ? 'مرکز درخواست‌های تعمیرات و نگهداری' : 'Maintenance & Work Orders'}
          </h1>
          <p className="text-xs text-[#52667A]">
            {lang === 'ro' 
              ? 'Urmărire defecțiuni, SLA orar tehnicieni și devize conectate direct la contabilitate' 
              : lang === 'fa' 
              ? 'پایش حوادث، کنترل مهلت SLA تکنسین‌ها و اتصال فاکتورهای تعمیرات به دفتر کل حسابداری' 
              : 'Issue tracking, contractor hourly SLAs, and expense ledger connectivity'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#0E9F8E] hover:bg-[#0C8778] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'ro' ? 'Deschide Tichet Nou' : lang === 'fa' ? 'ثبت درخواست جدید' : 'Open Work Order'}</span>
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
                    {wo.urgency === 'HIGH' || wo.urgency === 'CRITICAL_SAFETY'
                      ? (lang === 'fa' ? 'فوری' : wo.urgency)
                      : (lang === 'fa' ? 'عادی' : wo.urgency)}
                  </span>
                  <span className="text-xs font-mono text-[#7B8A9A] ltr-isolate">{wo.id}</span>
                </div>
                <h3 className="text-sm font-bold text-[#102A43] mt-1.5">{wo.title}</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FFF7E6] text-[#B45309]">
                {wo.status === 'OPEN' 
                  ? getStatusLabel('open', lang)
                  : wo.status === 'IN_PROGRESS' 
                  ? getStatusLabel('in_progress', lang) 
                  : getStatusLabel('completed', lang)}
              </span>
            </div>

            <div className="text-xs text-[#52667A] space-y-1 pt-2 border-t border-[#F0F4F8]">
              <div>{lang === 'ro' ? 'Locație:' : lang === 'fa' ? 'محل خرابی:' : 'Location:'} <strong>{wo.unitOrArea}</strong></div>
              <div>{lang === 'ro' ? 'Alocat:' : lang === 'fa' ? 'تکنسین مسئول:' : 'Assigned to:'} <strong>{wo.assignedTo || (lang === 'fa' ? 'تخصیص‌نیافته' : 'Unassigned')}</strong></div>
              <div className="text-[11px] text-[#7B8A9A]">
                {lang === 'ro' ? 'Creat:' : lang === 'fa' ? 'زمان ثبت:' : 'Created:'} <span className="ltr-isolate">{wo.createdAt}</span> · SLA: <span className="ltr-isolate">{wo.slaDeadline}</span>
              </div>
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
                {lang === 'ro' ? 'Deschide Tichet Mentenanță' : lang === 'fa' ? 'ثبت درخواست تعمیرات و نگهداری' : 'Open Maintenance Order'}
              </h3>
              <button 
                type="button"
                onClick={() => setModalOpen(false)} 
                className="text-xs font-bold text-[#7B8A9A] p-1"
                aria-label={getActionLabel('close', lang)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#102A43] mb-1">
                  {lang === 'ro' ? 'Titlu Problemă' : lang === 'fa' ? 'عنوان و شرح خلاصه خرابی' : 'Issue Summary'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ro' ? 'Ex. Țeavă spartă subsol Sc. B' : lang === 'fa' ? 'مثال: نشتی لوله آب در پارکینگ منفی یک' : 'E.g. Leaking pipe in basement'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D3DCE6] text-[#102A43]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#102A43] mb-1">
                  {lang === 'ro' ? 'Locație / Zonă' : lang === 'fa' ? 'محل وقوع' : 'Location / Area'}
                </label>
                <input
                  type="text"
                  value={unitOrArea}
                  onChange={(e) => setUnitOrArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D3DCE6] text-[#102A43]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#102A43] mb-1">
                    {lang === 'ro' ? 'Categorie' : lang === 'fa' ? 'دسته‌بندی' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D3DCE6] text-[#102A43]"
                  >
                    <option value="PLUMBING">{lang === 'ro' ? 'Instalații Sanitare / Apă' : lang === 'fa' ? 'تأسیسات آب و لوله‌کشی' : 'Plumbing'}</option>
                    <option value="ELECTRICAL">{lang === 'ro' ? 'Instalații Electrice' : lang === 'fa' ? 'تأسیسات برقی و روشنایی' : 'Electrical'}</option>
                    <option value="ELEVATOR">{lang === 'ro' ? 'Ascensor / Lift' : lang === 'fa' ? 'آسانسور و بالابر' : 'Elevator'}</option>
                    <option value="CLEANING">{lang === 'ro' ? 'Curățenie & Menaj' : lang === 'fa' ? 'نظافت و خدمات عمومی' : 'Cleaning'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#102A43] mb-1">
                    {lang === 'ro' ? 'Urgență' : lang === 'fa' ? 'درجه اولویت' : 'Urgency'}
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D3DCE6] text-[#102A43]"
                  >
                    <option value="LOW">{lang === 'ro' ? 'Scăzută' : lang === 'fa' ? 'پایین' : 'Low'}</option>
                    <option value="MEDIUM">{lang === 'ro' ? 'Medie' : lang === 'fa' ? 'متوسط' : 'Medium'}</option>
                    <option value="HIGH">{lang === 'ro' ? 'Ridicată' : lang === 'fa' ? 'فوری / بالا' : 'High'}</option>
                    <option value="CRITICAL_SAFETY">{lang === 'ro' ? 'Critică (Siguranță)' : lang === 'fa' ? 'بحرانی (ایمنی)' : 'Critical'}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#52667A] hover:bg-[#F0F4F8]"
                >
                  {getActionLabel('cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0E9F8E] text-white text-xs font-bold shadow-sm hover:bg-[#0C8778]"
                >
                  {getActionLabel('createTicket', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
