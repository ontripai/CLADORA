'use client';

import React, { useState } from 'react';
import { Language } from '@/types';
import { 
  Camera, 
  Wrench, 
  CheckCircle2 
} from 'lucide-react';
import { formatNumber } from '@/config/currencies';

interface MeteringProps {
  lang: Language;
}

export const MeteringAndOperationsSection: React.FC<MeteringProps> = ({ lang }) => {
  const [readingInput, setReadingInput] = useState<string>('148.20');
  const [ocrStatus, setOcrStatus] = useState<'IDLE' | 'ANALYZING' | 'CONFIRMED'>('CONFIRMED');

  const handleSimulateOcr = () => {
    setOcrStatus('ANALYZING');
    setTimeout(() => {
      setReadingInput('148.20');
      setOcrStatus('CONFIRMED');
    }, 1200);
  };

  return (
    <section className="py-24 bg-[#F6F9FC] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
            {lang === 'ro' ? 'Nucleul C08 & C09' : lang === 'fa' ? 'هسته‌های نرم‌افزاری C08 و C09' : 'C08 & C09 Cores'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-[#102A43] tracking-tight">
            {lang === 'ro' 
              ? 'Contorizare, Mentenanță și Operațiuni Zilnice' 
              : lang === 'fa'
              ? 'قرائت هوشمند کنتورها، نگهداری تأسیسات و تیکت‌ها'
              : 'Metering, Maintenance & Daily Operations'}
          </h2>
          <p className="text-base sm:text-lg text-[#52667A]">
            {lang === 'ro'
              ? 'Elimină bătăile din ușă în ușă pentru citirea apei și tichetele uitate pe WhatsApp. Totul se transmite cu verificare foto și SLA clar.'
              : lang === 'fa'
              ? 'پایان مراجعه حضوری برای ثبت ارقام کنتور و پیام‌های آشفته در گروه‌ها. ثبت تصویری ارقام با هوش مصنوعی و تیکتینگ تخصصی با زمان‌بندی SLA.'
              : 'Eliminate door-to-door water index collection and messy WhatsApp group chats. Automated photo review workflows and clear resolution SLAs.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-14 items-center">
          
          {/* Left: Meter Reading with Demo OCR Flow */}
          <div className="lg:col-span-6 card-proptech p-6 sm:p-8 bg-white space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAF8F5] text-[#0E9F8E] flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102A43]">
                    {lang === 'ro' ? 'Transmitere Index Contor Apă (Demo Workflow)' : lang === 'fa' ? 'ثبت هوشمند رقم کنتور آب (گردش‌کار نمایشی)' : 'Submit Water Meter Index (Demo Workflow)'}
                  </h3>
                  <p className="text-[11px] text-[#7B8A9A]">
                    {lang === 'ro' ? 'Ap. 14 · Contor Apă Rece Bucătărie (RO-APA-882194)' : lang === 'fa' ? 'واحد ۱۴ · کنتور آب سرد آشپزخانه (RO-APA-882194)' : 'Unit 14 · Kitchen Cold Water Meter'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFF7E6] text-[#B45309] border border-[#FDE68A]">
                {lang === 'ro' ? 'Perioadă Deschisă: 20-25 Oct' : lang === 'fa' ? 'مهلت ثبت: ۲۰ تا ۲۵ ماه' : 'Open Window: 20-25 Oct'}
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0] space-y-2">
                <div className="flex justify-between text-xs text-[#52667A]">
                  <span>{lang === 'ro' ? 'Index precedent (Septembrie):' : lang === 'fa' ? 'رقم دوره پیشین:' : 'Previous Index:'}</span>
                  <span className="font-bold text-[#102A43] tabular-nums font-mono">142.50 m³</span>
                </div>
                <div className="flex justify-between text-xs text-[#52667A]">
                  <span>{lang === 'ro' ? 'Consum mediu istoric ap.:' : lang === 'fa' ? 'میانگین مصرف گذشته واحد:' : 'Historical Average:'}</span>
                  <span className="font-bold text-[#0E9F8E] tabular-nums font-mono">5.80 m³ / {lang === 'ro' ? 'lună' : lang === 'fa' ? 'ماه' : 'month'}</span>
                </div>
              </div>

              {/* Photo Upload Area */}
              <div className="p-4 rounded-xl border-2 border-dashed border-[#B2E5DF] bg-[#EAF8F5]/40 text-center space-y-2">
                <Camera className="w-6 h-6 text-[#0E9F8E] mx-auto" />
                <div className="text-xs font-bold text-[#102A43]">
                  {lang === 'ro' ? 'Foto contor încărcată pentru validare' : lang === 'fa' ? 'تصویر کنتور جهت استخراج خودکار بارگذاری شد' : 'Meter photo uploaded for review'}
                </div>
                <p className="text-[11px] text-[#52667A]">
                  {lang === 'ro' ? 'AI OCR extrage indexul automat cu validare împotriva anomaliilor' : lang === 'fa' ? 'هوش مصنوعی ارقام را استخراج و با آستانه مصرف مقایسه می‌کند' : 'AI OCR extracts index digits with anomaly threshold verification'}
                </p>
                <button
                  type="button"
                  onClick={handleSimulateOcr}
                  className="px-3 py-1.5 rounded-lg bg-[#0E9F8E] text-white text-xs font-bold shadow-sm hover:bg-[#0C8778] transition-colors"
                >
                  {ocrStatus === 'ANALYZING' 
                    ? (lang === 'ro' ? 'Se analizează...' : lang === 'fa' ? 'در حال پردازش هوشمند...' : 'Analyzing...') 
                    : (lang === 'ro' ? 'Re-procesează Foto OCR' : lang === 'fa' ? 'آزمودن استخراج OCR' : 'Simulate OCR Read')}
                </button>
              </div>

              {/* Index Input & Consumption calculation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="meter-ocr-reading-input" className="block text-xs font-bold text-[#102A43] mb-1">
                    {lang === 'ro' ? 'Index Nou Citit (m³)' : lang === 'fa' ? 'رقم جدید قرائت‌شده (متر مکعب)' : 'New Reading (m³)'}
                  </label>
                  <input
                    id="meter-ocr-reading-input"
                    name="meter-ocr-reading-input"
                    aria-label={lang === 'ro' ? 'Index Nou Citit în metri cubi' : lang === 'fa' ? 'رقم جدید قرائت‌شده به متر مکعب' : 'New Reading in cubic meters'}
                    type="text"
                    value={readingInput}
                    onChange={(e) => setReadingInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D3DCE6] text-sm font-mono font-bold text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#087A6E]"
                  />
                </div>
                <div>
                  <div className="block text-xs font-bold text-[#102A43] mb-1">
                    {lang === 'ro' ? 'Consum Rezultat' : lang === 'fa' ? 'میزان مصرف دوره' : 'Calculated Usage'}
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-sm font-mono font-extrabold text-[#047857]">
                    +{formatNumber(parseFloat(readingInput || '0') - 142.50, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#047857] font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {lang === 'ro' 
                    ? 'Consum în marja normală de toleranță (Verificare completă fără abateri semnalate).' 
                    : lang === 'fa'
                    ? 'میزان مصرف در محدوده مجاز و طبیعی (بررسی کامل بدون مغایرت).'
                    : 'Consumption within expected variance range.'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Maintenance Work Orders & SLA */}
          <div className="lg:col-span-6 space-y-4">
            
            <div className="card-proptech p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-[#102A43]">
                  <Wrench className="w-4 h-4 text-[#0E9F8E]" />
                  <span>
                    {lang === 'ro' ? 'Registru Active & Mentenanță Preventivă' : lang === 'fa' ? 'شناسنامه تأسیسات و نگهداری پیشگیرانه' : 'Asset Register & Work Orders'}
                  </span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669]">
                  {lang === 'ro' ? '3 Active' : lang === 'fa' ? '۳ تیکت فعال' : '3 Active'}
                </span>
              </div>
              <p className="text-xs text-[#52667A] leading-relaxed">
                {lang === 'ro'
                  ? 'Fiecare intervenție are responsabil desemnat, termen SLA și atașament deviz/factură conectat direct la contabilitate.'
                  : lang === 'fa'
                  ? 'هر اقدام تعمیری دارای مجری مشخص، مهلت زمانی SLA و پیوست پیش‌فاکتور متصل به دفتر کل حسابداری است.'
                  : 'Every maintenance request is mapped to an asset, contractor SLA, and directly linked to accounting expenses.'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="card-proptech p-4 bg-white flex items-start justify-between gap-4 border-l-4 border-l-[#E5484D]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#E5484D] px-2 py-0.5 rounded bg-[#FEE2E2]">
                      {lang === 'ro' ? 'URGENȚĂ MARE' : lang === 'fa' ? 'فوریت بالا' : 'HIGH PRIORITY'}
                    </span>
                    <span className="text-xs text-[#7B8A9A] font-mono">WO-2026-089</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#102A43] mt-1.5">
                    {lang === 'ro' ? 'Pierdere presiune coloană apă caldă - Scara B' : lang === 'fa' ? 'افت فشار لوله اصلی آب گرم - ورودی B' : 'Hot water riser pressure drop'}
                  </h4>
                  <p className="text-xs text-[#52667A] mt-0.5">
                    {lang === 'ro' ? 'Alocat: InstalSanit SRL · Termen SLA: 18:00 Azi' : lang === 'fa' ? 'ارجاع به: شرکت تأسیسات پارس · مهلت: تا ساعت ۱۸ امروز' : 'Assigned: Tech Team · SLA: 18:00 Today'}
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FFF7E6] text-[#B45309] shrink-0">
                  {lang === 'ro' ? 'În Lucru' : lang === 'fa' ? 'در دست اقدام' : 'In Progress'}
                </span>
              </div>

              <div className="card-proptech p-4 bg-white flex items-start justify-between gap-4 border-l-4 border-l-[#2F80ED]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#2F80ED] px-2 py-0.5 rounded bg-[#EDF5FF]">
                      {lang === 'ro' ? 'REVIZIE PERIODICĂ' : lang === 'fa' ? 'سرویس دوره‌ای' : 'PERIODIC AUDIT'}
                    </span>
                    <span className="text-xs text-[#7B8A9A] font-mono">WO-2026-090</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#102A43] mt-1.5">
                    {lang === 'ro' ? 'Revizie Tehnică Ascensor & Verificare ISCIR' : lang === 'fa' ? 'سرویس ماهانه آسانسور و بازرسی استاندارد فنی' : 'Elevator maintenance & safety inspection'}
                  </h4>
                  <p className="text-xs text-[#52667A] mt-0.5">
                    {lang === 'ro' ? 'Alocat: Otis Lift Servicii · Programat: 28 Octombrie' : lang === 'fa' ? 'پیمانکار: شرکت اوتیس سرویس · زمان‌بندی: ۲۸ ماه جاری' : 'Assigned: Elevator Services · Scheduled'}
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669] shrink-0">
                  {lang === 'ro' ? 'Programat' : lang === 'fa' ? 'زمان‌بندی‌شده' : 'Scheduled'}
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
