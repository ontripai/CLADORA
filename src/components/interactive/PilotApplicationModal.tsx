'use client';

import React, { useState } from 'react';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { Sparkles, CheckCircle2, Send, Building, ShieldCheck } from 'lucide-react';

interface PilotApplicationModalProps {
  lang: Language;
}

export const PilotApplicationModal: React.FC<PilotApplicationModalProps> = ({ lang }) => {
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

  return (
    <div className="p-8 rounded-3xl glass-panel border border-brand-500/30 shadow-2xl relative overflow-hidden">
      {submitted ? (
        <div className="text-center py-12 space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-glow-emerald">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-display font-bold text-white">
            {lang === 'ro' ? 'Cererea a fost înregistrată cu succes!' : 'Application Successfully Received!'}
          </h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            {fields.successMsg}
          </p>
          <div className="pt-4">
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white"
            >
              {lang === 'ro' ? 'Trimite o altă solicitare' : 'Submit another response'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>{formTitle}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">{fields.fullName} *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder={lang === 'ro' ? 'Ex: Ion Popescu' : 'e.g. John Doe'}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white focus:border-brand-400 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">{fields.email} *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@asociatie.ro"
                className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white focus:border-brand-400 focus:outline-none"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">{fields.phone} *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+40 7xx xxx xxx"
                className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white focus:border-brand-400 focus:outline-none"
              />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">{fields.role} *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white focus:border-brand-400 focus:outline-none"
              >
                <option value="admin">{fields.roles.admin}</option>
                <option value="president">{fields.roles.president}</option>
                <option value="cenzor">{fields.roles.cenzor}</option>
                <option value="owner">{fields.roles.owner}</option>
              </select>
            </div>

            {/* Units count */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">{fields.unitsCount} *</label>
              <input
                type="number"
                required
                value={formData.unitsCount}
                onChange={(e) => setFormData({ ...formData, unitsCount: e.target.value })}
                placeholder="60"
                className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white focus:border-brand-400 focus:outline-none"
              />
            </div>

            {/* Current Software */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">{fields.currentSoftware}</label>
              <input
                type="text"
                value={formData.currentSoftware}
                onChange={(e) => setFormData({ ...formData, currentSoftware: e.target.value })}
                placeholder="Xisoft, Aviziero, Excel, etc."
                className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/10 text-sm text-white focus:border-brand-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-500 via-teal-500 to-emerald-500 hover:from-brand-600 hover:to-emerald-600 shadow-glow-cyan flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{fields.submit}</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ro' ? 'Date protejate conform GDPR. Fără obligații contractuale.' : 'GDPR protected. Zero contractual obligation.'}</span>
          </div>
        </form>
      )}
    </div>
  );
};
