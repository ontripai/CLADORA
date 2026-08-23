'use client';

import React, { useState } from 'react';
import { Language } from '@/types';
import { Megaphone, Plus, CheckCircle2, Clock, Users, Send } from 'lucide-react';

export default function CommunicationsPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;

  const [announcements, setAnnouncements] = useState([
    {
      id: 'ANN-01',
      title: 'Revizie Tehnică Instalație Gaze — Scările 1-4',
      date: '22 Octombrie 2026',
      author: 'Ing. Mihai Voinea (Admin)',
      content: 'Joi, 29 Octombrie, între orele 09:00 și 14:00, se va efectua revizia periodică a instalației de utilizare gaze naturale. Vă rugăm să asigurați accesul în apartamente.',
      reads: 94,
      total: 120
    },
    {
      id: 'ANN-02',
      title: 'Perioadă Transmitere Index Contoare Apă Rece / Caldă',
      date: '20 Octombrie 2026',
      author: 'Administrație',
      content: 'Portalul de citire index este deschis până la data de 25 Octombrie, ora 22:00. Puteți încărca direct fotografia contorului din aplicație.',
      reads: 116,
      total: 120
    }
  ]);

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            Nucleul C11 — Communication & Digital Noticeboard
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' ? 'Avizier Digital & Notificări Rezidenți' : 'Digital Noticeboard & Resident Alerts'}
          </h1>
          <p className="text-xs text-[#52667A]">
            Anunțuri administrative cu confirmare de citire și notificări push/email
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.map((ann) => (
          <div key={ann.id} className="card-proptech p-6 bg-white space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#0E9F8E] uppercase tracking-wider">ANUNȚ OFICIAL ASOCIAȚIE</span>
                <h3 className="text-base font-bold text-[#102A43] mt-1">{ann.title}</h3>
                <div className="text-[11px] text-[#7B8A9A]">Publicat de {ann.author} la {ann.date}</div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669]">
                ✓ {ann.reads} / {ann.total} au citit
              </span>
            </div>

            <p className="text-xs text-[#52667A] leading-relaxed pt-2 border-t border-[#F0F4F8]">
              {ann.content}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
