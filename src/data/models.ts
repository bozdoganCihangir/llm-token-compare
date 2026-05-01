import type { Family, ModelId, ModelInfo } from '../core/types.js';
import pricing from './pricing.json' with { type: 'json' };

interface PricingEntry {
  input_per_1m: number;
  output_per_1m: number;
  context_window: number;
  self_hosted?: boolean;
}

interface PricingData {
  as_of: string;
  currency: string;
  models: Record<string, PricingEntry>;
}

const data = pricing as PricingData;

export const PRICING_AS_OF: string = data.as_of;
export const PRICING_CURRENCY: string = data.currency;

const FAMILY_BY_PREFIX: Array<[string, Family]> = [
  ['gpt-', 'openai'],
  ['claude-', 'anthropic'],
  ['gemini-', 'google'],
  ['llama-', 'meta'],
];

const ENCODING_BY_MODEL: Record<ModelId, string> = {
  'gpt-4o': 'o200k_base',
  'gpt-4-turbo': 'cl100k_base',
  'gpt-3.5-turbo': 'cl100k_base',
  'claude-3.5-sonnet': 'claude-bpe',
  'claude-3-opus': 'claude-bpe',
  'claude-3-haiku': 'claude-bpe',
  'gemini-1.5-pro': 'sentencepiece-est',
  'gemini-1.5-flash': 'sentencepiece-est',
  'llama-3.1': 'tiktoken-llama3',
  'llama-3': 'tiktoken-llama3',
};

const ACCURACY_BY_FAMILY: Record<Family, 'exact' | 'approx'> = {
  openai: 'exact',
  meta: 'exact',
  anthropic: 'approx',
  google: 'approx',
};

function familyOf(modelId: string): Family {
  for (const [prefix, family] of FAMILY_BY_PREFIX) {
    if (modelId.startsWith(prefix)) return family;
  }
  throw new Error(`Unknown model family for "${modelId}"`);
}

function buildRegistry(): Record<ModelId, ModelInfo> {
  const entries = Object.entries(data.models).map(([id, p]) => {
    const family = familyOf(id);
    const info: ModelInfo = {
      id: id as ModelId,
      family,
      encoding: ENCODING_BY_MODEL[id as ModelId],
      contextWindow: p.context_window,
      inputPricePerMillion: p.input_per_1m,
      outputPricePerMillion: p.output_per_1m,
      selfHosted: p.self_hosted ?? false,
      accuracy: ACCURACY_BY_FAMILY[family],
    };
    return [id as ModelId, info] as const;
  });
  return Object.fromEntries(entries) as Record<ModelId, ModelInfo>;
}

export const models: Record<ModelId, ModelInfo> = buildRegistry();

export const ALL_MODELS: ModelId[] = Object.keys(models) as ModelId[];

export const DEFAULT_MODELS: ModelId[] = [
  'gpt-4o',
  'claude-3.5-sonnet',
  'gemini-1.5-flash',
  'llama-3.1',
];

export function getModel(id: ModelId): ModelInfo {
  if (!Object.hasOwn(models, id)) throw new Error(`Unknown model: "${id}"`);
  return models[id];
}

export function isModelId(id: string): id is ModelId {
  return Object.hasOwn(models, id);
}
