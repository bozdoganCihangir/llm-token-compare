import { type Tiktoken, getEncoding } from 'js-tiktoken';
import type { ModelId, TokenizeResult } from '../core/types.js';

type GoogleModelId = 'gemini-1.5-pro' | 'gemini-1.5-flash';

const VALID: Record<GoogleModelId, true> = {
  'gemini-1.5-pro': true,
  'gemini-1.5-flash': true,
};

let enc: Tiktoken | null = null;
function getProxy(): Tiktoken {
  if (!enc) enc = getEncoding('cl100k_base');
  return enc;
}

function asGoogle(model: ModelId | undefined): GoogleModelId {
  const m = model ?? 'gemini-1.5-flash';
  if (Object.hasOwn(VALID, m)) return m as GoogleModelId;
  throw new Error(`Not a Google/Gemini model: "${m}"`);
}

export function count(text: string, model?: ModelId): number {
  asGoogle(model);
  return getProxy().encode(text).length;
}

export function tokenize(text: string, model?: ModelId): TokenizeResult {
  asGoogle(model);
  const proxy = getProxy();
  const ids = proxy.encode(text);
  const pieces = ids.map((id) => proxy.decode([id]));
  return { ids, pieces };
}
