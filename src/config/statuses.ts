/**
 * Centralized Status Labels and Localization
 */

import { Locale } from '@/config/locales';

export type EntityStatus = 
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'unpaid'
  | 'overdue'
  | 'draft'
  | 'open'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'locked'
  | 'reconciled'
  | 'unreconciled'
  | 'verified'
  | 'needs_review'
  | 'demo'
  | 'planned';

export interface StatusMeta {
  key: EntityStatus;
  ro: string;
  en: string;
  fa: string;
  badgeClass: string;
}

export const statusConfig: Record<EntityStatus, StatusMeta> = {
  active: {
    key: 'active',
    ro: 'Activ',
    en: 'Active',
    fa: 'فعال',
    badgeClass: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
  },
  inactive: {
    key: 'inactive',
    ro: 'Inactiv',
    en: 'Inactive',
    fa: 'غیرفعال',
    badgeClass: 'bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]',
  },
  pending: {
    key: 'pending',
    ro: 'În așteptare',
    en: 'Pending',
    fa: 'در انتظار',
    badgeClass: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
  },
  approved: {
    key: 'approved',
    ro: 'Aprobat',
    en: 'Approved',
    fa: 'تأییدشده',
    badgeClass: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
  },
  rejected: {
    key: 'rejected',
    ro: 'Respins',
    en: 'Rejected',
    fa: 'ردشده',
    badgeClass: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
  },
  paid: {
    key: 'paid',
    ro: 'Plătit',
    en: 'Paid',
    fa: 'پرداخت‌شده',
    badgeClass: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
  },
  unpaid: {
    key: 'unpaid',
    ro: 'Neplătit',
    en: 'Unpaid',
    fa: 'پرداخت‌نشده',
    badgeClass: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
  },
  overdue: {
    key: 'overdue',
    ro: 'Restant / Depășit',
    en: 'Overdue',
    fa: 'سررسیدگذشته',
    badgeClass: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]',
  },
  draft: {
    key: 'draft',
    ro: 'Ciornă',
    en: 'Draft',
    fa: 'پیش‌نویس',
    badgeClass: 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]',
  },
  open: {
    key: 'open',
    ro: 'Deschis',
    en: 'Open',
    fa: 'باز',
    badgeClass: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
  },
  in_progress: {
    key: 'in_progress',
    ro: 'În lucru',
    en: 'In Progress',
    fa: 'در حال انجام',
    badgeClass: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
  },
  completed: {
    key: 'completed',
    ro: 'Finalizat',
    en: 'Completed',
    fa: 'تکمیل‌شده',
    badgeClass: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
  },
  cancelled: {
    key: 'cancelled',
    ro: 'Anulat',
    en: 'Cancelled',
    fa: 'لغوشده',
    badgeClass: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]',
  },
  locked: {
    key: 'locked',
    ro: 'Blocat',
    en: 'Locked',
    fa: 'قفل‌شده',
    badgeClass: 'bg-[#F1F5F9] text-[#334155] border-[#94A3B8]',
  },
  reconciled: {
    key: 'reconciled',
    ro: 'Reconciliat',
    en: 'Reconciled',
    fa: 'تطبیق‌یافته',
    badgeClass: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
  },
  unreconciled: {
    key: 'unreconciled',
    ro: 'Nereconciliat',
    en: 'Unreconciled',
    fa: 'تطبیق‌نیافته',
    badgeClass: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
  },
  verified: {
    key: 'verified',
    ro: 'Verificat',
    en: 'Verified',
    fa: 'تأییدشده',
    badgeClass: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
  },
  needs_review: {
    key: 'needs_review',
    ro: 'Necesită Revizuire',
    en: 'Needs Review',
    fa: 'نیازمند بررسی',
    badgeClass: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
  },
  demo: {
    key: 'demo',
    ro: 'Demo',
    en: 'Demo',
    fa: 'نمایشی',
    badgeClass: 'bg-[#EAF8F5] text-[#0A6E62] border-[#B2E5DF]',
  },
  planned: {
    key: 'planned',
    ro: 'Planificat',
    en: 'Planned',
    fa: 'برنامه‌ریزی‌شده',
    badgeClass: 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]',
  },
};

export function getStatusLabel(status: EntityStatus, locale: Locale = 'ro'): string {
  const meta = statusConfig[status];
  if (!meta) return status;
  return meta[locale] || meta.en;
}
