import { getTokenizer } from '@anthropic-ai/tokenizer';
import type { ModelId, TokenizeResult } from '../core/types.js';

type AnthropicModelId = 'claude-3.5-sonnet' | 'claude-3-opus' | 'claude-3-haiku';

const VALID: Record<AnthropicModelId, true> = {
  'claude-3.5-sonnet': true,
  'claude-3-opus': true,
  'claude-3-haiku': true,
};

const decoder = new TextDecoder('utf-8');

type AnthropicTokenizer = ReturnType<typeof getTokenizer>;
let cached: AnthropicTokenizer | null = null;
function getCached(): AnthropicTokenizer {
  if (!cached) cached = getTokenizer();
  return cached;
}

function asAnthropic(model: ModelId | undefined): AnthropicModelId {
  const m = model ?? 'claude-3.5-sonnet';
  if (Object.hasOwn(VALID, m)) return m as AnthropicModelId;
  throw new Error(`Not an Anthropic model: "${m}"`);
}

export function count(text: string, model?: ModelId): number {
  asAnthropic(model);
  return getCached().encode(text, 'all').length;
}

export function tokenize(text: string, model?: ModelId): TokenizeResult {
  asAnthropic(model);
  const tok = getCached();
  const encoded = tok.encode(text, 'all');
  const ids = Array.from(encoded);
  const pieces = ids.map((id) => decoder.decode(tok.decode_single_token_bytes(id)));
  return { ids, pieces };
}
