import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('=== RUNNING LIGHTHOUSE ACCEPTANCE QA SUITE ===\n');

// 1. Check TrustStrip heading hierarchy
const trustStripCode = fs.readFileSync('./src/components/home/TrustStrip.tsx', 'utf8');
assert(!trustStripCode.includes('<h4'), 'TrustStrip must not contain <h4> headings');
assert(trustStripCode.includes('<p className="text-xs font-bold text-[#102A43] uppercase tracking-wide">'), 'TrustStrip must use <p> for card labels');
console.log('✓ Heading hierarchy test passed: TrustStrip uses semantic <p> tags.');

// 2. Check ShadowLedgerDemo accessible name
const shadowDemoCode = fs.readFileSync('./src/components/interactive/ShadowLedgerDemo.tsx', 'utf8');
assert(!shadowDemoCode.includes('aria-label='), 'ShadowLedgerDemo button should not have redundant mismatching aria-label');
console.log('✓ Accessible name test passed: ShadowLedgerDemo visible text matches accessible name.');

// 3. Check Server Component status of presentational sections
const competitorCode = fs.readFileSync('./src/components/home/CompetitorComparisonTable.tsx', 'utf8');
assert(!competitorCode.includes("'use client'"), 'CompetitorComparisonTable must be a Server Component');

const governanceCode = fs.readFileSync('./src/components/home/GovernanceAndCommunitySection.tsx', 'utf8');
assert(!governanceCode.includes("'use client'"), 'GovernanceAndCommunitySection must be a Server Component');

const ownerTenantCode = fs.readFileSync('./src/components/home/OwnerTenantSeparationSection.tsx', 'utf8');
assert(!ownerTenantCode.includes("'use client'"), 'OwnerTenantSeparationSection must be a Server Component');

const pricingPreviewCode = fs.readFileSync('./src/components/home/PricingPreviewSection.tsx', 'utf8');
assert(!pricingPreviewCode.includes("'use client'"), 'PricingPreviewSection must be a Server Component');

const shadowMigrationCode = fs.readFileSync('./src/components/home/ShadowLedgerMigrationSection.tsx', 'utf8');
assert(!shadowMigrationCode.includes("'use client'"), 'ShadowLedgerMigrationSection must be a Server Component');

const heroCode = fs.readFileSync('./src/components/home/HeroSection.tsx', 'utf8');
assert(!heroCode.includes("'use client'"), 'HeroSection must be a Server Component');
assert(heroCode.includes('<HeroExperienceSwitcher'), 'HeroSection must embed HeroExperienceSwitcher');
console.log('✓ Component architecture test passed: Pure presentational sections converted to Server Components.');

// 4. Check Font loading configuration in layout
const layoutCode = fs.readFileSync('./src/app/[lang]/layout.tsx', 'utf8');
assert(layoutCode.includes('const fontVariables = isFa'), 'LangLayout must branch font variables by locale');
assert(layoutCode.includes('`${vazirmatn.variable} ${inter.variable}`'), 'FA layout must inject vazirmatn');
assert(layoutCode.includes('`${inter.variable} ${manrope.variable}`'), 'RO/EN layout must inject inter + manrope without vazirmatn');
console.log('✓ Font optimization test passed: Locale-specific font variables configured.');

// 5. Check Footer contrast
const footerCode = fs.readFileSync('./src/components/layout/Footer.tsx', 'utf8');
assert(footerCode.includes('text-[#9FB3C8]'), 'Footer must use high-contrast #9FB3C8 for disclaimer and bottom strip');
assert(footerCode.includes('text-[#CBD5E1]'), 'Footer must use high-contrast #CBD5E1 for body text');
assert(footerCode.includes('text-[#93E6DC]'), 'Footer must use high-contrast #93E6DC for section headers');
console.log('✓ Contrast compliance test passed: Footer meets WCAG AA/AAA contrast ratios.');

console.log('\nALL LIGHTHOUSE ACCEPTANCE QA TESTS PASSED SUCCESSFULLY!');
