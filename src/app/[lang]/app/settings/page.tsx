'use client';

import React from 'react';
import { Language } from '@/types';
import { Settings, ShieldCheck, User, Building, Bell } from 'lucide-react';
import { useDemoStore } from '@/data/demoStore';

export default function SettingsPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;
  const { activeRole, context } = useDemoStore();

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6]">
        <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
          Setări Cont & Organizație
        </div>
        <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
          {lang === 'ro' ? 'Setări Profil & Permisiuni' : 'Settings & Role Permissions'}
        </h1>
        <p className="text-xs text-[#52667A]">
          Gestiune identitate multi-rol, asociații conectate și preferințe notificări
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* User Identity */}
        <div className="card-proptech p-6 bg-white space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF8F5] text-[#0E9F8E] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#102A43]">Identitate Utilizator Multi-Rol</h3>
              <p className="text-xs text-[#52667A]">Radu Popescu · radu.popescu@gmail.com</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#F0F4F8] text-xs">
            <div className="flex justify-between p-2.5 rounded-lg bg-[#F6F9FC]">
              <span className="text-[#52667A]">Rol activ curent:</span>
              <span className="font-bold text-[#0E9F8E]">{activeRole}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-[#F6F9FC]">
              <span className="text-[#52667A]">Asociație principală:</span>
              <span className="font-bold text-[#102A43]">{context.associationName}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-[#F6F9FC]">
              <span className="text-[#52667A]">Unitate rezidențială:</span>
              <span className="font-bold text-[#102A43]">{context.unitNumber}</span>
            </div>
          </div>
        </div>

        {/* Security & Notifications */}
        <div className="card-proptech p-6 bg-white space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EDF5FF] text-[#2F80ED] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#102A43]">Securitate & Sesiune</h3>
              <p className="text-xs text-[#52667A]">Autentificare securizată cu 2FA</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#F0F4F8] text-xs">
            <div className="flex justify-between p-2.5 rounded-lg bg-[#F6F9FC]">
              <span className="text-[#52667A]">Autentificare în doi pași (2FA):</span>
              <span className="font-bold text-[#10B981]">Activată</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-[#F6F9FC]">
              <span className="text-[#52667A]">Notificări avizier pe email:</span>
              <span className="font-bold text-[#102A43]">Imediat</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-[#F6F9FC]">
              <span className="text-[#52667A]">Alerte scadență întreținere:</span>
              <span className="font-bold text-[#102A43]">Cu 3 zile înainte</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
