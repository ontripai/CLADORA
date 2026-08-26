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

## Database Foundation

The complete CLADORA Supabase blueprint is included under `supabase/`:

- migrations `000–021`
- 112 tables and 115 RLS policies
- 11 pgTAP files with 234 assertions
- deterministic synthetic seed data

Run the dependency-free contract check with:

```bash
npm run test:db:static
```

With Docker and Supabase CLI available:

```bash
npm run db:start
npm run db:reset
npm run db:test
```

Read `docs/database/RUNTIME_VALIDATION_RUNBOOK_FA.md` before linking a remote project.

## Supabase application foundation

The application uses request-scoped `@supabase/ssr` clients and signed JWT claim
verification for localized `/ro|en|fa/app/**` routes. Copy `.env.example` to
`.env.local` and provide only the browser-safe project URL and publishable key:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Never expose a Supabase secret or `service_role` key to the browser. Run the
application security contract with:

```bash
npm run test:app-foundation
```
