'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { Mail, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen pt-32 pb-24 bg-[#F6F9FC]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-2 text-xs text-[#52667A] mb-8 font-medium">
          <Link href={`/${lang}`} className="hover:text-[#102A43]">
            {lang === 'ro' ? 'Acasă' : lang === 'fa' ? 'صفحه اصلی' : 'Home'}
          </Link>
          <span>/</span>
          <span className="text-[#102A43] font-bold">
            {lang === 'ro' ? 'Contact' : lang === 'fa' ? 'تماس با ما' : 'Contact Us'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-5 space-y-6">
            <span className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
              {lang === 'ro' ? 'Hai să vorbim' : lang === 'fa' ? 'گفت‌وگو با ما' : 'Get in Touch'}
            </span>
            <h1 className="text-3xl font-display font-extrabold text-[#102A43]">
              {lang === 'ro' ? 'Contactează echipa CLADORA' : lang === 'fa' ? 'ارتباط با تیم پشتیبانی کلادورا' : 'Contact CLADORA Team'}
            </h1>
            <p className="text-xs text-[#52667A] leading-relaxed">
              {lang === 'ro'
                ? 'Suntem aici pentru a răspunde întrebărilor tale despre migrarea asociației, integrarea portofoliului sau înscrierea în programul pilot din București și Ilfov.'
                : lang === 'fa'
                ? 'ما آماده پاسخگویی به پرسش‌های شما در خصوص فرایند مهاجرت سوابق، اتصال سبد املاک یا ثبت‌نام در برنامه پایلوت هستیم.'
                : 'We are here to assist with migration assessments, portfolio onboarding, or pilot enrollment.'}
            </p>

            <div className="space-y-3 text-xs text-[#52667A]">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#E2E8F0]">
                <Mail className="w-4 h-4 text-[#0E9F8E] shrink-0" />
                <span className="font-semibold text-[#102A43] font-mono ltr-isolate">contact@cladora.ro</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#E2E8F0]">
                <MapPin className="w-4 h-4 text-[#0E9F8E] shrink-0" />
                <span className="font-semibold text-[#102A43]">
                  {lang === 'ro' ? 'București & Ilfov, România' : lang === 'fa' ? 'بخارست و ایلفوف، رومانی' : 'Bucharest & Ilfov, Romania'}
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="card-proptech p-6 sm:p-8 bg-white space-y-4 shadow-elevated">
              {submitted ? (
                <div className="text-center py-10 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-[#10B981] mx-auto" />
                  <h3 className="text-lg font-bold text-[#102A43]">
                    {lang === 'ro' ? 'Mesaj transmis cu succes!' : lang === 'fa' ? 'پیام شما با موفقیت ارسال شد!' : 'Message sent successfully!'}
                  </h3>
                  <p className="text-xs text-[#52667A]">
                    {lang === 'ro' ? 'Un specialist CLADORA te va contacta în maximum 24 de ore.' : lang === 'fa' ? 'کارشناسان کلادورا ظرف حداکثر ۲۴ ساعت با شما تماس خواهند گرفت.' : 'A specialist will respond within 24 hours.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#102A43] mb-1">
                      {lang === 'ro' ? 'Nume & Prenume' : lang === 'fa' ? 'نام و نام خانوادگی' : 'Full Name'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={lang === 'ro' ? 'Ion Popescu' : lang === 'fa' ? 'مثال: علی رضایی' : 'John Doe'}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#D3DCE6] text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#102A43] mb-1">
                      {lang === 'ro' ? 'Email' : lang === 'fa' ? 'پست الکترونیک (ایمیل)' : 'Email'}
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="contact@example.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#D3DCE6] text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#102A43] mb-1">
                      {lang === 'ro' ? 'Mesaj sau detalii clădire' : lang === 'fa' ? 'متن پیام یا مشخصات ساختمان' : 'Message or Building Details'}
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder={lang === 'ro' ? 'Avem un bloc de 80 apartamente în Sector 1...' : lang === 'fa' ? 'مجتمع مسکونی ما دارای ۶۰ واحد آپارتمان است...' : 'We manage an 80-unit condominium...'}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#D3DCE6] text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-[#0E9F8E] hover:bg-[#0C8778] text-white font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>{lang === 'ro' ? 'Trimite Mesajul' : lang === 'fa' ? 'ارسال پیام' : 'Send Message'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
