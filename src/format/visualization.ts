import pc from 'picocolors';
import type { ModelId, TokenizeResult } from '../core/types.js';
import { tokenizeText } from '../tokenizers/registry.js';

const TERMINAL_PALETTE = [
  (s: string) => pc.bgBlue(pc.white(s)),
  (s: string) => pc.bgMagenta(pc.white(s)),
  (s: string) => pc.bgCyan(pc.black(s)),
  (s: string) => pc.bgGreen(pc.black(s)),
  (s: string) => pc.bgYellow(pc.black(s)),
];

export interface VisualizationOptions {
  color?: boolean;
  maxPieces?: number;
}

export async function formatVisualization(
  text: string,
  model: ModelId,
  opts: VisualizationOptions = {},
): Promise<string> {
  const result = await tokenizeText(text, model);
  return renderVisualization(result, opts);
}

export function renderVisualization(
  result: TokenizeResult,
  opts: VisualizationOptions = {},
): string {
  const color = opts.color ?? true;
  const max = opts.maxPieces ?? 200;
  const pieces = result.pieces.slice(0, max);
  const truncated = result.pieces.length > max;

  if (!color) {
    return pieces.map((p) => `[${visible(p)}]`).join('') + (truncated ? ' …' : '');
  }

  const out = pieces
    .map((p, i) => {
      const paint = pickPaint(i);
      return paint(visible(p));
    })
    .join('');

  return truncated ? `${out} ${pc.dim('…')}` : out;
}

function pickPaint(i: number): (s: string) => string {
  const idx = i % TERMINAL_PALETTE.length;
  const paint = TERMINAL_PALETTE[idx] ?? TERMINAL_PALETTE[0];
  return paint ?? ((s: string) => s);
}

function visible(s: string): string {
  return s.replace(/\n/g, '⏎').replace(/\t/g, '→') || '·';
}
