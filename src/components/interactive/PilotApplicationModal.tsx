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
          <p className="text-sm text-slate-200 max-w-md mx-auto">
            {fields.successMsg}
          </p>
          <div className="pt-4">
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2 rounded-xl text-xs font-semibold bg-white/15 hover:bg-white/20 text-white"
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
              <label htmlFor="pilotFullName" className="text-xs font-semibold text-slate-200">{fields.fullName} *</label>
              <input
                id="pilotFullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                aria-label={fields.fullName}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder={lang === 'ro' ? 'Ex: Ion Popescu' : 'e.g. John Doe'}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/15 text-sm text-white focus:border-brand-400 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="pilotEmail" className="text-xs font-semibold text-slate-200">{fields.email} *</label>
              <input
                id="pilotEmail"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-label={fields.email}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@asociatie.ro"
                className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/15 text-sm text-white focus:border-brand-400 focus:outline-none"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label htmlFor="pilotPhone" className="text-xs font-semibold text-slate-200">{fields.phone} *</label>
              <input
                id="pilotPhone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                aria-label={fields.phone}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+40 7xx xxx xxx"
                className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/15 text-sm text-white focus:border-brand-400 focus:outline-none"
              />
            </div>

            {/* Role in Association */}
            <div className="space-y-1.5">
              <label htmlFor="pilotRole" className="text-xs font-semibold text-slate-200">{fields.role} *</label>
              <select
                id="pilotRole"
                name="role"
                aria-label={fields.role}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/15 text-sm text-white focus:border-brand-400 focus:outline-none"
              >
                <option value="president">{lang === 'ro' ? 'Președinte de Asociație' : 'HOA President'}</option>
                <option value="admin">{lang === 'ro' ? 'Administrator de Imobile (Atestat)' : 'Certified Property Manager'}</option>
                <option value="cenzor">{lang === 'ro' ? 'Cenzor / Comisie Cenzori' : 'Auditor (Cenzor)'}</option>
                <option value="landlord">{lang === 'ro' ? 'Proprietar Multi-Apartamente' : 'Multi-Property Landlord'}</option>
                <option value="company">{lang === 'ro' ? 'Companie de Administrare' : 'Management Company'}</option>
              </select>
            </div>

            {/* Building Type */}
            <div className="space-y-1.5">
              <label htmlFor="pilotBuildingType" className="text-xs font-semibold text-slate-200">{fields.buildingType}</label>
              <select
                id="pilotBuildingType"
                name="buildingType"
                aria-label={fields.buildingType}
                value={formData.buildingType}
                onChange={(e) => setFormData({ ...formData, buildingType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/15 text-sm text-white focus:border-brand-400 focus:outline-none"
              >
                <option value="A1">A1: Bloc Clasic Pre-1990 (Coloane / RADET)</option>
                <option value="A2">A2: Bloc Reabilitat Termic</option>
                <option value="A3">A3: Imobil 1990–2010 (Centrale de scară)</option>
                <option value="A4">A4: Complex Rezidențial Nou (Post-2010)</option>
                <option value="A5">A5: Ansamblu Rezidențial / Vile</option>
              </select>
            </div>

            {/* Number of units */}
            <div className="space-y-1.5">
              <label htmlFor="pilotUnitsCount" className="text-xs font-semibold text-slate-200">{fields.unitsCount} *</label>
              <input
                id="pilotUnitsCount"
                name="unitsCount"
                type="number"
                min="5"
                max="2000"
                required
                aria-label={fields.unitsCount}
                value={formData.unitsCount}
                onChange={(e) => setFormData({ ...formData, unitsCount: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/15 text-sm text-white focus:border-brand-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Current Software */}
          <div className="space-y-1.5">
            <label htmlFor="pilotCurrentSoftware" className="text-xs font-semibold text-slate-200">{fields.currentSoftware}</label>
            <select
              id="pilotCurrentSoftware"
              name="currentSoftware"
              aria-label={fields.currentSoftware}
              value={formData.currentSoftware}
              onChange={(e) => setFormData({ ...formData, currentSoftware: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-white/15 text-sm text-white focus:border-brand-400 focus:outline-none"
            >
              <option value="Xisoft">Xisoft / BlocManager</option>
              <option value="Aviziero">Aviziero.ro</option>
              <option value="Platformis">Platformis.ro</option>
              <option value="Apartemana">Apartemana</option>
              <option value="Homefile">Homefile.ro</option>
              <option value="Excel">Tabele Excel / Format Hârtie</option>
              <option value="Other">Alt soft de administrare</option>
            </select>
          </div>

          <div className="p-4 rounded-xl bg-surface-100/90 border border-white/10 flex items-center gap-3 text-xs text-slate-200">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{lang === 'ro' ? 'Datele transmise sunt strict confidențiale conform GDPR și sunt utilizate exclusiv pentru configurarea instanței pilot.' : 'Data is protected under GDPR and strictly used for onboarding your pilot instance.'}</span>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-sm font-bold bg-gradient-to-r from-brand-500 via-teal-500 to-emerald-500 hover:from-brand-600 hover:to-emerald-600 text-white shadow-glow-cyan transition-all transform hover:-translate-y-0.5"
          >
            <Send className="w-4 h-4" />
            <span>{fields.submitCta}</span>
          </button>
        </form>
      )}
    </div>
  );
};
