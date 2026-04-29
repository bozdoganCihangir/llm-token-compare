import type { CompareResult } from './types.js';

export interface Finding {
  level: 'info' | 'good' | 'warn';
  text: string;
}

export function findings(results: CompareResult[], sourceText?: string): Finding[] {
  if (results.length === 0) return [];
  const out: Finding[] = [];

  const priced = results.filter((r) => !r.selfHosted && r.costPer1kCalls > 0);
  const sortedPriced = [...priced].sort((a, b) => a.costPer1kCalls - b.costPer1kCalls);
  const cheapest = sortedPriced.at(0);
  const dearest = sortedPriced.at(-1);
  if (priced.length >= 2 && cheapest && dearest) {
    const ratio = dearest.costPer1kCalls / cheapest.costPer1kCalls;
    out.push({
      level: 'good',
      text: `Cheapest: ${cheapest.model} — ${formatRatio(ratio)}× less than ${dearest.model}`,
    });
  }

  const tokenful = results.filter((r) => r.tokens > 0);
  const byEff = [...tokenful].sort((a, b) => b.charsPerToken - a.charsPerToken);
  const best = byEff.at(0);
  if (tokenful.length >= 2 && best) {
    out.push({
      level: 'good',
      text: `Most efficient: ${best.model} (${best.charsPerToken.toFixed(2)} chars/token)`,
    });
  }

  if (tokenful.length >= 2) {
    const counts = tokenful.map((r) => r.tokens);
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    const spreadPct = ((max - min) / min) * 100;
    if (spreadPct > 10) {
      out.push({
        level: 'info',
        text: `Token-count spread of ${spreadPct.toFixed(0)}% across models on this text`,
      });
    }
  }

  for (const r of results) {
    if (r.contextUsedPct > 50) {
      out.push({
        level: 'warn',
        text: `${r.model} uses ${r.contextUsedPct.toFixed(1)}% of its ${formatContext(r.contextWindow)} context`,
      });
    }
  }

  if (sourceText != null && nonAsciiRatio(sourceText) > 0.3) {
    out.push({
      level: 'info',
      text: 'Non-ASCII text detected — tokenizer disparities likely larger than for English',
    });
  }

  return out;
}

function nonAsciiRatio(text: string): number {
  const chars = [...text];
  if (chars.length === 0) return 0;
  let nonAscii = 0;
  for (const ch of chars) {
    const cp = ch.codePointAt(0);
    if (cp != null && cp > 127) nonAscii++;
  }
  return nonAscii / chars.length;
}

function formatRatio(r: number): string {
  if (r >= 10) return r.toFixed(0);
  if (r >= 2) return r.toFixed(1);
  return r.toFixed(2);
}

function formatContext(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}
