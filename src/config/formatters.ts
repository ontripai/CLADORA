import { Language } from '@/config/locales';
import { UserRole } from '@/types';
import { formatNumber } from '@/config/currencies';

/**
 * Centralized formatting helpers for CLADORA
 * Standardizes units, accounting periods, roles, property details, dates, and addresses across locales.
 */

// Month translations
const MONTH_NAMES: Record<string, Record<Language, string>> = {
  'JAN': { ro: 'Ianuarie', en: 'January', fa: 'ژانویه' },
  'FEB': { ro: 'Februarie', en: 'February', fa: 'فوریه' },
  'MAR': { ro: 'Martie', en: 'March', fa: 'مارس' },
  'APR': { ro: 'Aprilie', en: 'April', fa: 'آوریل' },
  'MAY': { ro: 'Mai', en: 'May', fa: 'مه' },
  'JUN': { ro: 'Iunie', en: 'June', fa: 'ژوئن' },
  'JUL': { ro: 'Iulie', en: 'July', fa: 'ژوئیه' },
  'AUG': { ro: 'August', en: 'August', fa: 'اوت' },
  'SEP': { ro: 'Septembrie', en: 'September', fa: 'سپتامبر' },
  'OCT': { ro: 'Octombrie', en: 'October', fa: 'اکتبر' },
  'NOV': { ro: 'Noiembrie', en: 'November', fa: 'نوامبر' },
  'DEC': { ro: 'Decembrie', en: 'December', fa: 'دسامبر' },
};

const MONTH_INDEX_NAMES: Record<number, Record<Language, string>> = {
  1: { ro: 'ianuarie', en: 'January', fa: 'ژانویه' },
  2: { ro: 'februarie', en: 'February', fa: 'فوریه' },
  3: { ro: 'martie', en: 'March', fa: 'مارس' },
  4: { ro: 'aprilie', en: 'April', fa: 'آوریل' },
  5: { ro: 'mai', en: 'May', fa: 'مه' },
  6: { ro: 'iunie', en: 'June', fa: 'ژوئن' },
  7: { ro: 'iulie', en: 'July', fa: 'ژوئیه' },
  8: { ro: 'august', en: 'August', fa: 'اوت' },
  9: { ro: 'septembrie', en: 'September', fa: 'سپتامبر' },
  10: { ro: 'octombrie', en: 'October', fa: 'اکتبر' },
  11: { ro: 'noiembrie', en: 'November', fa: 'نوامبر' },
  12: { ro: 'decembrie', en: 'December', fa: 'دسامبر' },
};

/**
 * Format unit / apartment label
 * e.g., "Ap. 14" -> "واحد ۱۴" (fa), "Ap. 14" (ro), "Unit 14" (en)
 */
export function formatUnitLabel(rawUnit: string, locale: Language = 'ro'): string {
  if (!rawUnit) return '';
  const numMatch = rawUnit.match(/\d+/);
  if (!numMatch) return rawUnit;
  const num = parseInt(numMatch[0], 10);

  if (locale === 'fa') {
    return `واحد ${formatNumber(num, 'fa')}`;
  }
  if (locale === 'en') {
    return `Unit ${num}`;
  }
  return `Ap. ${num}`;
}

/**
 * Format accounting period code
 * e.g., "OCT-2026" -> "اکتبر ۲۰۲۶" (fa), "Octombrie 2026" (ro), "October 2026" (en)
 */
export function formatAccountingPeriod(periodCode: string, locale: Language = 'ro'): string {
  if (!periodCode) return '';
  const parts = periodCode.split('-');
  if (parts.length === 2) {
    const monthKey = parts[0].toUpperCase();
    const year = parts[1];
    const monthObj = MONTH_NAMES[monthKey];
    if (monthObj) {
      const monthName = monthObj[locale] || monthObj.en;
      const formattedYear = locale === 'fa' ? formatNumber(parseInt(year, 10), 'fa', { useGrouping: false }) : year;
      return `${monthName} ${formattedYear}`;
    }
  }
  return periodCode;
}

/**
 * Format date string preserving Gregorian date
 * e.g., "2027-08-31" -> "۳۱ اوت ۲۰۲۷" (fa), "31 august 2027" (ro), "August 31, 2027" (en)
 */
