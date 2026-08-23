'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { Mail, MapPin, Send, CheckCircle2 } from 'lucide-react';

interface ContactFormProps {
  lang: Language;
}

export const ContactForm: React.FC<ContactFormProps> = ({ lang }) => {
  const [submitted, setSubmitted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-xs text-[#334E68] mb-8 font-medium">
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
          <span className="text-xs font-bold text-[#087A6E] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
            {lang === 'ro' ? 'Hai să vorbim' : lang === 'fa' ? 'گفت‌وگو با ما' : 'Get in Touch'}
          </span>
          <h1 className="text-3xl font-display font-extrabold text-[#102A43]">
            {lang === 'ro' ? 'Contactează echipa CLADORA' : lang === 'fa' ? 'ارتباط با تیم پشتیبانی کلادورا' : 'Contact CLADORA Team'}
          </h1>
          <p className="text-xs text-[#334E68] leading-relaxed">
            {lang === 'ro'
              ? 'Suntem aici pentru a răspunde întrebărilor tale despre migrarea structurată a asociației, integrarea portofoliului sau înscrierea în programul pilot din București și Ilfov.'
              : lang === 'fa'
              ? 'ما آماده پاسخگویی به پرسش‌های شما در خصوص فرایند مهاجرت سوابق، اتصال سبد املاک یا ثبت‌نام در برنامه پایلوت هستیم.'
              : 'We are here to assist with migration assessments, portfolio onboarding, or pilot enrollment.'}
          </p>

          <div className="space-y-3 text-xs text-[#334E68]">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#E2E8F0]">
              <Mail className="w-4 h-4 text-[#087A6E] shrink-0" />
              <span className="font-semibold text-[#102A43] font-mono ltr-isolate">contact@cladora.ro</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#E2E8F0]">
              <MapPin className="w-4 h-4 text-[#087A6E] shrink-0" />
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
                <CheckCircle2 className="w-12 h-12 text-[#047857] mx-auto" />
                <h3 className="text-lg font-bold text-[#102A43]">
                  {lang === 'ro' ? 'Mesaj transmis cu succes!' : lang === 'fa' ? 'پیام شما با موفقیت ارسال شد!' : 'Message sent successfully!'}
                </h3>
                <p className="text-xs text-[#334E68]">
                  {lang === 'ro' ? 'Un specialist CLADORA te va contacta în maximum 24 de ore.' : lang === 'fa' ? 'کارشناسان کلادورا ظرف حداکثر ۲۴ ساعت با شما تماس خواهند گرفت.' : 'A specialist will respond within 24 hours.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label htmlFor="contactFullName" className="block font-bold text-[#102A43] mb-1">
                    {lang === 'ro' ? 'Nume & Prenume' : lang === 'fa' ? 'نام و نام خانوادگی' : 'Full Name'}
                  </label>
                  <input
                    id="contactFullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={lang === 'ro' ? 'Ion Popescu' : lang === 'fa' ? 'مثال: علی رضایی' : 'John Doe'}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D3DCE6] text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#087A6E]"
                  />
                </div>

                <div>
                  <label htmlFor="contactEmail" className="block font-bold text-[#102A43] mb-1">
                    {lang === 'ro' ? 'Email' : lang === 'fa' ? 'پست الکترونیک (ایمیل)' : 'Email'}
                  </label>
                  <input
                    id="contactEmail"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@example.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D3DCE6] text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#087A6E]"
                  />
                </div>

                <div>
                  <label htmlFor="contactMessage" className="block font-bold text-[#102A43] mb-1">
                    {lang === 'ro' ? 'Mesaj sau detalii clădire' : lang === 'fa' ? 'متن پیام یا مشخصات ساختمان' : 'Message or Building Details'}
                  </label>
                  <textarea
                    id="contactMessage"
                    name="message"
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={lang === 'ro' ? 'Avem un bloc de 80 apartamente în Sector 1...' : lang === 'fa' ? 'مجتمع مسکونی ما دارای ۶۰ واحد آپارتمان است...' : 'We manage an 80-unit condominium...'}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D3DCE6] text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#087A6E]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#087A6E] hover:bg-[#065F55] text-white font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
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
  );
};
