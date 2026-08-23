import React from 'react';
import { Language } from '@/types';
import { Building2, Shield, Flame, Zap, Home, Sparkles, CheckCircle2 } from 'lucide-react';

interface BuildingArchetypesProps {
  lang: Language;
}

export const BuildingArchetypesSection: React.FC<BuildingArchetypesProps> = ({ lang }) => {
  const archetypes = [
    {
      code: 'PRE-1990',
      name: lang === 'ro' 
        ? 'Bloc Comunist Neanvelopat (Pre-1990)' 
        : lang === 'fa'
        ? 'بلوک سنتی فاقد عایق (پیش از ۱۹۹۰)'
        : 'Pre-1990 Communist Era Block',
      period: lang === 'ro' ? '1960 — 1989' : lang === 'fa' ? '۱۹۶۰ — ۱۹۸۹' : '1960 — 1989',
      features: lang === 'ro' 
        ? ['Coloane verticale comune de apă', 'Încălzire centralizată RADET/Termoenergetica', 'Pierderi mari de căldură', 'Fonduri de reparații urgente']
        : lang === 'fa'
        ? ['لوله‌کشی عمودی مشترک آب', 'موتورخانه یا گرمایش مرکزی', 'اتلاف حرارتی قابل توجه', 'نیاز مبرم به صندوق تعمیرات']
        : ['Shared vertical water risers', 'District heating substation', 'High thermal transmission loss', 'Urgent structural reserve fund'],
      icon: Building2,
      badge: lang === 'ro' ? 'Risc Pierderi Apă: Ridicat' : lang === 'fa' ? 'ریسک نشتی آب: بالا' : 'Water Loss Risk: High'
    },
    {
      code: 'REHABILITATED',
      name: lang === 'ro' 
        ? 'Bloc Reabilitat Termic' 
        : lang === 'fa'
        ? 'ساختمان عایق‌سازی‌شده حرارتی'
        : 'Thermally Rehabilitated Block',
      period: lang === 'ro' ? '1970 — 1989 (Modernizat)' : lang === 'fa' ? '۱۹۷۰ — ۱۹۸۹ (بازسازی‌شده)' : '1970 — 1989 (Modernized)',
      features: lang === 'ro'
        ? ['Anvelopare polistiren/vată minerală', 'Repartitoare de căldură pe calorifere', 'Economii de 30-40% la încălzire', 'Reconciliere complexă coeficienți']
        : lang === 'fa'
        ? ['نمای عایق پشم‌سنگ یا پلی‌استایرن', 'شیرهای ترموستاتیک رادیاتور', '۳۰ تا ۴۰٪ کاهش مصرف گاز و گرمایش', 'محاسبه ضرایب اصلاحی حرارت']
        : ['Exterior thermal insulation', 'Heat cost allocators', '30-40% heating energy reduction', 'Coefficient reconciliation math'],
      icon: Flame,
      badge: lang === 'ro' ? 'Eficiență Energetică: Clasa B' : lang === 'fa' ? 'رده مصرف انرژی: B' : 'Energy Class: B'
    },
    {
      code: '1990-2010',
      name: lang === 'ro' 
        ? 'Clădire Tranziție (1990–2010)' 
        : lang === 'fa'
        ? 'ساختمان‌های دوره انتقال (۱۹۹۰–۲۰۱۰)'
        : 'Transition Era Building (1990–2010)',
      period: lang === 'ro' ? '1990 — 2010' : lang === 'fa' ? '۱۹۹۰ — ۲۰۱۰' : '1990 — 2010',
      features: lang === 'ro'
        ? ['Centrale termice individuale de apartament', 'Contorizare mixtă apă/gaze', 'Documentație tehnică fragmentată', 'Asociații de scară independente']
        : lang === 'fa'
        ? ['پکیج‌های مستقل گرمایشی واحدها', 'انشعابات و کنتورهای تفکیک‌نشده', 'مستندات تأسیساتی پراکنده', 'مدیریت مستقل برای هر ورودی']
        : ['Individual unit gas boilers', 'Mixed metering infrastructure', 'Fragmented legacy blueprints', 'Independent staircase associations'],
      icon: Shield,
      badge: lang === 'ro' ? 'Contorizare: Mixtă' : lang === 'fa' ? 'انشعابات: ترکیبی' : 'Metering: Mixed'
    },
    {
      code: 'NEW-COMPLEX',
      name: lang === 'ro' 
        ? 'Ansamblu Rezidențial Nou (Post-2015)' 
        : lang === 'fa'
        ? 'مجتمع‌های مدرن نوساز (پس از ۲۰۱۵)'
        : 'Modern Residential Complex (Post-2015)',
      period: lang === 'ro' ? '2015 — Prezent' : lang === 'fa' ? '۲۰۱۵ — تاکنون' : '2015 — Present',
      features: lang === 'ro'
        ? ['Contorizare individuală pe orizontală pe hol', 'Parcări subterane & stații EV', 'BMS & panouri solare', 'Administrare profesională dedicată']
        : lang === 'fa'
        ? ['کنتورهای افقی مجزا در راهروها', 'پارکینگ هوشمند و ایستگاه شارژ خودرو برقی', 'سامانه BMS و پنل‌های خورشیدی', 'مدیریت حرفه‌ای شرکتی']
        : ['Horizontal corridor metering', 'Underground parking & EV chargers', 'BMS & solar arrays', 'Dedicated management firm'],
      icon: Sparkles,
      badge: lang === 'ro' ? 'BMS & Smart Metering' : lang === 'fa' ? 'هوشمند و مبتنی بر BMS' : 'BMS & Smart Ready'
    },
    {
      code: 'GATED-VILLA',
      name: lang === 'ro' 
        ? 'Complex de Vile / Comunitate Rezidențială Închisă' 
        : lang === 'fa'
        ? 'شهرک ویلایی محصور (Gated Community)'
        : 'Gated Villa Community',
      period: lang === 'ro' ? 'Comunități Private' : lang === 'fa' ? 'شهرک اختصاصی' : 'Private Communities',
      features: lang === 'ro'
        ? ['Securitate perimetrală & bariere acces', 'Stație proprie de epurare/pompare', 'Întreținere spații verzi și piscine', 'Cote calculate pe suprafață teren/vilă']
        : lang === 'fa'
        ? ['نگهبانی ۲۴ ساعته و راهبندهای تردد', 'ایستگاه تصفیه و بوستر پمپ اختصاصی', 'نگهداری فضای سبز، معابر و استخر', 'تسهیم هزینه‌ها بر اساس مساحت عرصه و اعیان']
        : ['Perimeter security & access barriers', 'Private pump & wastewater station', 'Landscape & common amenities', 'Parcel-based allocation formulas'],
      icon: Home,
      badge: lang === 'ro' ? 'Mentenanță Perimetru' : lang === 'fa' ? 'نگهداری زیرساخت شهرک' : 'Perimeter Maintenance'
    },
    {
      code: 'INDIVIDUAL-VILLA',
      name: lang === 'ro' 
        ? 'Vilă Individuală / Casă Unifamilială' 
        : lang === 'fa'
        ? 'ویلای مستقل و تک‌واحدی'
        : 'Single Detached Villa',
      period: lang === 'ro' ? 'Rezidențial Privat' : lang === 'fa' ? 'املاک شخصی' : 'Private Residential',
      features: lang === 'ro'
        ? ['Fără asociație de bloc', 'Evidență contracte revizii (centrală, acoperiș)', 'Urmărire directă furnizori', 'Management portofoliu personal']
        : lang === 'fa'
        ? ['بدون نیاز به شارژ هیئت‌مدیره', 'ثبت قراردادهای سرویس موتورخانه و سقف', 'پایش مستقیم قبوض انشعابات', 'مدیریت دارایی شخصی']
        : ['Zero condo association overhead', 'Contract register (roof, HVAC)', 'Direct supplier invoice ledger', 'Personal property asset tracker'],
      icon: Zap,
      badge: lang === 'ro' ? 'Management Activ Privat' : lang === 'fa' ? 'پایش مستقیم دارایی' : 'Direct Asset Ledger'
    }
  ];

  return (
    <section className="py-24 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#0A6E62] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
            {lang === 'ro' ? 'Nucleul C07 — Building DNA' : lang === 'fa' ? 'هسته نرم‌افزاری C07 — شناسنامه فنی ساختمان' : 'C07 Core — Building DNA'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-[#102A43] tracking-tight">
            {lang === 'ro' 
              ? 'Clădirile nu sunt toate la fel' 
              : lang === 'fa'
              ? 'ساختمان‌ها همه یکسان رفتار نمی‌کنند'
              : 'Buildings Are Not All The Same'}
          </h2>
          <p className="text-base sm:text-lg text-[#52667A]">
            {lang === 'ro'
              ? 'Fiecare tip de clădire are o arhitectură termică, mecanică și de contorizare distinctă. CLADORA își adaptează algoritmii și regulile operaționale la ADN-ul clădirii.'
              : lang === 'fa'
              ? 'هر سازه دارای ویژگی‌های حرارتی، تأسیساتی و انشعابات منحصربه‌فردی است. کلادورا الگوریتم‌ها و قوانین نگهداری را متناسب با شناسنامه فنی سازه تنظیم می‌کند.'
              : 'Every building profile has unique thermal, plumbing, and metering realities. CLADORA dynamically adjusts operational rules to the building archetype.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
          {archetypes.map((arch) => {
            const Icon = arch.icon;
            return (
              <div key={arch.code} className="card-proptech p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#EAF8F5] text-[#0E9F8E] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#F6F9FC] text-[#52667A] border border-[#E2E8F0]">
                      {arch.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#102A43] mt-4">
                    {arch.name}
                  </h3>
                  <div className="text-xs text-[#52667A] font-medium mt-0.5">
                    {arch.period}
                  </div>

                  <ul className="space-y-2 mt-4 pt-4 border-t border-[#F0F4F8] text-xs text-[#52667A]">
                    {arch.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
