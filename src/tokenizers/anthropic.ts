import { countTokens, getTokenizer } from '@anthropic-ai/tokenizer';
import type { ModelId, TokenizeResult } from '../core/types.js';

type AnthropicModelId = 'claude-3.5-sonnet' | 'claude-3-opus' | 'claude-3-haiku';

const VALID: Record<AnthropicModelId, true> = {
  'claude-3.5-sonnet': true,
  'claude-3-opus': true,
  'claude-3-haiku': true,
};

const decoder = new TextDecoder('utf-8');

function asAnthropic(model: ModelId | undefined): AnthropicModelId {
  const m = model ?? 'claude-3.5-sonnet';
  if (m in VALID) return m as AnthropicModelId;
  throw new Error(`Not an Anthropic model: "${m}"`);
}

export function count(text: string, model?: ModelId): number {
  asAnthropic(model);
  return countTokens(text);
}

export function tokenize(text: string, model?: ModelId): TokenizeResult {
  asAnthropic(model);
  const tok = getTokenizer();
  const encoded = tok.encode(text.normalize('NFKC'), 'all');
  const ids = Array.from(encoded);
  const pieces = ids.map((id) => decoder.decode(tok.decode_single_token_bytes(id)));
  tok.free();
  return { ids, pieces };
}
