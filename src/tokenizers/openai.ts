import { type Tiktoken, type TiktokenEncoding, getEncoding } from 'js-tiktoken';
import type { ModelId, TokenizeResult } from '../core/types.js';

type OpenAIModelId = 'gpt-4o' | 'gpt-4-turbo' | 'gpt-3.5-turbo';

const ENCODING_FOR: Record<OpenAIModelId, TiktokenEncoding> = {
  'gpt-4o': 'o200k_base',
  'gpt-4-turbo': 'cl100k_base',
  'gpt-3.5-turbo': 'cl100k_base',
};

const cache = new Map<TiktokenEncoding, Tiktoken>();

function getEnc(model: OpenAIModelId): Tiktoken {
  const name = ENCODING_FOR[model];
  let enc = cache.get(name);
  if (!enc) {
    enc = getEncoding(name);
    cache.set(name, enc);
  }
  return enc;
}

function asOpenAI(model: ModelId | undefined): OpenAIModelId {
  const m = model ?? 'gpt-4o';
  if (m in ENCODING_FOR) return m as OpenAIModelId;
  throw new Error(`Not an OpenAI model: "${m}"`);
}

export function count(text: string, model?: ModelId): number {
  return getEnc(asOpenAI(model)).encode(text).length;
}

export function tokenize(text: string, model?: ModelId): TokenizeResult {
  const enc = getEnc(asOpenAI(model));
  const ids = enc.encode(text);
  const pieces = ids.map((id) => enc.decode([id]));
  return { ids, pieces };
}
