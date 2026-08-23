/**
 * Centralized Action Labels and Localization
 */

import { Locale } from '@/config/locales';

export const actionLabels = {
  getStarted: { ro: 'Începe acum', en: 'Get Started', fa: 'شروع کنید' },
  viewDemo: { ro: 'Vezi demonstrația', en: 'View Demo', fa: 'مشاهده نسخه نمایشی' },
  applyPilot: { ro: 'Aplică în pilot', en: 'Apply for Pilot', fa: 'درخواست شرکت در پایلوت' },
  learnMore: { ro: 'Află mai multe', en: 'Learn More', fa: 'اطلاعات بیشتر' },
  discover: { ro: 'Descoperă', en: 'Discover', fa: 'مشاهده جزئیات' },
  signIn: { ro: 'Autentificare', en: 'Sign In', fa: 'ورود' },
  register: { ro: 'Înregistrare', en: 'Register', fa: 'ثبت‌نام' },
  submit: { ro: 'Trimite', en: 'Submit', fa: 'ارسال' },
  save: { ro: 'Salvează', en: 'Save', fa: 'ذخیره' },
  cancel: { ro: 'Anulează', en: 'Cancel', fa: 'انصراف' },
  continue: { ro: 'Continuă', en: 'Continue', fa: 'ادامه' },
  back: { ro: 'Înapoi', en: 'Back', fa: 'بازگشت' },
  next: { ro: 'Următorul', en: 'Next', fa: 'مرحله بعد' },
  confirm: { ro: 'Confirmă', en: 'Confirm', fa: 'تأیید' },
  close: { ro: 'Închide', en: 'Close', fa: 'بستن' },
  resetDemo: { ro: 'Resetează datele demo', en: 'Reset Demo', fa: 'بازنشانی نسخه نمایشی' },
  changeRole: { ro: 'Schimbă rolul', en: 'Change Role', fa: 'تغییر نقش' },
  openMenu: { ro: 'Deschide meniul', en: 'Open Menu', fa: 'بازکردن منو' },
  search: { ro: 'Caută', en: 'Search', fa: 'جست‌وجو' },
  filter: { ro: 'Filtrează', en: 'Filter', fa: 'فیلتر' },
  clearFilters: { ro: 'Resetează filtrele', en: 'Clear Filters', fa: 'پاک‌کردن فیلترها' },
  download: { ro: 'Descarcă', en: 'Download', fa: 'دانلود' },
  upload: { ro: 'Încarcă', en: 'Upload', fa: 'بارگذاری' },
  viewDetails: { ro: 'Vezi detalii', en: 'View Details', fa: 'مشاهده جزئیات' },
  createTicket: { ro: 'Creează tichet', en: 'Create Ticket', fa: 'ثبت درخواست' },
  submitReading: { ro: 'Transmite index', en: 'Submit Reading', fa: 'ثبت قرائت' },
  review: { ro: 'Revizuiește', en: 'Review', fa: 'بررسی' },
  approve: { ro: 'Aprobă', en: 'Approve', fa: 'تأیید' },
  reject: { ro: 'Respinge', en: 'Reject', fa: 'رد' },
  payNow: { ro: 'Plătește acum', en: 'Pay Now', fa: 'پرداخت' },
  markAsRead: { ro: 'Marchează ca citit', en: 'Mark as Read', fa: 'علامت‌گذاری به‌عنوان خوانده‌شده' },
} as const;

export type ActionKey = keyof typeof actionLabels;

export function getActionLabel(key: ActionKey, locale: Locale = 'ro'): string {
  const meta = actionLabels[key];
  if (!meta) return key;
  return meta[locale] || meta.en;
}
