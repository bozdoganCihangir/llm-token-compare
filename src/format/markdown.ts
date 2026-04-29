import type { CompareResult } from '../core/types.js';

export function formatMarkdown(results: CompareResult[], opts: { title?: string } = {}): string {
  if (results.length === 0) return '_No results_';
  const showRate = results.some((r) => r.costAtRate != null);
  const headers = ['Model', 'Tokens', 'c/tok', '$/1k', 'ctx%', 'Accuracy'];
  if (showRate) headers.push('$/mo');

  const rows = results.map((r) => {
    const row = [
      `\`${r.model}\``,
      String(r.tokens),
      r.charsPerToken.toFixed(2),
      formatCost(r),
      formatPct(r.contextUsedPct),
      r.accuracy,
    ];
    if (showRate) row.push(formatRate(r));
    return row;
  });

  const lines: string[] = [];
  if (opts.title) lines.push(`### ${opts.title}`, '');
  lines.push(`| ${headers.join(' | ')} |`);
  lines.push(`| ${headers.map(() => '---').join(' | ')} |`);
  for (const row of rows) lines.push(`| ${row.join(' | ')} |`);
  return lines.join('\n');
}

function formatCost(r: CompareResult): string {
  if (r.selfHosted) return 'local';
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
