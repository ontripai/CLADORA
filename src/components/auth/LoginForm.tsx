'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Language } from '@/types';
import { ArrowRight, Loader2, Lock, Mail, PlayCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { TurnstileWidget } from '@/components/auth/TurnstileWidget';

interface LoginFormProps {
  lang: Language;
}

export const LoginForm: React.FC<LoginFormProps> = ({ lang }) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const configured = isSupabaseConfigured();
  const captchaSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!configured) {
      setError(
        lang === 'ro'
          ? 'Conexiunea securizată nu este configurată încă.'
          : lang === 'fa'
            ? 'اتصال امن Supabase هنوز پیکربندی نشده است.'
            : 'The secure Supabase connection is not configured yet.',
      );
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });

    if (signInError) {
      setError(
        lang === 'ro'
          ? 'Emailul sau parola nu sunt corecte.'
          : lang === 'fa'
            ? 'ایمیل یا رمز عبور صحیح نیست.'
            : 'The email or password is incorrect.',
      );
      setIsSubmitting(false);
      return;
    }

    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError) {
      await supabase.auth.signOut();
      setError(
        lang === 'ro'
          ? 'Starea de securitate a contului nu a putut fi verificată.'
          : lang === 'fa'
            ? 'وضعیت امنیتی حساب قابل بررسی نبود.'
            : 'The account security state could not be verified.',
      );
      setIsSubmitting(false);
      return;
    }

    if (assurance.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
      router.replace(`/${lang}/mfa`);
      router.refresh();
      return;
    }

    router.replace(`/${lang}/app/dashboard`);
    router.refresh();
  };

  return (
    <div className="card-proptech p-8 bg-white border-[#D3DCE6] space-y-6 shadow-elevated">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#102A43] to-[#087A6E] flex items-center justify-center text-white font-display font-extrabold text-2xl mx-auto shadow-md">
          C
        </div>
        <h1 className="text-2xl font-display font-extrabold text-[#102A43]">
          {lang === 'ro' ? 'Autentificare în CLADORA' : lang === 'fa' ? 'ورود به سامانه کلادورا' : 'Sign in to CLADORA'}
        </h1>
        <p className="text-xs text-[#334E68]">
          {lang === 'ro' 
            ? 'Accesează panoul de control al asociației sau portofoliului tău' 
            : lang === 'fa'
            ? 'دسترسی به میز کار اختصاصی مجتمع مسکونی یا سبد املاک'
            : 'Access your condominium or portfolio workspace'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="loginEmail" className="block text-xs font-bold text-[#102A43] mb-1">
            {lang === 'ro' ? 'Email' : lang === 'fa' ? 'پست الکترونیک (ایمیل)' : 'Email'}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#486581] absolute start-3 top-3 pointer-events-none" />
            <input
              id="loginEmail"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-[#D3DCE6] text-xs text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#087A6E]"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="loginPassword" className="text-xs font-bold text-[#102A43]">
              {lang === 'ro' ? 'Parolă' : lang === 'fa' ? 'رمز عبور' : 'Password'}
            </label>
            <Link href={`/${lang}/forgot-password`} className="text-[11px] text-[#087A6E] hover:underline font-semibold">
              {lang === 'ro' ? 'Ai uitat parola?' : lang === 'fa' ? 'فراموشی رمز عبور؟' : 'Forgot password?'}
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#486581] absolute start-3 top-3 pointer-events-none" />
            <input
              id="loginPassword"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-[#D3DCE6] text-xs text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#087A6E]"
            />
          </div>
        </div>

        {captchaSiteKey && <TurnstileWidget siteKey={captchaSiteKey} lang={lang} onToken={setCaptchaToken} />}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-[#087A6E] hover:bg-[#065F55] disabled:cursor-not-allowed disabled:opacity-60 text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <span>{isSubmitting ? (lang === 'ro' ? 'Se verifică…' : lang === 'fa' ? 'در حال بررسی…' : 'Signing in…') : (lang === 'ro' ? 'Intră în Cont' : lang === 'fa' ? 'ورود به حساب کاربری' : 'Sign in to Account')}</span>
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 rtl:rotate-180" />}
        </button>
        {error && (
          <p role="alert" className="rounded-xl border border-[#F5B7B1] bg-[#FFF1F0] px-3 py-2 text-xs font-semibold text-[#B42318]">
            {error}
          </p>
        )}
      </form>

      {/* Demo Sandbox Fast Access */}
      <div className="pt-4 border-t border-[#F0F4F8] text-center space-y-3">
        <div className="text-xs text-[#334E68]">
          {lang === 'ro' 
            ? 'Nu ai cont încă? Testează fără autentificare:' 
            : lang === 'fa'
            ? 'حساب کاربری ندارید؟ ورود مستقیم به دموی تعاملی:'
            : 'No credentials yet? Explore the sandbox:'}
        </div>
        <Link
          href={`/${lang}/demo`}
          className="w-full py-2.5 px-4 rounded-xl bg-[#EAF8F5] text-[#087A6E] border border-[#B2E5DF] text-xs font-bold transition-all flex items-center justify-center gap-2 hover:bg-[#087A6E] hover:text-white"
        >
          <PlayCircle className="w-4 h-4" />
          <span>{lang === 'ro' ? 'Deschide Demo Interactiv Gratuit' : lang === 'fa' ? 'ورود به دموی آزمایشی رایگان' : 'Launch Free Interactive Demo'}</span>
        </Link>
      </div>
    </div>
  );
};