export function formatGregorianDate(dateStr: string, locale: Language = 'ro'): string {
  if (!dateStr || dateStr === 'N/A') {
    return locale === 'fa' ? 'ثبت‌نشده' : 'N/A';
  }

  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return dateStr;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  const monthObj = MONTH_INDEX_NAMES[month];
  const monthName = monthObj ? (monthObj[locale] || monthObj.en) : match[2];

  if (locale === 'fa') {
    return `${formatNumber(day, 'fa')} ${monthName} ${formatNumber(year, 'fa', { useGrouping: false })}`;
  }
  if (locale === 'ro') {
    return `${day} ${monthName} ${year}`;
  }
  return `${monthName} ${day}, ${year}`;
}

/**
 * Format user role code to localized title
 */
export function formatRoleTitle(roleKey: UserRole | string, locale: Language = 'ro'): string {
  const rolesMap: Record<string, Record<Language, string>> = {
    association_admin: { ro: 'Administrator de Bloc', en: 'Association Administrator', fa: 'مدیر ساختمان' },
    president: { ro: 'Președinte de Asociație', en: 'Association President', fa: 'رئیس هیئت‌مدیره انجمن' },
    censor: { ro: 'Cenzor / Auditor Financiar', en: 'Censor / Financial Auditor', fa: 'بازرس / حسابرس انجمن' },
    owner: { ro: 'Proprietar (Rezident)', en: 'Homeowner (Resident)', fa: 'مالک ساکن' },
    tenant_resident: { ro: 'Chiriaș / Rezident', en: 'Tenant / Resident', fa: 'مستأجر' },
    portfolio_owner: { ro: 'Proprietar Portofoliu', en: 'Portfolio Landlord', fa: 'مالک سبد املاک' },
    property_manager: { ro: 'Director Companie Administrare', en: 'Property Management Director', fa: 'مدیر شرکت مدیریت املاک' },
    platform_admin: { ro: 'Administrator Platformă', en: 'Platform Administrator', fa: 'مدیر ارشد سامانه کلادورا' },
    board_member: { ro: 'Membru Comitet', en: 'Board Member', fa: 'عضو هیئت‌مدیره' },
    maintenance_coordinator: { ro: 'Coordonator Tehnic', en: 'Maintenance Coordinator', fa: 'مسئول هماهنگی فنی' }
  };

  const roleObj = rolesMap[roleKey];
  if (!roleObj) return roleKey;
  return roleObj[locale] || roleObj.en;
}

/**
 * Format property details description
 * e.g., "Ap. 14 (3 camere, 78 mp)" -> "واحد ۱۴ — ۳ اتاق، ۷۸ مترمربع" (fa)
 */
export function formatPropertyUnitDetails(unitStr: string, locale: Language = 'ro'): string {
  if (!unitStr) return '';
  if (locale !== 'fa' && locale !== 'en') return unitStr;

  // Extract unit number
  const unitMatch = unitStr.match(/Ap\.\s*(\d+)/i);
  const unitNum = unitMatch ? parseInt(unitMatch[1], 10) : null;

  // Extract rooms or studio
  const isStudio = /studio/i.test(unitStr);
  const roomsMatch = unitStr.match(/(\d+)\s*camere/i);
  const rooms = roomsMatch ? parseInt(roomsMatch[1], 10) : null;

  // Extract surface
  const surfaceMatch = unitStr.match(/(\d+)\s*mp/i);
  const surface = surfaceMatch ? parseInt(surfaceMatch[1], 10) : null;

  if (locale === 'fa') {
    const unitPart = unitNum !== null ? `واحد ${formatNumber(unitNum, 'fa')}` : 'واحد';
    let roomPart = '';
    if (isStudio) {
      roomPart = 'استودیو';
    } else if (rooms !== null) {
      roomPart = `${formatNumber(rooms, 'fa')} اتاق`;
    }
    const surfacePart = surface !== null ? `${formatNumber(surface, 'fa')} مترمربع` : '';
    const details = [roomPart, surfacePart].filter(Boolean).join('، ');
    return details ? `${unitPart} — ${details}` : unitPart;
  }

  if (locale === 'en') {
    const unitPart = unitNum !== null ? `Unit ${unitNum}` : 'Unit';
    let roomPart = '';
    if (isStudio) {
      roomPart = 'Studio';
    } else if (rooms !== null) {
      roomPart = `${rooms} rooms`;
    }
    const surfacePart = surface !== null ? `${surface} sqm` : '';
    const details = [roomPart, surfacePart].filter(Boolean).join(', ');
    return details ? `${unitPart} (${details})` : unitPart;
  }

  return unitStr;
}

