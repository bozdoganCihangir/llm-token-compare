import pc from 'picocolors';
import type { Finding } from '../core/findings.js';
import type { CompareResult } from '../core/types.js';

export interface TableOptions {
  color?: boolean;
  showRate?: boolean;
}

const HEADERS = ['Model', 'Tokens', 'c/tok', '$/1k', 'ctx%', 'Accuracy'] as const;

export function formatTable(results: CompareResult[], opts: TableOptions = {}): string {
  const color = opts.color ?? true;
  const c = color ? pc : noColors();

  const rows = results.map((r) => [
    r.model,
    String(r.tokens),
    r.charsPerToken.toFixed(2),
    formatCost(r),
    formatPct(r.contextUsedPct),
    r.accuracy === 'exact' ? c.green('exact') : c.yellow('approx'),
  ]);

  const headerWidths = HEADERS.map((h, i) => {
    const maxRow = Math.max(...rows.map((row) => stripAnsi(row[i] ?? '').length));
    return Math.max(h.length, maxRow);
  });

  const showRate = opts.showRate ?? results.some((r) => r.costAtRate != null);
  const headers = showRate ? [...HEADERS, '$/mo'] : [...HEADERS];

  if (showRate) {
    rows.forEach((row, i) => {
      const r = results[i];
      if (r) row.push(formatRate(r));
    });
    headerWidths.push(Math.max('$/mo'.length, ...rows.map((r) => stripAnsi(r[6] ?? '').length)));
  }

  const lines: string[] = [];
  lines.push(headers.map((h, i) => c.bold(pad(h, headerWidths[i] ?? h.length))).join('  '));
  lines.push(headerWidths.map((w) => '─'.repeat(w)).join('  '));
  for (const row of rows) {
    lines.push(row.map((cell, i) => padAnsi(cell, headerWidths[i] ?? cell.length)).join('  '));
  }

  return lines.join('\n');
}

export function formatFindings(items: Finding[], opts: TableOptions = {}): string {
  const color = opts.color ?? true;
  const c = color ? pc : noColors();
  return items
    .map((f) => {
      const icon =
        f.level === 'good' ? c.green('✓') : f.level === 'warn' ? c.yellow('⚠') : c.cyan('i');
      return `${icon} ${f.text}`;
    })
    .join('\n');
}

function formatCost(r: CompareResult): string {
  if (r.selfHosted) return 'local';
  if (r.costPer1kCalls === 0) return '$0';
  if (r.costPer1kCalls < 0.01) return `$${r.costPer1kCalls.toFixed(4)}`;
  if (r.costPer1kCalls < 1) return `$${r.costPer1kCalls.toFixed(3)}`;
  return `$${r.costPer1kCalls.toFixed(2)}`;
}

function formatRate(r: CompareResult): string {
  if (r.costAtRate == null) return '—';
  if (r.selfHosted) return 'local';
  if (r.costAtRate >= 1000) return `$${Math.round(r.costAtRate).toLocaleString('en-US')}`;
  if (r.costAtRate >= 1) return `$${r.costAtRate.toFixed(2)}`;
  return `$${r.costAtRate.toFixed(4)}`;
}

function formatPct(p: number): string {
  if (p < 0.01) return `${p.toFixed(4)}%`;
  if (p < 1) return `${p.toFixed(2)}%`;
  return `${p.toFixed(1)}%`;
}

function pad(s: string, width: number): string {
  return s + ' '.repeat(Math.max(0, width - s.length));
}

function padAnsi(s: string, width: number): string {
  const visible = stripAnsi(s).length;
  return s + ' '.repeat(Math.max(0, width - visible));
}

function stripAnsi(s: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping ANSI escape sequences
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

function noColors() {
  const id = (s: string) => s;
  return {
    bold: id,
    green: id,
    yellow: id,
    cyan: id,
    red: id,
    dim: id,
    blue: id,
    magenta: id,
  } as unknown as typeof pc;
}
