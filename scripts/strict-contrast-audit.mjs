function getLuminance(hex) {
  const rgb = hex.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16) / 255);
  const a = rgb.map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function getContrast(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return Math.round(ratio * 100) / 100;
}

const pairs = [
  // Primary & Secondary text on cards / canvas
  { fg: '#102A43', bg: '#FFFFFF', name: 'Navy 900 on White Card' },
  { fg: '#102A43', bg: '#F6F9FC', name: 'Navy 900 on Canvas' },
  { fg: '#52667A', bg: '#FFFFFF', name: 'Navy 600 on White Card (replaces 7B8A9A)' },
  { fg: '#52667A', bg: '#F6F9FC', name: 'Navy 600 on Canvas' },

  // Buttons (White text on solid backgrounds)
  { fg: '#FFFFFF', bg: '#0A6E62', name: 'White Text on Deep Teal Button' },
  { fg: '#FFFFFF', bg: '#08544B', name: 'White Text on Deep Teal Hover' },
  { fg: '#FFFFFF', bg: '#047857', name: 'White Text on Emerald 700 Button' },
  { fg: '#FFFFFF', bg: '#065F46', name: 'White Text on Emerald 800 Hover' },
  { fg: '#102A43', bg: '#F0F4F8', name: 'Navy 900 on Subtle Gray Button' },

  // Badges (Text on light tinted backgrounds)
  { fg: '#0A6E62', bg: '#EAF8F5', name: 'Teal 700 on Teal 50 Badge' },
  { fg: '#065F46', bg: '#ECFDF5', name: 'Emerald 800 on Emerald 50 Badge' },
  { fg: '#1E40AF', bg: '#EDF5FF', name: 'Blue 800 on Blue 50 Badge' },
  { fg: '#92400E', bg: '#FFF7E6', name: 'Amber 800 on Amber 50 Badge' },
  { fg: '#991B1B', bg: '#FFF0EB', name: 'Red 800 on Red 50 Card' },

  // Interactive Focus & Form Controls
  { fg: '#102A43', bg: '#FFFFFF', name: 'Form Inputs Value on White' },
  { fg: '#52667A', bg: '#FFFFFF', name: 'Form Labels / Placeholders on White' }
];

console.log('=== STRICT WCAG AA (>= 4.5:1) CONTRAST AUDIT ===');
let failed = 0;
pairs.forEach(p => {
  const c = getContrast(p.fg, p.bg);
  const pass = c >= 4.5;
  if (!pass) failed++;
  console.log(`  ${(pass ? 'PASS (AA)' : 'FAIL').padEnd(12)} ${c}:1  ${p.name} (${p.fg} on ${p.bg})`);
});

console.log(`\nSummary: ${pairs.length - failed}/${pairs.length} passed strictly (>= 4.5:1).`);
if (failed > 0) process.exit(1);
