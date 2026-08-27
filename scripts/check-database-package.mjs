import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const migrationsDir = join(root, "supabase", "migrations");
const testsDir = join(root, "supabase", "tests");
const migrations = readdirSync(migrationsDir).filter((name) => name.endsWith(".sql")).sort();
const tests = readdirSync(testsDir).filter((name) => name.endsWith(".sql")).sort();

const failures = [];
if (migrations.length !== 29) failures.push(`expected 29 migrations, found ${migrations.length}`);
if (tests.length !== 17) failures.push(`expected 17 pgTAP files, found ${tests.length}`);

for (const [index, name] of migrations.entries()) {
  const expected = String(index).padStart(3, "0");
  if (!name.includes(`${expected}00_`)) failures.push(`${name}: expected migration slot ${expected}`);
  const sql = readFileSync(join(migrationsDir, name), "utf8");
  const begins = (sql.match(/^begin;/gim) ?? []).length;
  const ends = (sql.match(/^(commit|rollback);/gim) ?? []).length;
  if (begins !== ends) failures.push(`${name}: transaction boundary mismatch ${begins}/${ends}`);
  if (/\b(TODO|FIXME)\b/i.test(sql)) failures.push(`${name}: unresolved TODO/FIXME`);
}

let assertionTotal = 0;
for (const name of tests) {
  const sql = readFileSync(join(testsDir, name), "utf8");
  const plan = Number(sql.match(/select\s+plan\((\d+)\)/i)?.[1] ?? -1);
  const assertions = (sql.match(/^select\s+(?:has_schema|has_table|ok\(|lives_ok\(|throws_like\()/gim) ?? []).length;
  assertionTotal += assertions;
  if (plan !== assertions) failures.push(`${name}: plan ${plan} does not match ${assertions} assertions`);
}
if (assertionTotal !== 436) failures.push(`expected 436 assertions, found ${assertionTotal}`);

if (failures.length) {
  console.error("Database package contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Database package contract passed: ${migrations.length} migrations, ${tests.length} tests, ${assertionTotal} assertions.`);
