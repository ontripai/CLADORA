import React from 'react';
import { Language } from '@/types';
import { 
  Vote, 
  Megaphone, 
  FileCheck2 
} from 'lucide-react';

interface GovernanceSectionProps {
  lang: Language;
}

export const GovernanceAndCommunitySection: React.FC<GovernanceSectionProps> = ({ lang }) => {
  return (
    <section className="py-24 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#0A6E62] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
            {lang === 'ro' ? 'Nucleul C11 & C12' : lang === 'fa' ? 'هسته‌های نرم‌افزاری C11 و C12' : 'C11 & C12 Cores'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-[#102A43] tracking-tight">
            {lang === 'ro' 
              ? 'Guvernanță Transparentă și Decizii Executabile' 
              : lang === 'fa'
              ? 'حاکمیت شفاف مجامع و تبدیل مصوبات به سند مالی'
              : 'Transparent Governance: From Decision to Execution'}
          </h2>
          <p className="text-base sm:text-lg text-[#52667A]">
            {lang === 'ro'
              ? 'Pregătirea Adunării Generale, calculul cvorumului statutar conform Legii 196/2018 și avizierul digital cu confirmare de citire.'
              : lang === 'fa'
              ? 'برگزاری مجمع عمومی، محاسبه حدنصاب قانونی بر اساس سهام مشاع و تابلوی اعلانات دیجیتال با تأییدیه مشاهده ساکنان.'
              : 'AGM meeting preparation, statutory quorum calculations, and digital noticeboard with verifiable read receipts.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-14 items-center">
          
          {/* Left: Meeting Prep & Voting Simulation Card */}
          <div className="lg:col-span-7 card-proptech p-6 sm:p-8 bg-[#F6F9FC] border-[#D3DCE6] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EAF8F5] text-[#0E9F8E] flex items-center justify-center shrink-0">
                  <Vote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102A43]">
                    {lang === 'ro' 
                      ? 'Adunarea Generală Ordinară 2026 — Vot Proiect Reabilitare' 
                      : lang === 'fa'
                      ? 'مجمع عمومی سالانه — تصویب پروژه نوسازی تأسیسات'
                      : '2026 Annual General Meeting — Facade Renovation Project'}
                  </h3>
                  <p className="text-xs text-[#52667A]">
                    {lang === 'ro' ? 'Aviației 12B · Convocator transmis către 120 proprietari' : lang === 'fa' ? 'مجتمع آویاتسی · دعوت‌نامه ابلاغ‌شده به ۱۲۰ مالک' : '120 units invited'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                {lang === 'ro' ? 'Cvorum Întrunit: 68.5%' : lang === 'fa' ? 'حدنصاب مجمع: ۶۸.۵٪' : 'Quorum: 68.5%'}
              </span>
            </div>

            {/* Voting Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-[#102A43]">
                  {lang === 'ro' 
                    ? 'Punct 1: Aprobare Buget Înlocuire Coloane Termice (50.000 RON)' 
                    : lang === 'fa'
                    ? 'بند ۱: تصویب بودجه تعویض لوله‌کشی موتورخانه (۵۰,۰۰۰ لئو)'
                    : 'Item 1: Heating Riser Overhaul Budget'}
                </span>
                <span className="font-extrabold text-[#0A6E62]">
                  {lang === 'ro' ? '82 Voturi PENTRU (76%)' : lang === 'fa' ? '۸۲ رأی موافق (۷۶٪)' : '82 Votes FOR (76%)'}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#E2E8F0] overflow-hidden flex">
                <div className="bg-[#10B981] h-full" style={{ width: '76%' }} />
                <div className="bg-[#F59E0B] h-full" style={{ width: '14%' }} />
                <div className="bg-[#E5484D] h-full" style={{ width: '10%' }} />
              </div>
              <div className="flex justify-between text-[11px] text-[#52667A]">
                <span>✓ {lang === 'ro' ? '82 Pentru' : lang === 'fa' ? '۸۲ موافق' : '82 For'}</span>
                <span>{lang === 'ro' ? '15 Abțineri' : lang === 'fa' ? '۱۵ ممتنع' : '15 Abstain'}</span>
                <span>{lang === 'ro' ? '11 Împotrivă' : lang === 'fa' ? '۱۱ مخالف' : '11 Against'}</span>
              </div>
            </div>

            {/* Decision Conversion */}
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#102A43]">
                <FileCheck2 className="w-4 h-4 text-[#0E9F8E]" />
                <span>
                  {lang === 'ro' 
                    ? 'Conversie Automată din Decizie în Sarcină Financiară' 
                    : lang === 'fa'
                    ? 'تبدیل خودکار صورت‌جلسه مصوب به ردیف‌های شارژ در دفتر کل'
                    : 'Automatic Task & Accounting Allocation Creation'}
                </span>
              </div>
              <p className="text-xs text-[#52667A] leading-relaxed">
                {lang === 'ro'
                  ? 'După încheierea procesului-verbal, CLADORA generează automat cotele pentru fondul de reparații în lista de plată conform CPI fiecărui proprietar.'
                  : lang === 'fa'
                  ? 'پس از نهایی‌سازی صورت‌جلسه مجمع، کلادورا ارقام مصوب را به‌صورت خودکار بر مبنای سهم مشاع هر واحد در فیش شارژ اعمال می‌کند.'
                  : 'Upon minute recording, CLADORA automatically generates the reserve fund quotas in the monthly ledger according to each unit CPI share.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF7E6] border border-[#FDE68A] text-xs text-[#92400E] leading-relaxed">
              ⚖️ <strong>{lang === 'ro' ? 'Notă legală:' : lang === 'fa' ? 'یادداشت حقوقی:' : 'Legal Note:'}</strong> {lang === 'ro' ? 'Validitatea juridică a votului la distanță sau hibrid este supusă prevederilor statutului fiecărei asociații și Legii 196/2018.' : lang === 'fa' ? 'اعتبار قانونی آرای الکترونیکی و هیبریدی منوط به اساسنامه مصوب مجمع و الزامات قانونی حاکم است.' : 'Statutory remote voting validity is governed by association bylaws.'}
            </div>
          </div>

          {/* Right: Digital Noticeboard & Resident Communications */}
          <div className="lg:col-span-5 space-y-4">
            <div className="card-proptech p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#102A43]">
                <Megaphone className="w-4 h-4 text-[#0E9F8E]" />
                <span>
                  {lang === 'ro' 
                    ? 'Avizier Digital cu Dovadă de Citire' 
                    : lang === 'fa'
                    ? 'تابلوی اعلانات دیجیتال با رسید مشاهده'
                    : 'Digital Noticeboard with Delivery Proof'}
                </span>
              </div>
              <p className="text-xs text-[#52667A] leading-relaxed">
                {lang === 'ro'
                  ? 'Anunțurile importante (revizie gaze, oprire apă, convocatoare) ajung instant în aplicația mobilă și pe email, cu confirmare de primire.'
                  : lang === 'fa'
                  ? 'اطلاعیه‌های مهم (قطعی آب، سرویس تأسیسات گاز، دعوت‌نامه‌ها) بی‌درنگ به اپلیکیشن و ایمیل مالکان ارسال شده و وضعیت مطالعه آنها ثبت می‌شود.'
                  : 'Urgent notices (gas inspections, water shutdowns, meeting notices) are pushed with verifiable delivery and read receipts.'}
              </p>
            </div>

            <div className="card-proptech p-4 bg-white border-l-4 border-l-[#0E9F8E] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0A6E62]">
                  {lang === 'ro' ? 'ANUNȚ ADMINISTRATOR' : lang === 'fa' ? 'اطلاعیه مدیریت مجتمع' : 'ADMIN NOTICE'}
                </span>
                <span className="text-[#52667A]">
                  {lang === 'ro' ? 'Acum 2 ore' : lang === 'fa' ? '۲ ساعت پیش' : '2h ago'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#102A43]">
                {lang === 'ro' 
                  ? 'Revizie Tehnică Instalație Gaze — Joi, 29 Octombrie (09:00–14:00)' 
                  : lang === 'fa'
                  ? 'بازرسی فنی شبکه تأسیسات گاز — پنج‌شنبه ۲۹ ماه (ساعت ۹ الی ۱۴)'
                  : 'Gas Network Technical Inspection — Oct 29'}
              </h4>
              <p className="text-xs text-[#52667A]">
                {lang === 'ro' 
                  ? 'Vă rugăm să asigurați accesul în apartamente pentru verificarea etanșeității.' 
                  : lang === 'fa'
                  ? 'خواهشمند است جهت بررسی نشتی و ایمنی، امکان حضور یا دسترسی به واحد را فراهم فرمایید.'
                  : 'Please grant access for leak checks.'}
              </p>
              <div className="pt-2 text-[11px] text-[#047857] font-bold">
                ✓ {lang === 'ro' ? '94 rezidenți au confirmat citirea' : lang === 'fa' ? '۹۴ ساکن اطلاعیه را مشاهده و تأیید کردند' : '94 residents confirmed read'}
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
