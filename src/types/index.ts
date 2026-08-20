export type Language = 'en' | 'ro';

export interface NavItem {
  key: string;
  label: string;
  href: string;
  badge?: string;
  description?: string;
}

export interface CoreFeature {
  code: string;
  name: string;
  priority: 'P1' | 'P2' | 'P3';
  domain: string;
  description: string;
  highlight: string;
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

export interface Testimonial {
  name: string;
  role: string;
  buildingType: string;
  location: string;
  quote: string;
  stats: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}
