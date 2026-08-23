# CLADORA — Residential Asset Operating System

CLADORA is a modern, audit-grade operating system for residential real estate, homeowner associations (HOAs), and multi-property portfolios.

## Localization & Multi-Currency Architecture

CLADORA supports three primary locales with native RTL layout and independent multi-currency accounting:
- Romanian (`/ro`) — Base language for Romanian condominium administration (Law 196/2018)
- English (`/en`) — International real estate operations and investor reporting
- Persian (`/fa`) — Full right-to-left (RTL) localized experience with bidirectional numeral isolation

### Currency Decoupling
Accounting currency is decoupled from the UI display language:
- Default operational & statutory accounting currency: `RON`
- Portfolio & cross-border asset currency: `EUR`
- Formatted via centralized engine (`src/config/currencies.ts`) and bidirectional `<Money />` component (`src/components/ui/Money.tsx`).

## Quality Assurance & Testing

### Running Tests
```bash
# Run unit & integration test suite for multi-currency formatting
npm run test:unit

# Run authoritative rendered copy & i18n leak audit across all 123 localized routes
npm run test:i18n

# Run complete test suite
npm test
```

### Building for Production
```bash
# Typecheck
npx tsc --noEmit

# Lint
npm run lint

# Production Build
npm run build
```
