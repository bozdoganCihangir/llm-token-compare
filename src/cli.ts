import { readFileSync, writeFileSync } from 'node:fs';
import { cac } from 'cac';
import pc from 'picocolors';
import { compare } from './core/compare.js';
import { cheapestThatFits } from './core/cost.js';
import { findings } from './core/findings.js';
import type { ModelId } from './core/types.js';
import { ALL_MODELS, DEFAULT_MODELS, PRICING_AS_OF, isModelId } from './data/models.js';
import { samples } from './data/samples/index.js';
import { formatHtml } from './format/html.js';
import { formatJson } from './format/json.js';
import { formatMarkdown } from './format/markdown.js';
import { formatFindings, formatTable } from './format/table.js';
import { formatVisualization } from './format/visualization.js';

const cli = cac('llm-token-compare');

cli
  .command('[text]', 'Compare token counts and costs across models')
  .option('-f, --file <path>', 'Read input from a file')
  .option('-m, --models <list>', 'Comma-separated model ids (default: 4-model preset)')
  .option('--all', 'Compare all 10 supported models')
  .option('--calls-per-month <n>', 'Project monthly cost at this call volume')
  .option('--no-viz', 'Skip the token visualization panel')
  .option('--no-color', 'Disable colored output')
  .option('--share', 'Print a markdown table (clipboard-friendly)')
  .option('--json', 'Output JSON')
  .option('--html <path>', 'Write standalone HTML report to file')
  .action(async (text: string | undefined, opts: CliOpts) => {
    const input = await readInput(text, opts.file);
    const models = resolveModels(opts);
    const callsPerMonth = parseRate(opts.callsPerMonth);
    const results = await compare(input, { models, callsPerMonth });
    const useColor = opts.color !== false && !opts.json && !opts.share;

    if (opts.json) {
      const fs = findings(results, input);
      console.log(formatJson({ results, findings: fs }));
      return;
    }
    if (opts.share) {
      console.log(formatMarkdown(results));
      return;
    }
    if (opts.html) {
      const html = await formatHtml(input, results);
      writeFileSync(opts.html, html, 'utf8');
      console.error(pc.green(`✓ wrote ${opts.html}`));
      return;
    }

    await renderDefault(input, results, { color: useColor, viz: opts.viz !== false });
  });

cli
  .command('samples', 'Run the comparison on built-in showcase texts')
  .option('-m, --models <list>', 'Comma-separated model ids')
  .option('--all', 'Compare all 10 supported models')
  .option('--no-color', 'Disable colored output')
  .action(async (opts: CliOpts) => {
    const models = resolveModels(opts);
    const useColor = opts.color !== false;
    const order: Array<keyof typeof samples> = ['python', 'korean', 'json', 'prose'];
    for (const name of order) {
      const text = samples[name];
      const results = await compare(text, { models });
      console.log(pc.bold(`\n── ${name} (${[...text].length} chars) ──`));
      console.log(formatTable(results, { color: useColor }));
    }
  });

cli
  .command('cheapest <text>', 'Find the cheapest model that fits a constraint')
  .option('-c, --context <n>', 'Required context window (e.g. 128k)')
  .option('--exact', 'Restrict to families with exact local tokenizers')
  .action(async (text: string, opts: { context?: string; exact?: boolean }) => {
    const result = await cheapestThatFits(text, {
      needContext: parsePositiveSize(opts.context, '--context'),
      mustBeExact: !!opts.exact,
    });
    console.log(pc.bold(`Cheapest: ${pc.green(result.model)}`));
    console.log(`  $${result.costPer1kCalls.toFixed(4)} per 1,000 calls`);
    console.log(`  ${result.contextUsedPct.toFixed(2)}% of context window`);
    if (result.savingsVs) {
      console.log(
        `  ${result.savingsVs.pct.toFixed(0)}% cheaper than ${result.savingsVs.model} ($${result.savingsVs.costPer1kCalls.toFixed(4)})`,
      );
    }
  });

cli.help();
cli.version(getPkgVersion());

process.on('unhandledRejection', (err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(pc.red(msg));
  process.exit(1);
});

cli.parse();

interface CliOpts {
  file?: string;
  models?: string;
  all?: boolean;
  callsPerMonth?: string;
  color?: boolean;
  viz?: boolean;
  share?: boolean;
  json?: boolean;
  html?: string;
}

async function readInput(text: string | undefined, file?: string): Promise<string> {
  if (file) return readFileSync(file, 'utf8');
  if (text != null && text.length > 0) return text;
  if (!process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks).toString('utf8');
  }
  console.error(pc.red('No input. Pass text as an argument, use -f, or pipe via stdin.'));
  process.exit(1);
}

function resolveModels(opts: { models?: string; all?: boolean }): ModelId[] {
  if (opts.all) return [...ALL_MODELS];
  if (!opts.models) return [...DEFAULT_MODELS];
  const ids = opts.models.split(',').map((s) => s.trim());
  for (const id of ids) {
    if (!isModelId(id)) {
      console.error(pc.red(`Unknown model: "${id}"`));
      console.error(`Supported: ${ALL_MODELS.join(', ')}`);
      process.exit(1);
    }
  }
  return ids as ModelId[];
}

function parseRate(s?: string): number | undefined {
  return parsePositiveSize(s, '--calls-per-month');
}

function parsePositiveSize(s: string | undefined, label: string): number | undefined {
  if (!s) return undefined;
  const n = parseSize(s);
  if (!Number.isFinite(n) || n <= 0) {
    console.error(pc.red(`Invalid ${label}: "${s}"`));
    process.exit(1);
  }
  return n;
}

function parseSize(s: string): number {
  const m = s.toLowerCase().match(/^([\d.]+)\s*([kmb]?)$/);
  if (!m) return Number(s);
  const n = Number(m[1]);
  const suffix = m[2];
  const mult =
    suffix === 'k' ? 1_000 : suffix === 'm' ? 1_000_000 : suffix === 'b' ? 1_000_000_000 : 1;
  return n * mult;
}

async function renderDefault(
  text: string,
  results: Awaited<ReturnType<typeof compare>>,
  opts: { color: boolean; viz: boolean },
): Promise<void> {
  const c = opts.color ? pc : { dim: (s: string) => s, bold: (s: string) => s };
  console.log(c.bold('llm-token-compare') + c.dim(`  ·  ${[...text].length} chars`));
  console.log();
  console.log(formatTable(results, { color: opts.color }));
  console.log();
  const fs = findings(results, text);
  if (fs.length > 0) {
    console.log(c.bold('Findings'));
    console.log(formatFindings(fs, { color: opts.color }));
    console.log();
  }
  if (opts.viz) {
    const exact = results.find((r) => r.accuracy === 'exact') ?? results[0];
    if (exact) {
      console.log(c.bold(`Tokens (${exact.model})`));
      console.log(await formatVisualization(text, exact.model, { color: opts.color }));
      console.log();
    }
  }
  console.log(c.dim(`Pricing as of ${PRICING_AS_OF}`));
}

function getPkgVersion(): string {
  try {
    const url = new URL('../package.json', import.meta.url);
    const pkg = JSON.parse(readFileSync(url, 'utf8')) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}
