import { describe, expect, it } from 'vitest';
import { compare } from '../src/core/compare.js';
import { findings } from '../src/core/findings.js';
import { formatHtml } from '../src/format/html.js';
import { formatJson } from '../src/format/json.js';
import { formatMarkdown } from '../src/format/markdown.js';
import { formatFindings, formatTable } from '../src/format/table.js';
import { formatVisualization, renderVisualization } from '../src/format/visualization.js';

describe('format/table', () => {
  it('renders a header row + one row per result, no color', async () => {
    const r = await compare('hello world');
    const out = formatTable(r, { color: false });
    expect(out.split('\n').length).toBe(2 + r.length);
    expect(out).toContain('Model');
    expect(out).toContain('Tokens');
    expect(out).toContain('gpt-4o');
  });

  it('shows $/mo column when results have costAtRate', async () => {
    const r = await compare('hi', { models: ['gpt-4o'], callsPerMonth: 1000 });
    const out = formatTable(r, { color: false });
    expect(out).toContain('$/mo');
  });
});

describe('format/findings', () => {
  it('prefixes good with ✓', async () => {
    const r = await compare('hi', { models: ['gpt-4o', 'claude-3-opus'] });
    const fs = findings(r);
    const out = formatFindings(fs, { color: false });
    expect(out).toContain('✓');
  });
});

describe('format/markdown', () => {
  it('produces a markdown table', async () => {
    const r = await compare('hello', { models: ['gpt-4o', 'llama-3.1'] });
    const md = formatMarkdown(r);
    expect(md.startsWith('| Model |')).toBe(true);
    expect(md).toContain('`gpt-4o`');
    expect(md).toContain('local');
  });
});

describe('format/json', () => {
  it('serializes results and findings', async () => {
    const r = await compare('hello', { models: ['gpt-4o'] });
    const out = formatJson({ results: r, findings: findings(r) });
    const parsed = JSON.parse(out);
    expect(Array.isArray(parsed.results)).toBe(true);
    expect(parsed.results[0].model).toBe('gpt-4o');
  });
});

describe('format/html', () => {
  it('produces a self-contained HTML document', async () => {
    const r = await compare('hello world', { models: ['gpt-4o', 'claude-3.5-sonnet'] });
    const html = await formatHtml('hello world', r);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<style>');
    expect(html).toContain('gpt-4o');
    expect(html).toContain('class="tok"');
  });
});

describe('format/visualization', () => {
  it('returns a non-empty string with no color', async () => {
    const out = await formatVisualization('hello world', 'gpt-4o', { color: false });
    expect(out).toContain('[hello]');
  });

  it('renderVisualization can render a precomputed result', () => {
    const out = renderVisualization({ ids: [1, 2], pieces: ['ab', 'cd'] }, { color: false });
    expect(out).toBe('[ab][cd]');
  });

  it('renderVisualization truncates with ellipsis past maxPieces', () => {
    const ids = Array.from({ length: 5 }, (_, i) => i);
    const pieces = ['a', 'b', 'c', 'd', 'e'];
    const out = renderVisualization({ ids, pieces }, { color: false, maxPieces: 3 });
    expect(out).toBe('[a][b][c] …');
  });

  it('aligns colored table columns by visible width (ANSI-aware)', async () => {
    const r = await compare('hi', { models: ['gpt-4o', 'llama-3.1'] });
    const out = formatTable(r, { color: true });
    const lines = out.split('\n');
    expect(lines.length).toBe(2 + r.length);
    // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping ANSI escape sequences
    const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');
    const widths = lines.map((l) => stripAnsi(l).length);
    expect(widths.every((w) => w === widths[0])).toBe(true);
  });
});

describe('format/markdown edge cases', () => {
  it('returns a placeholder for empty results', () => {
    expect(formatMarkdown([])).toBe('_No results_');
  });

  it('includes a $/mo column when costAtRate is present', async () => {
    const r = await compare('hi', { models: ['gpt-4o'], callsPerMonth: 1000 });
    const md = formatMarkdown(r);
    expect(md).toContain('$/mo');
  });
});

describe('format/json edge cases', () => {
  it('non-pretty mode emits a single line', async () => {
    const r = await compare('hi', { models: ['gpt-4o'] });
    const out = formatJson({ results: r }, false);
    expect(out.includes('\n')).toBe(false);
  });
});
