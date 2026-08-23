'use client';

import React, { useState } from 'react';
import { Language } from '@/types';
import { Megaphone, Plus, CheckCircle2, Clock, Users, Send } from 'lucide-react';
import { formatNumber } from '@/config/currencies';

export default function CommunicationsPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;

  const announcements = [
    {
      id: 'ANN-01',
      title: lang === 'ro' 
        ? 'Revizie Tehnică Instalație Gaze — Scările 1-4' 
        : lang === 'fa' 
        ? 'سرویس دوره‌ای و بازرسی ایمنی تأسیسات گاز — ورودی‌های ۱ تا ۴' 
        : 'Gas System Safety & Inspection — Blocks 1-4',
      date: lang === 'ro' ? '22 Octombrie 2026' : lang === 'fa' ? '۱ آبان ۱۴۰۵' : 'October 22, 2026',
      author: lang === 'ro' ? 'Ing. Mihai Voinea (Admin)' : lang === 'fa' ? 'مهندس رضایی (مدیر ساختمان)' : 'Mihai Voinea (Admin)',
      content: lang === 'ro'
        ? 'Joi, 29 Octombrie, între orele 09:00 și 14:00, se va efectua revizia periodică a instalației de utilizare gaze naturale. Vă rugăm să asigurați accesul în apartamente.'
        : lang === 'fa'
        ? 'پنج‌شنبه ۲۹ اکتبر از ساعت ۹:۰۰ تا ۱۴:۰۰، بازرسی فنی دوره‌ای تأسیسات گاز طبیعی انجام خواهد شد. خواهشمند است هماهنگی لازم جهت حضور در واحدها را مبذول فرمایید.'
        : 'On Thursday, Oct 29, between 09:00 and 14:00, the mandatory gas network inspection will be performed. Please ensure access to your units.',
      reads: 94,
      total: 120
    },
    {
      id: 'ANN-02',
      title: lang === 'ro' 
        ? 'Perioadă Transmitere Index Contoare Apă Rece / Caldă' 
        : lang === 'fa' 
        ? 'آغاز بازه زمانی ثبت عکس و رقم کنتورهای آب سرد و گرم' 
        : 'Water Submeter Submission Window Open',
      date: lang === 'ro' ? '20 Octombrie 2026' : lang === 'fa' ? '۲۹ مهر ۱۴۰۵' : 'October 20, 2026',
      author: lang === 'ro' ? 'Administrație' : lang === 'fa' ? 'مدیریت مجتمع' : 'Administration',
      content: lang === 'ro'
        ? 'Portalul de citire index este deschis până la data de 25 Octombrie, ora 22:00. Puteți încărca direct fotografia contorului din aplicație.'
        : lang === 'fa'
        ? 'سامانه ثبت شاخص کنتورها تا ساعت ۲۲:۰۰ روز ۲۵ اکتبر باز است. لطفاً تصویر کنتورهای واحد خود را مستقیماً در اپلیکیشن بارگذاری نمایید.'
        : 'The meter reading portal is open until Oct 25 at 22:00. You can upload photo OCR readings directly in the resident mobile app.',
      reads: 116,
      total: 120
    }
  ];

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            {lang === 'ro' 
              ? 'Nucleul C11 — Comunicare & Avizier Digital' 
              : lang === 'fa' 
              ? 'هسته C11 — تابلو اعلانات دیجیتال و اطلاع‌رسانی به ساکنان' 
              : 'Core C11 — Communication & Digital Noticeboard'}
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' ? 'Avizier Digital & Notificări Rezidenți' : lang === 'fa' ? 'تابلو اعلانات دیجیتال و اعلان‌های رسمی' : 'Digital Noticeboard & Resident Alerts'}
          </h1>
          <p className="text-xs text-[#52667A]">
            {lang === 'ro' 
              ? 'Anunțuri administrative cu confirmare de citire și notificări push/email' 
              : lang === 'fa' 
              ? 'اطلاعیه‌های رسمی هیئت‌مدیره با رهگیری وضعیت خوانده‌شدن و اعلان‌های پیامکی و نوتیفیکیشن' 
              : 'Official board announcements with read receipts and multichannel push/email notifications'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.map((ann) => (
          <div key={ann.id} className="card-proptech p-6 bg-white space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#0E9F8E] uppercase tracking-wider">
                  {lang === 'ro' ? 'ANUNȚ OFICIAL ASOCIAȚIE' : lang === 'fa' ? 'اطلاعیه رسمی انجمن مالکان' : 'OFFICIAL ASSOCIATION NOTICE'}
                </span>
                <h3 className="text-base font-bold text-[#102A43] mt-1">{ann.title}</h3>
                <div className="text-[11px] text-[#7B8A9A]">
                  {lang === 'ro' ? `Publicat de ${ann.author} la ${ann.date}` : lang === 'fa' ? `انتشار توسط ${ann.author} در ${ann.date}` : `Published by ${ann.author} on ${ann.date}`}
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669]">
                ✓ {formatNumber(ann.reads, lang)} / {formatNumber(ann.total, lang)} {lang === 'ro' ? 'au citit' : lang === 'fa' ? 'مشاهده کردند' : 'have read'}
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
