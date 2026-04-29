import { performance } from 'node:perf_hooks';
import { compare } from '../src/core/compare.js';
import { samples } from '../src/data/samples/index.js';

const ITER = 100;

async function timed<T>(label: string, fn: () => Promise<T>): Promise<void> {
  await fn();
  const start = performance.now();
  for (let i = 0; i < ITER; i++) await fn();
  const elapsed = performance.now() - start;
  const perRun = elapsed / ITER;
  console.log(
    `${label.padEnd(28)} ${perRun.toFixed(2)} ms/run  (${ITER} iter, total ${elapsed.toFixed(0)} ms)`,
  );
}

async function main() {
  console.log('bench: compare() across 4 default models\n');
  for (const [name, text] of Object.entries(samples)) {
    await timed(`compare("${name}" — ${[...text].length}c)`, () => compare(text));
  }
  console.log();
  await timed('compare(all 10 models, prose)', () =>
    compare(samples.prose, {
      models: [
        'gpt-4o',
        'gpt-4-turbo',
        'gpt-3.5-turbo',
        'claude-3.5-sonnet',
        'claude-3-opus',
        'claude-3-haiku',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'llama-3.1',
        'llama-3',
      ],
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
