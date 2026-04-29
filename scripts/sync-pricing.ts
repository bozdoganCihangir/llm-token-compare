import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, '..', 'src', 'data', 'pricing.json');

interface Pricing {
  as_of: string;
  currency: string;
  models: Record<string, { input_per_1m: number; output_per_1m: number; context_window: number }>;
}

const data = JSON.parse(readFileSync(file, 'utf8')) as Pricing;
const asOf = new Date(data.as_of);
const now = new Date();
const ageDays = Math.floor((now.getTime() - asOf.getTime()) / (1000 * 60 * 60 * 24));

console.log(pc.bold('Pricing snapshot'));
console.log(`  as_of:    ${data.as_of}`);
console.log(`  age:      ${ageDays} days`);
console.log(`  models:   ${Object.keys(data.models).length}`);
console.log(`  currency: ${data.currency}`);
console.log();

if (ageDays > 30) {
  console.error(pc.yellow(`⚠  Pricing snapshot is ${ageDays} days old.`));
  console.error(pc.yellow('   Verify against provider pages and update src/data/pricing.json:'));
  console.error('     - https://openai.com/api/pricing/');
  console.error('     - https://www.anthropic.com/pricing');
  console.error('     - https://ai.google.dev/pricing');
  console.error('     - https://www.together.ai/pricing  (Llama hosting reference)');
  process.exit(0);
}

console.log(pc.green('✓ Pricing is current.'));
