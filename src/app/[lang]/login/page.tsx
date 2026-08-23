'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Language } from '@/types';
import { ArrowRight, Lock, Mail, PlayCircle } from 'lucide-react';

export default function LoginPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate directly into app shell in demo mode
    router.push(`/${lang}/app/dashboard`);
  };

  return (
    <main className="min-h-screen pt-32 pb-24 bg-[#F6F9FC] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        
        <div className="card-proptech p-8 bg-white border-[#D3DCE6] space-y-6 shadow-elevated">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#102A43] to-[#0E9F8E] flex items-center justify-center text-white font-display font-extrabold text-2xl mx-auto shadow-md">
              C
            </div>
            <h1 className="text-2xl font-display font-extrabold text-[#102A43]">
              {lang === 'ro' ? 'Autentificare în CLADORA' : lang === 'fa' ? 'ورود به سامانه کلادورا' : 'Sign in to CLADORA'}
            </h1>
            <p className="text-xs text-[#52667A]">
              {lang === 'ro' 
                ? 'Accesează panoul de control al asociației sau portofoliului tău' 
                : lang === 'fa'
                ? 'دسترسی به میز کار اختصاصی مجتمع مسکونی یا سبد املاک'
                : 'Access your condominium or portfolio workspace'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#102A43] mb-1">
                {lang === 'ro' ? 'Email' : lang === 'fa' ? 'پست الکترونیک (ایمیل)' : 'Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#7B8A9A] absolute start-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-[#D3DCE6] text-xs text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-[#102A43]">
                  {lang === 'ro' ? 'Parolă' : lang === 'fa' ? 'رمز عبور' : 'Password'}
                </label>
                <Link href={`/${lang}/forgot-password`} className="text-[11px] text-[#0E9F8E] hover:underline font-semibold">
                  {lang === 'ro' ? 'Ai uitat parola?' : lang === 'fa' ? 'فراموشی رمز عبور؟' : 'Forgot password?'}
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#7B8A9A] absolute start-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-[#D3DCE6] text-xs text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-[#0E9F8E] hover:bg-[#0C8778] text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>{lang === 'ro' ? 'Intră în Cont' : lang === 'fa' ? 'ورود به حساب کاربری' : 'Sign in to Account'}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>

          {/* Demo Sandbox Fast Access */}
          <div className="pt-4 border-t border-[#F0F4F8] text-center space-y-3">
            <div className="text-xs text-[#52667A]">
              {lang === 'ro' 
                ? 'Nu ai cont încă? Testează fără autentificare:' 
                : lang === 'fa'
                ? 'حساب کاربری ندارید؟ ورود مستقیم به دموی تعاملی:'
                : 'No credentials yet? Explore the sandbox:'}
            </div>
            <Link
              href={`/${lang}/demo`}
              className="w-full py-2.5 px-4 rounded-xl bg-[#EAF8F5] text-[#0A6E62] border border-[#B2E5DF] text-xs font-bold transition-all flex items-center justify-center gap-2 hover:bg-[#0E9F8E] hover:text-white"
            >
              <PlayCircle className="w-4 h-4" />
              <span>{lang === 'ro' ? 'Deschide Demo Interactiv Gratuit' : lang === 'fa' ? 'ورود به دموی آزمایشی رایگان' : 'Launch Free Interactive Demo'}</span>
            </Link>
          </div>

        </div>

      </div>
    </main>
  );
}
