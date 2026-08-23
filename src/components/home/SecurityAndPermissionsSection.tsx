import React from 'react';
import { Language } from '@/types';
import { ShieldCheck, Lock, UserCheck, EyeOff, Server, FileText } from 'lucide-react';

interface SecuritySectionProps {
  lang: Language;
}

export const SecurityAndPermissionsSection: React.FC<SecuritySectionProps> = ({ lang }) => {
  const pillars = [
    {
      icon: Server,
      title: lang === 'ro' ? 'Izolare Multi-Tenant Strictă' : lang === 'fa' ? 'جداسازی چندمستأجره داده‌ها (Multi-Tenant)' : 'Multi-Tenant Isolation',
      desc: lang === 'ro' 
        ? 'Fiecare asociație și portofoliu are spațiu de date separat și Row Level Security (RLS) la nivel de bază de date.' 
        : lang === 'fa'
        ? 'تفکیک قطعی داده‌های هر مجتمع در سطح پایگاه داده با معماری امنیتی Row Level Security (RLS).'
        : 'Strict PostgreSQL Row Level Security guarantees zero cross-association data bleed.'
    },
    {
      icon: UserCheck,
      title: lang === 'ro' ? 'Permisiuni pe Roluri (RBAC)' : lang === 'fa' ? 'کنترل دسترسی نقش‌محور (RBAC)' : 'Role-Based Access Control',
      desc: lang === 'ro' 
        ? 'Un utilizator poate avea mai multe roluri (ex. proprietar în blocul A, cenzor în blocul B) fără a amesteca permisiunile.' 
        : lang === 'fa'
        ? 'یک کاربر می‌تواند در یک مجتمع مالک و در مجتمع دیگر بازرس باشد، بدون کوچک‌ترین تداخل در سطوح دسترسی.'
        : 'Granular attribute-based conditions cleanly decouple landlord, tenant, and censor privileges.'
    },
    {
      icon: EyeOff,
      title: lang === 'ro' ? 'Protecția Datelor Chiriașilor' : lang === 'fa' ? 'حفظ حریم خصوصی مالی مالکان و مستأجران' : 'Tenant Financial Privacy',
      desc: lang === 'ro' 
        ? 'Chiriașii văd exclusiv cotele de consum operațional; veniturile și tranzacțiile de capital ale proprietarului sunt mascate.' 
        : lang === 'fa'
        ? 'مستأجران صرفاً مصارف جاری خود را مشاهده می‌کنند؛ اطلاعات بازده سرمایه‌گذاری، اقساط یا املاک دیگر مالک کاملاً محافظت شده است.'
        : 'Tenants never see owner capital yields, mortgage details, or other apartments in the portfolio.'
    },
    {
      icon: Lock,
      title: lang === 'ro' ? 'Jurnal de Audit Imutabil' : lang === 'fa' ? 'ردپای حسابرسی تغییرناپذیر' : 'Immutable Audit Trail',
      desc: lang === 'ro' 
        ? 'Fiecare autentificare, modificare de cotă, stornare și descărcare de document este înregistrată cu timestamp și semnătură.' 
        : lang === 'fa'
        ? 'تمامی ورودها، صدور اسناد اصلاحی، تغییرات مبالغ و دانلود فایل‌ها با برچسب زمانی و هش تغییرناپذیر ثبت می‌شوند.'
        : 'Every login, allocation edit, and document export is stamped into an immutable audit event log.'
    },
    {
      icon: FileText,
      title: lang === 'ro' ? 'Conformitate GDPR Nativă' : lang === 'fa' ? 'انطباق ساختاری با استاندارد GDPR' : 'GDPR Compliance by Design',
      desc: lang === 'ro' 
        ? 'Dreptul de a fi uitat, export de date portabil și politici de retenție conform standardelor europene de protecție a datelor.' 
        : lang === 'fa'
        ? 'رعایت حق فراموشی، امکان خروجی‌گیری استاندارد از سوابق و خط‌مشی‌های صیانت از داده‌های فردی بر اساس قوانین اتحادیه اروپا.'
        : 'Data portability, retention policies, and privacy controls aligned with European GDPR requirements.'
    },
    {
      icon: ShieldCheck,
      title: lang === 'ro' ? 'Găzduire Cloud în Uniunea Europeană' : lang === 'fa' ? 'میزبانی امن ابری در اتحادیه اروپا' : 'EU Cloud Infrastructure',
      desc: lang === 'ro' 
        ? 'Date găzduite exclusiv în centre de date din UE cu backup zilnic criptat și redundanță geografică.' 
        : lang === 'fa'
        ? 'نگهداری داده‌ها در مراکز داده دارای گواهینامه‌های امنیتی اروپا با پشتیبان‌گیری رمزنگاری‌شده روزانه و پایگاه‌های افزونه.'
        : 'Data hosted securely within EU borders with daily encrypted snapshots and geographic redundancy.'
    }
  ];

  return (
    <section className="py-24 bg-[#F6F9FC] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
            {lang === 'ro' ? 'Nucleul C17 — Trust & Security' : lang === 'fa' ? 'هسته نرم‌افزاری C17 — اعتماد و امنیت داده‌ها' : 'C17 Core — Trust & Security'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-[#102A43] tracking-tight">
            {lang === 'ro' 
              ? 'Securitate și Izolare la Standarde Bancare' 
              : lang === 'fa'
              ? 'امنیت، تفکیک داده‌ها و اعتماد در سطح استانداردهای بانکی'
              : 'Bank-Grade Security & Data Isolation'}
          </h2>
          <p className="text-base sm:text-lg text-[#52667A]">
            {lang === 'ro'
              ? 'Administrarea locuințelor implică date personale, contracte de închiriere și sume financiare semnificative. Securitatea este încorporată în arhitectura fundamentală CLADORA.'
              : lang === 'fa'
              ? 'مدیریت دارایی‌های مسکونی شامل داده‌های حساس، قراردادهای مالی و مبالغ تراکنشی بالاست. امنیت داده‌ها در تار و پود معماری کلادورا نهادینه شده است.'
              : 'Residential asset management involves sensitive personal contracts, leases, and substantial sums. Security is built into the ground architecture.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="card-proptech p-6 bg-white space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#EAF8F5] text-[#0E9F8E] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#102A43]">
                  {item.title}
                </h3>
                <p className="text-xs text-[#52667A] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
