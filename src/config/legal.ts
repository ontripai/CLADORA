import { Language } from '@/types';

export const LEGAL_DOC_LAST_UPDATED_ISO = '2026-09-05';

export interface LegalCompanyConfig {
  companyName: string | null;
  cui: string | null;
  tradeRegisterNumber: string | null;
  registeredAddress: string | null;
  privacyEmail: string;
  supportEmail: string;
  dpoContact: string | null;
  retentionPeriodYears: number;
}

export const LEGAL_CONFIG: LegalCompanyConfig = {
  companyName: process.env.LEGAL_COMPANY_NAME || null,
  cui: process.env.LEGAL_CUI || null,
  tradeRegisterNumber: process.env.LEGAL_TRADE_REGISTER_NUMBER || null,
  registeredAddress: process.env.LEGAL_REGISTERED_ADDRESS || null,
  privacyEmail: 'privacy@cladora.ro',
  supportEmail: 'contact@cladora.ro',
  dpoContact: process.env.LEGAL_DPO_CONTACT || null,
  retentionPeriodYears: 5,
};

/**
 * Returns a human-friendly, localized string of the document's last update date.
 */
export function getLegalDocumentDate(lang: Language): string {
  switch (lang) {
    case 'ro':
      return '5 Septembrie 2026';
    case 'fa':
      return '۱۵ شهریور ۱۴۰۵';
    case 'en':
    default:
      return 'September 5, 2026';
  }
}

/**
 * Returns a claim-safe corporate identity string without displaying raw brackets.
 */
export function getLegalOperatorName(lang: Language): string {
  if (LEGAL_CONFIG.companyName) {
    return LEGAL_CONFIG.companyName;
  }

  switch (lang) {
    case 'ro':
      return 'Operatorul Platformei CLADORA';
    case 'fa':
      return 'مجری فنی پلتفرم کلادورا';
    case 'en':
    default:
      return 'CLADORA Platform Operator';
  }
}
