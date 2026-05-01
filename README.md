# llm-token-compare

> **Side-by-side token counts and cost across GPT-4o, Claude, Gemini, and Llama.** One API. No keys. Same prompt — see what it costs everywhere.

[![npm](https://img.shields.io/npm/v/llm-token-compare.svg)](https://www.npmjs.com/package/llm-token-compare)
[![types](https://img.shields.io/npm/types/llm-token-compare.svg)](https://www.npmjs.com/package/llm-token-compare)
[![license](https://img.shields.io/npm/l/llm-token-compare.svg)](./LICENSE)
[![bundle](https://img.shields.io/bundlephobia/minzip/llm-token-compare.svg)](https://bundlephobia.com/package/llm-token-compare)

---

```ts
import { compare, findings } from 'llm-token-compare';

const r = await compare(
  'Summarize this article in three bullet points: ...',
  { callsPerMonth: 1_000_000 },
);

r.find((m) => m.model === 'gpt-4o')?.costAtRate;            // 217.50
r.find((m) => m.model === 'gemini-1.5-flash')?.costAtRate;  //  6.52

findings(r);
// → [
//   { level: 'good', text: 'Cheapest: gemini-1.5-flash — 33× less than gpt-4o' },
//   { level: 'good', text: 'Most efficient: gpt-4o (4.22 chars/token)' },
//   { level: 'info', text: 'Token-count spread of 12% across models on this text' },
// ]
```

Runs locally. No API keys. Lazy-loaded tokenizers per family — only the ones you ask about are touched. Tree-shakable subpath imports for every family.

## When you'd use this

`llm-token-compare` answers the four questions every prompt engineer asks before picking a model:

- **What does this prompt cost across providers?** A single call returns `costPer1kCalls` and projected monthly cost for every model.
- **Which tokenizer is most efficient for my content?** Especially relevant for non-English text — Korean tokenization can swing 2× across models on the same string.
- **Will this fit in the context window?** `contextUsedPct` for each model, and `cheapestThatFits()` for hard constraints.
- **Which model gives me the best price for the constraint I have?** `cheapestThatFits(text, { needContext: 128_000 })` returns the cheapest model that fits.

It is **not** a model router and won't predict generation cost — for that, plug the input/output token counts back into your billing model.

## Install

```sh
npm i llm-token-compare
```

Node 18+. ESM and CJS, types included. Works in browsers via the same conditional exports.

Or run it directly without installing:

```sh
npx llm-token-compare "your prompt here"
```

## Quick start

### Library

```ts
import {
  compare,
  cheapestThatFits,
  findings,
  formatTable,
} from 'llm-token-compare';

const text = 'How do I sort a list in Python?';

const results = await compare(text, {
  models: ['gpt-4o', 'claude-3.5-sonnet', 'gemini-1.5-flash', 'llama-3.1'],
  callsPerMonth: 1_000_000,
});

console.log(formatTable(results));
console.log(findings(results, text));

const winner = await cheapestThatFits(text, { needContext: 128_000 });
console.log(`Cheapest fit: ${winner.model} (${winner.costPer1kCalls.toFixed(4)}/1k)`);
```

### CLI

```sh
# Default: compare 4 models, print colored table + token visualization
llm-token-compare "your prompt here"

# Run on built-in showcase corpus (Python, Korean, JSON, prose)
llm-token-compare samples

# Find the cheapest model that fits a context constraint
llm-token-compare cheapest "your text" --context 128k

# Project monthly cost
llm-token-compare "your text" --calls-per-month 1m

# Markdown table — clipboard-friendly for tweets / PRs / Slack
llm-token-compare "your text" --share

# Standalone HTML report with token visualization
llm-token-compare "your text" --html report.html

# JSON for scripting
llm-token-compare "your text" --json

# Pipe stdin or read a file
cat prompt.txt | llm-token-compare
llm-token-compare -f prompt.txt

# Restrict / expand the model set
llm-token-compare "..." --models gpt-4o,claude-3.5-sonnet
llm-token-compare "..." --all
```

## Models

| Model | Family | Encoding | Context window | Input $/M tokens | Accuracy |
| --- | --- | --- | ---: | ---: | --- |
| `gpt-4o` | OpenAI | `o200k_base` | 128k | $2.50 | exact |
| `gpt-4-turbo` | OpenAI | `cl100k_base` | 128k | $10.00 | exact |
| `gpt-3.5-turbo` | OpenAI | `cl100k_base` | 16k | $0.50 | exact |
| `claude-3.5-sonnet` | Anthropic | `claude-bpe` | 200k | $3.00 | approx |
| `claude-3-opus` | Anthropic | `claude-bpe` | 200k | $15.00 | approx |
| `claude-3-haiku` | Anthropic | `claude-bpe` | 200k | $0.25 | approx |
| `gemini-1.5-pro` | Google | `sentencepiece-est` | 2M | $1.25 | approx |
| `gemini-1.5-flash` | Google | `sentencepiece-est` | 1M | $0.075 | approx |
| `llama-3.1` | Meta | `tiktoken-llama3` | 128k | local ($0) | exact |
| `llama-3` | Meta | `tiktoken-llama3` | 8k | local ($0) | exact |

The default 4-model preset (when `models` is omitted) is `gpt-4o`, `claude-3.5-sonnet`, `gemini-1.5-flash`, `llama-3.1` — one per family, picked to be the most representative current generation. Use `models: [...]` for an explicit list, or `--all` on the CLI.

## Accuracy: exact vs approximate

This is the part most token tools quietly fudge. The truth:

| Family | Library | What it gives you |
| --- | --- | --- |
| OpenAI | [`js-tiktoken`](https://github.com/dqbd/tiktoken/tree/main/js) (BPE) | **Exact.** Identical to OpenAI's reference tokenizer for `cl100k_base` and `o200k_base`. |
| Meta (Llama 3 / 3.1) | [`llama3-tokenizer-js`](https://github.com/belladoreai/llama3-tokenizer-js) | **Exact.** Vocab baked into the package. BOS/EOS suppressed for fair comparison. |
| Anthropic (Claude 3 / 3.5) | [`@anthropic-ai/tokenizer`](https://github.com/anthropics/anthropic-tokenizer-typescript) (Claude-2 BPE) | **Approx.** Anthropic publishes no local tokenizer for Claude 3+. The Claude-2 tokenizer is the best local approximation; expect ±10% drift on English, more on multilingual content. |
| Google (Gemini 1.5) | `cl100k_base` proxy | **Approx.** Google publishes no local tokenizer at all. We use OpenAI's cl100k as a proxy; expect ±15% drift on English content and larger drift on multilingual text. |

Every output (table, JSON, markdown, HTML) tags each row with `accuracy: 'exact' | 'approx'`. The auto-generated findings will flag a non-ASCII text warning when calibration drift is most likely.

If you need exact Claude / Gemini counts and you have API keys, that's planned for v0.2 (`apiMode: 'anthropic' | 'google'`). For v0.1 the design choice is **fully local, no setup, transparent labels**.

## Cost: pricing data

Pricing lives in [`src/data/pricing.json`](./src/data/pricing.json) with an `as_of` date, currency, and per-model `input_per_1m` / `output_per_1m` / `context_window` / optional `self_hosted` flag. The package exports the snapshot date so you can surface it in your own UI:

```ts
import { PRICING_AS_OF, PRICING_CURRENCY } from 'llm-token-compare';

console.log(`Pricing as of ${PRICING_AS_OF} (${PRICING_CURRENCY})`);
```

To check freshness:

```sh
npm run sync-pricing
# warns to stderr if the snapshot is more than 30 days old, exits 0
```

Pull requests against `pricing.json` are very welcome — see [Contributing](#contributing).

## Output formats

A single `compare()` call feeds five formatters:

```ts
import {
  compare,
  formatTable,         // colored terminal table
  formatVisualization, // colored token-by-token strip (terminal)
  formatMarkdown,      // markdown table — clipboard / PRs / blogs
  formatHtml,          // standalone HTML report with token viz
  formatJson,          // JSON envelope { results, findings? }
} from 'llm-token-compare';

const results = await compare(text);

formatTable(results, { color: true });
await formatVisualization(text, 'gpt-4o', { color: true });
formatMarkdown(results);
await formatHtml(text, results);   // returns a full <!doctype html> string
formatJson({ results });
```

The HTML output is a single self-contained file (inline CSS, no scripts, no external assets) suitable for embedding in blog posts or sending in Slack.

## Subpath imports

If you only need one family, import its tokenizer directly. These are **synchronous** (the lazy-loading registry is bypassed) and tree-shakable:

```ts
import { count, tokenize } from 'llm-token-compare/openai';
import { count as llamaCount } from 'llm-token-compare/meta';
import { count as claudeCount } from 'llm-token-compare/anthropic';
import { count as geminiCount } from 'llm-token-compare/google';

count('hello world', 'gpt-4o');             // 2
llamaCount('hello world', 'llama-3.1');     // 2
claudeCount('hello world', 'claude-3-haiku');
geminiCount('hello world', 'gemini-1.5-flash');
```

Each subpath only pulls in its own tokenizer dependency — useful when you're shipping to the browser and don't want all four.

## API

```ts
function compare(text: string, opts?: CompareOptions): Promise<CompareResult[]>;
function count(text: string, model: ModelId): Promise<number>;
function tokenize(text: string, model: ModelId): Promise<TokenizeResult>;
function cost(text: string, model: ModelId, opts?: { calls?: number }): Promise<CostResult>;
function cheapestThatFits(text: string, opts?: CheapestOptions): Promise<CheapestResult>;
function findings(results: CompareResult[], sourceText?: string): Finding[];

interface CompareOptions {
  models?: ModelId[];          // default: 4-model preset
  callsPerMonth?: number;      // populates costAtRate per model
}

interface CompareResult {
  model: ModelId;
  family: 'openai' | 'anthropic' | 'google' | 'meta';
  encoding: string;
  tokens: number;
  characters: number;
  charsPerToken: number;
  contextWindow: number;
  contextUsedPct: number;
  costPer1kCalls: number;      // USD
  costAtRate?: number;         // present iff callsPerMonth was provided
  accuracy: 'exact' | 'approx';
  selfHosted: boolean;         // true for llama-* (input cost = 0)
}

interface TokenizeResult {
  ids: number[];
  pieces: string[];            // decoded per-token strings (visualization-ready)
}

interface CheapestOptions {
  needContext?: number;        // require contextWindow >= n
  mustBeExact?: boolean;       // restrict to exact tokenizers (openai, meta)
  callsPerMonth?: number;
}

interface CheapestResult {
  model: ModelId;
  costPer1kCalls: number;
  contextUsedPct: number;
  savingsVs?: { model: ModelId; costPer1kCalls: number; pct: number };
}

interface Finding {
  level: 'good' | 'info' | 'warn';
  text: string;
}

type ModelId =
  | 'gpt-4o' | 'gpt-4-turbo' | 'gpt-3.5-turbo'
  | 'claude-3.5-sonnet' | 'claude-3-opus' | 'claude-3-haiku'
  | 'gemini-1.5-pro' | 'gemini-1.5-flash'
  | 'llama-3.1' | 'llama-3';
```

Helpers:

```ts
import {
  ALL_MODELS,        // ModelId[] of every supported model
  DEFAULT_MODELS,    // the 4-model preset
  models,            // Record<ModelId, ModelInfo>
  getModel,          // (id) => ModelInfo, throws on unknown
  isModelId,         // type guard
  samples,           // { python, korean, json, prose } — built-in showcase texts
  costPer1kCalls,    // (tokens, $/M) => USD
  tokensToCost,      // (tokens, $/M) => USD per call
} from 'llm-token-compare';
```

## CLI reference

```
llm-token-compare [text] [options]

  -f, --file <path>            Read input from a file
  -m, --models <list>          Comma-separated model ids (default: 4-model preset)
      --all                    Compare all 10 supported models
      --calls-per-month <n>    Project monthly cost at this volume (accepts 1k, 1m, 1b)
      --no-viz                 Skip the token visualization panel
      --no-color               Disable colored output
      --share                  Print a markdown table (clipboard-friendly)
      --json                   Emit JSON: { results, findings }
      --html <path>            Write a standalone HTML report

llm-token-compare samples [options]
  -m, --models <list>          Same flags as above
      --all
      --no-color

llm-token-compare cheapest <text> [options]
  -c, --context <n>            Required context window (e.g. 128k, 1m)
      --exact                  Restrict to families with exact local tokenizers

llm-token-compare --version
llm-token-compare --help
```

## Benchmarks

Run `npm run bench` to reproduce locally. Benched on Apple M-series, Node 20.

**Compare across 4 default models** (initial tokenizer load amortized):

| Sample | Chars | ms / call |
| --- | ---: | ---: |
| `python` (a quicksort snippet) | 350 | ~25 ms |
| `korean` (paragraph of CJK) | 171 | ~26 ms |
| `json` (nested user object) | 437 | ~25 ms |
| `prose` (Gettysburg, opening) | 309 | ~26 ms |

**Compare across all 10 models, single prose call:** ~75 ms.

**Built-in showcase corpus** (`llm-token-compare samples`) — same text, four models, four content types. Notable values:

| Sample | gpt-4o tokens | claude-3.5 tokens | gemini-1.5-flash tokens | llama-3.1 tokens |
| --- | ---: | ---: | ---: | ---: |
| `python` (350 chars) | 117 | 119 | 113 | 117 |
| `korean` (171 chars) | **88** | **177** | 145 | **94** |
| `json` (437 chars) | 155 | 161 | 150 | 155 |
| `prose` (309 chars) | 62 | 63 | 60 | 62 |

Korean is the killer line: same input, **2× spread** between Claude 3.5 and GPT-4o, with proportional cost impact. This is the kind of number you can only see by comparing.

**Bundle size**

| Entry | Code only |
| --- | ---: |
| `llm-token-compare` (full barrel, ESM) | 24 KB |
| `llm-token-compare/openai` | 0.85 KB |
| `llm-token-compare/anthropic` | 0.81 KB |
| `llm-token-compare/google` | 0.80 KB |
| `llm-token-compare/meta` | 0.66 KB |
| CLI (minified) | 29 KB |

Tokenizer dependencies (`js-tiktoken`, `llama3-tokenizer-js`, `@anthropic-ai/tokenizer`) ship as runtime dependencies and load lazily — the full barrel only initializes the families it's asked about.

## FAQ

**Do I need API keys?** No. Everything runs locally. v0.2 will add an opt-in API mode for exact Claude / Gemini counts; v0.1 is fully offline.

**How wrong are the `approx` numbers?** For English: ±10% on Anthropic, ±15% on Google, in our internal tests. For multilingual content the drift can be larger — `findings()` flags this when non-ASCII content exceeds 30%.

**Why is `gemini-1.5-flash` so cheap in the comparison?** Because it actually is. Google's pricing on Flash is roughly 1/30th of Claude 3.5 Sonnet's input rate. The package surfaces that, but the call you'd make on quality is yours — token-cost parity is not output-quality parity.

**Why bundle several tokenizers — isn't this big?** The lazy registry only initializes the families you actually compare against, so a `compare(text, { models: ['gpt-4o'] })` call never touches Llama or Anthropic code. For browser bundles, use the subpath imports (`/openai`, `/meta`, etc.) to avoid pulling in tokenizers you don't need.

**Does it work in browsers?** Yes. The dual ESM/CJS build ships conditional exports; `js-tiktoken` and `llama3-tokenizer-js` are pure JS; the Anthropic tokenizer is WASM-backed and works in modern browsers. The `formatHtml()` output is a self-contained HTML file — perfect for embedding in static sites.

**How do I count output (completion) tokens?** v0.1 is input-only. For most prompt-engineering decisions the input dominates; for end-to-end cost you'll multiply your generation tokens by `output_per_1m` from `pricing.json`. Built-in support is on the v0.3 roadmap.

**Why isn't `gpt-4o-mini` / `claude-haiku-4` / `gemini-2.5` here?** v0.1 ships one entry per current generation across the four families — see the table in [Models](#models). Adding a new variant is one entry in `pricing.json` plus an entry in the encoding map; PRs welcome.

**Are the token IDs / pieces accurate for `approx` families?** The `pieces` returned by `tokenize()` for Anthropic are real — but from the Claude-2 vocab. For Google they reflect cl100k_base, which is a proxy. The visualization is a useful approximation, not a ground-truth tokenization.

## Roadmap

- **v0.2** — opt-in API mode for exact Claude / Gemini counts via Anthropic's `count_tokens` and Google's `countTokens` endpoints. Same `compare()` shape, accuracy upgrades to `'exact'` when keys are present.
- **v0.3** — output token estimation + completion-cost surfacing. Add `outputCost`, `costPerCallEstimated` columns and an `--out-tokens` CLI flag.
- **v0.4** — companion entry points: an MCP server (`llm-token-compare/mcp`) for Claude Desktop / Cursor, a GitHub Action that comments on PRs with token deltas across models for changed prompt files, and a Vercel-hosted demo page.

## Contributing

The single biggest way to improve this package is to keep its data current.

- [`src/data/pricing.json`](./src/data/pricing.json) — input/output dollars per million tokens, context window, snapshot date. Add a new model, bump a price, refresh `as_of` after sweeping the values.
- [`src/data/samples/index.ts`](./src/data/samples/index.ts) — the four showcase texts. New languages or content types are welcome (rule of thumb: pick something whose tokenization differs visibly across providers).
- [`test/fixtures/known-counts.json`](./test/fixtures/known-counts.json) — hand-verified token counts driving the regression tests. Add new cases here when you want to lock down behavior.

Code-level contributions equally welcome — the codebase is small (under 1k LoC), strictly typed, and Biome-formatted. `npm run lint && npm test` before opening a PR.

## Author

**Cihangir Bozdogan** — [bozdogan.cihangir@gmail.com](mailto:bozdogan.cihangir@gmail.com)

## License

MIT © 2026 — see [LICENSE](./LICENSE).
