'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Language } from '@/types';

const copy = {
  ro: { title: 'Finalizează activarea spațiului', body: 'Confirmă profilul, activează TOTP și încheie verificarea administratorului principal.', action: 'Finalizează onboarding-ul', success: 'Onboarding finalizat. Spațiul poate fi activat de CLADORA.', error: 'Finalizarea nu a fost posibilă. Verifică MFA și încearcă din nou.' },
  en: { title: 'Complete workspace activation', body: 'Confirm your profile, enable TOTP, and finish the primary administrator verification.', action: 'Complete onboarding', success: 'Onboarding completed. CLADORA can now activate the workspace.', error: 'Completion failed. Verify MFA and try again.' },
  fa: { title: 'تکمیل فعال‌سازی فضای کاری', body: 'پروفایل را تأیید، TOTP را فعال و بررسی مدیر اصلی را تکمیل کنید.', action: 'تکمیل راه‌اندازی', success: 'راه‌اندازی تکمیل شد و کلادورا می‌تواند فضای کاری را فعال کند.', error: 'تکمیل ممکن نشد؛ MFA را بررسی و دوباره تلاش کنید.' },
} as const;

export function OnboardingCompletionForm({ lang, workspaceId, version }: { lang: Language; workspaceId: string; version: number }) {
  const t = copy[lang]; const router = useRouter();
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState<string|null>(null); const [error,setError]=useState<string|null>(null);
  async function complete() {
    setBusy(true); setError(null);
    const response = await fetch('/api/auth/complete-onboarding',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace_id:workspaceId,expected_version:version,reason:'Primary administrator completed the secure onboarding checklist'})});
    setBusy(false);
    if (!response.ok) { setError(t.error); return; }
    setMessage(t.success); router.refresh();
  }
  return <section className="card-proptech space-y-4 bg-white p-6"><h1 className="text-xl font-extrabold text-[#102A43]">{t.title}</h1><p className="text-sm text-[#334E68]">{t.body}</p><button type="button" disabled={busy} onClick={complete} className="rounded-xl bg-[#087A6E] px-5 py-3 text-xs font-extrabold text-white disabled:opacity-60">{t.action}</button>{message&&<p role="status" className="text-xs font-semibold text-[#087A6E]">{message}</p>}{error&&<p role="alert" className="text-xs font-semibold text-[#B42318]">{error}</p>}</section>;
}