/**
 * Format address to localize prefixes while preserving proper noun names
 * e.g., "Str. Aviației nr. 12B, Ap. 14, Sector 1" -> "خیابان Aviației پلاک 12B، واحد ۱۴، منطقه ۱" (fa)
 */
export function formatAddress(address: string, locale: Language = 'ro'): string {
  if (!address) return '';
  if (locale === 'fa') {
    return address
      .replace(/Str\.\s*/i, 'خیابان ')
      .replace(/Bvd\.\s*/i, 'بلوار ')
      .replace(/Calea\s*/i, 'خیابان ')
      .replace(/nr\.\s*/i, 'پلاک ')
      .replace(/Ap\.\s*(\d+)/i, (_, n) => `واحد ${formatNumber(parseInt(n, 10), 'fa')}`)
      .replace(/Sector\s*(\d+)/i, (_, s) => `منطقه ${formatNumber(parseInt(s, 10), 'fa')}`);
  }
  if (locale === 'en') {
    return address.replace(/Ap\.\s*(\d+)/i, 'Unit $1');
  }
  return address;
}

/**
 * Format tenant name or occupancy label
 */
export function formatTenantDisplay(tenantName: string | undefined, locale: Language = 'ro'): string {
  if (!tenantName || tenantName === 'N/A' || tenantName === 'Vacant') {
    return locale === 'fa' ? 'ثبت‌نشده' : locale === 'ro' ? 'Liber' : 'Vacant';
  }
  if (tenantName === 'Ambasada / Expat Office') {
    return locale === 'fa' ? 'سفارت / دفتر کارکنان خارجی' : locale === 'ro' ? 'Ambasadă / Birou Expați' : 'Embassy / Expat Office';
  }
  return tenantName;
}

/**
 * Localized work order data helpers
 */
export interface LocalizedWorkOrder {
  title: string;
  unitOrArea: string;
  assignedTo?: string;
}

export function getLocalizedWorkOrder(woId: string, locale: Language = 'ro'): LocalizedWorkOrder {
  const map: Record<string, Record<Language, LocalizedWorkOrder>> = {
    'WO-2026-089': {
      ro: {
        title: 'Pierdere presiune coloană apă caldă - Tronson 3 (Scara B)',
        unitOrArea: 'Subsol Tehnic & Coloană Ap. 22-38',
        assignedTo: 'InstalSanit SRL (Ing. Radu)'
      },
      en: {
        title: 'Hot water riser pressure drop - Zone 3 (Staircase B)',
        unitOrArea: 'Technical Basement & Riser Units 22-38',
        assignedTo: 'InstalSanit SRL (Eng. Radu)'
      },
      fa: {
        title: 'افت فشار ستون آب گرم — بخش ۳، ورودی B',
        unitOrArea: 'فضای فنی زیرزمین و ستون واحدهای ۲۲ تا ۳۸',
        assignedTo: 'تیم فنی تأسیسات (مهندس رادو)'
      }
    },
    'WO-2026-090': {
      ro: {
        title: 'Blocare contact senzor ușă lift - Scara A',
        unitOrArea: 'Ascensor Principal Sc. A',
        assignedTo: 'Otis Servicii Tehnice'
      },
      en: {
        title: 'Elevator door sensor contact failure - Staircase A',
        unitOrArea: 'Main Elevator Staircase A',
        assignedTo: 'Otis Technical Services'
      },
      fa: {
        title: 'اختلال حسگر درِ آسانسور — ورودی A',
        unitOrArea: 'آسانسور اصلی ورودی A',
        assignedTo: 'خدمات فنی آسانسور'
      }
    },
    'WO-2026-091': {
      ro: {
        title: 'Înlocuire senzori prezență LED casa scării etaj 4',
        unitOrArea: 'Etaj 4 Scara B',
        assignedTo: 'Neatribuit'
      },
      en: {
        title: 'Replace stairwell motion sensors Floor 4',
        unitOrArea: 'Floor 4 Staircase B',
        assignedTo: 'Unassigned'
      },
      fa: {
        title: 'تعویض حسگرهای روشنایی راهپله طبقه چهارم',
        unitOrArea: 'طبقه چهارم، ورودی B',
        assignedTo: 'تخصیص‌نیافته'
      }
    }
  };

  const item = map[woId];
  if (!item) {
    return {
      title: woId,
      unitOrArea: '',
      assignedTo: undefined
    };
  }
  return item[locale] || item.ro;
}
