'use client';

import React, { useState } from 'react';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { Sparkles, CheckCircle2, Send, Building, ShieldCheck, X } from 'lucide-react';

interface PilotApplicationModalProps {
  lang: Language;
  isOpen?: boolean;
  onClose?: () => void;
}

export const PilotApplicationModal: React.FC<PilotApplicationModalProps> = ({ 
  lang, 
  isOpen = true, 
  onClose 
}) => {
  const dict = getDictionary(lang);
  const fields = dict.pilot.fields;
  const formTitle = dict.pilot.formTitle;

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'admin',
    buildingType: 'A1',
    unitsCount: '60',
    currentSoftware: 'Xisoft / BlocManager',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (!isOpen) return null;

  const content = (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D3DCE6] shadow-elevated relative overflow-hidden">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 rounded-xl text-[#7B8A9A] hover:bg-[#F0F4F8] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {submitted ? (
        <div className="text-center py-10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-display font-bold text-[#102A43]">
            {lang === 'ro' ? 'Cererea a fost înregistrată cu succes!' : 'Application Successfully Received!'}
          </h3>
          <p className="text-xs sm:text-sm text-[#52667A] max-w-md mx-auto">
            {fields.successMsg}
          </p>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#0E9F8E] text-white text-xs font-bold"
            >
              Închide
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#0E9F8E]" />
              <span>{lang === 'ro' ? 'Cohortă Pilot 2026' : 'Pilot Cohort 2026'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-display font-extrabold text-[#102A43]">
              {formTitle}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modalFullName" className="block text-xs font-bold text-[#102A43] mb-1">
                {fields.fullName} <span className="text-[#E5484D]">*</span>
              </label>
              <input
                type="text"
                id="modalFullName"
                name="fullName"
                autoComplete="name"
                required
                placeholder="Ex. Ing. Mihai Popescu"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D3DCE6] text-xs text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]"
              />
            </div>

            <div>
              <label htmlFor="modalEmail" className="block text-xs font-bold text-[#102A43] mb-1">
                {fields.email} <span className="text-[#E5484D]">*</span>
              </label>
              <input
                type="email"
                id="modalEmail"
                name="email"
                autoComplete="email"
                required
                placeholder="mihai.popescu@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D3DCE6] text-xs text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modalPhone" className="block text-xs font-bold text-[#102A43] mb-1">
                {fields.phone} <span className="text-[#E5484D]">*</span>
              </label>
              <input
                type="tel"
                id="modalPhone"
                name="phone"
                autoComplete="tel"
                required
                placeholder="07xxxxxxxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D3DCE6] text-xs text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]"
              />
            </div>

            <div>
              <label htmlFor="modalRole" className="block text-xs font-bold text-[#102A43] mb-1">
                {fields.role}
              </label>
              <select
                id="modalRole"
                name="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D3DCE6] text-xs text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]"
              >
                <option value="admin">{fields.roles.admin}</option>
                <option value="president">{fields.roles.president}</option>
                <option value="cenzor">{fields.roles.cenzor}</option>
                <option value="owner">{fields.roles.owner}</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0] flex items-center gap-3 text-xs text-[#52667A]">
            <ShieldCheck className="w-4 h-4 text-[#0E9F8E] shrink-0" />
            <span>{lang === 'ro' ? 'Datele transmise sunt strict confidențiale conform GDPR și sunt utilizate exclusiv pentru configurarea instanței pilot.' : 'Data is protected under GDPR and strictly used for onboarding your pilot instance.'}</span>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-xs font-extrabold bg-[#0E9F8E] hover:bg-[#0C8778] text-white shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{fields.submit}</span>
          </button>
        </form>
      )}
    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
