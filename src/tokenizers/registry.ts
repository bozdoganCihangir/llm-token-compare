import type { Family, ModelId, TokenizeResult } from '../core/types.js';
import { getModel } from '../data/models.js';

interface FamilyTokenizer {
  count(text: string, model?: ModelId): number;
  tokenize(text: string, model?: ModelId): TokenizeResult;
}

const cache = new Map<Family, FamilyTokenizer>();

async function load(family: Family): Promise<FamilyTokenizer> {
  const cached = cache.get(family);
  if (cached) return cached;
  let mod: FamilyTokenizer;
  switch (family) {
    case 'openai':
      mod = await import('./openai.js');
      break;
    case 'anthropic':
      mod = await import('./anthropic.js');
      break;
    case 'google':
      mod = await import('./google.js');
      break;
    case 'meta':
      mod = await import('./meta.js');
      break;
  }
  cache.set(family, mod);
  return mod;
}

export async function countTokens(text: string, model: ModelId): Promise<number> {
  const info = getModel(model);
  const tk = await load(info.family);
  return tk.count(text, model);
}

export async function tokenizeText(text: string, model: ModelId): Promise<TokenizeResult> {
  const info = getModel(model);
  const tk = await load(info.family);
  return tk.tokenize(text, model);
}
