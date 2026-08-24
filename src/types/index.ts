import type { Language } from '@/config/locales';
import type { SupportedCurrency } from '@/config/currencies';
export type { Locale, Language, Direction } from '@/config/locales';
export { localeConfig, isSupportedLocale, getLocaleDirection, isRtlLocale, getIntlLocale, getLocaleConfig, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/config/locales';
export type { SupportedCurrency, MonetaryContext, FormatMoneyOptions } from '@/config/currencies';
export { currencyConfig, DEFAULT_OPERATIONAL_CURRENCY, DEFAULT_MARKET_CURRENCY, formatMoney, formatNumber, formatPercent, formatCompactNumber, getLocalizedCurrencyName } from '@/config/currencies';
export { Money } from '@/components/ui/Money';
export * from './utilityBills';

export type UserRole =
  | 'association_admin'
  | 'president'
  | 'censor'
  | 'board_member'
  | 'owner'
  | 'tenant_resident'
  | 'portfolio_owner'
  | 'property_manager'
  | 'maintenance_coordinator'
  | 'platform_admin';

export interface RoleDefinition {
  key: UserRole;
  title: Record<Language, string>;
  description: Record<Language, string>;
  badge: Record<Language, string>;
  icon: string;
  defaultRoute: string;
}

export interface ActiveContext {
  organizationId: string;
  organizationName: string;
  associationId?: string;
  associationName?: string;
  buildingId?: string;
  buildingName?: string;
  propertyId?: string;
  propertyName?: string;
  unitId?: string;
  unitNumber?: string;
  currentRole: UserRole;
  accountingPeriod: string; // e.g. "OCT-2026"
}

export interface NavItem {
  key: string;
  label: string;
  href: string;
  badge?: string;
  description?: string;
  icon?: string;
}

export interface CoreFeature {
  code: string;
  name: string;
  priority: 'P1' | 'P2' | 'P3';
  domain: string;
  description: string;
  highlight: string;
  availability: 'demo' | 'mvp' | 'p2' | 'p3' | 'integration';
}

export interface BuildingArchetype {
  code: string;
  name: string;
  period: string;
  characteristics: string;
  systemImpact: string;
  iconName: string;
  savingsPotential: string;
}

export interface ComparisonItem {
  feature: string;
  category: string;
  cladora: string | boolean;
  legacyDesktop: string | boolean; // Xisoft/BlocManager
  basicPortal: string | boolean;   // Aviziero/Platformis
  landlordOnly: string | boolean;  // Apartemana
  explanation: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  tagline: string;
  monthlyBasePrice: number;
  perUnitMonthly: number;
  currency: string;
  highlighted?: boolean;
  features: string[];
  ctaLabel: string;
  targetAudience: string;
}

// Accounting & Financial Truth
export interface JournalEntry {
  id: string;
  date: string;
  documentRef: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  currency?: SupportedCurrency;
  status: 'POSTED' | 'REVERSED' | 'PENDING_AUDIT';
  createdBy: string;
  auditHash: string;
}

export interface ChargeBreakdownLine {
  id: string;
  expenseCategory: string;
  supplierInvoiceRef: string;
  totalInvoiceAmount: number;
  allocationMethod: 'CPI' | 'PER_PERSON' | 'SURFACE_M2' | 'METER_CONSUMPTION' | 'DIRECT';
  unitSharePercent: number;
  calculatedAmount: number;
  currency?: SupportedCurrency;
  legalDebtor: 'OWNER' | 'TENANT';
  operationalPayer: 'OWNER' | 'TENANT';
  verifiedAt: string;
}

// Maintenance & Work Orders
export interface WorkOrder {
  id: string;
  title: string;
  buildingName: string;
  unitOrArea: string;
  category: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'ELEVATOR' | 'CLEANING' | 'SECURITY';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_SAFETY';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedTo?: string;
  createdAt: string;
  slaDeadline: string;
}

// Meter Reading
export interface MeterReading {
  id: string;
  unitNumber: string;
  meterType: 'COLD_WATER' | 'HOT_WATER' | 'HEATING' | 'GAS' | 'ELECTRICITY';
  meterSerialNumber: string;
  previousIndex: number;
  currentIndex: number;
  consumption: number;
  submissionDate: string;
  submissionMethod: 'APP_INPUT' | 'PHOTO_OCR' | 'RADIO_METER';
  validationStatus: 'VALIDATED' | 'ANOMALY_FLAGGED' | 'PENDING_REVIEW';
  photoUrl?: string;
}

// Portfolio Property
export interface PortfolioProperty {
  id: string;
  address: string;
  city: string;
  unit: string;
  associationName: string;
  monthlyRent: number;
  currency: string;
  occupancyStatus: 'OCCUPIED' | 'VACANT' | 'RENOVATING';
  tenantName?: string;
  leaseEndDate?: string;
  netYieldPercent: number;
  monthlyOwnerExpenses: number;
  monthlyTenantExpenses: number;
  depositHeld: number;
}
