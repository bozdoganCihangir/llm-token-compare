import llama3Tokenizer from 'llama3-tokenizer-js';
import type { ModelId, TokenizeResult } from '../core/types.js';

type MetaModelId = 'llama-3.1' | 'llama-3';

const VALID: Record<MetaModelId, true> = {
  'llama-3.1': true,
  'llama-3': true,
};

const ENCODE_OPTS = { bos: false, eos: false } as const;

function asMeta(model: ModelId | undefined): MetaModelId {
  const m = model ?? 'llama-3.1';
  if (Object.hasOwn(VALID, m)) return m as MetaModelId;
  throw new Error(`Not a Meta/Llama model: "${m}"`);
}

export function count(text: string, model?: ModelId): number {
  asMeta(model);
  return llama3Tokenizer.encode(text, ENCODE_OPTS).length;
}

export function tokenize(text: string, model?: ModelId): TokenizeResult {
  asMeta(model);
  const ids = llama3Tokenizer.encode(text, ENCODE_OPTS);
  const pieces = ids.map((id) => llama3Tokenizer.decode([id]));
  return { ids, pieces };
}
