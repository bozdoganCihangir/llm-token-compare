export type ModelId =
  | 'gpt-4o'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'claude-3.5-sonnet'
  | 'claude-3-opus'
  | 'claude-3-haiku'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'llama-3.1'
  | 'llama-3';

export type Family = 'openai' | 'anthropic' | 'google' | 'meta';
export type Accuracy = 'exact' | 'approx';

export interface ModelInfo {
  id: ModelId;
  family: Family;
  encoding: string;
  contextWindow: number;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  selfHosted: boolean;
  accuracy: Accuracy;
}

export interface CompareResult {
  model: ModelId;
  family: Family;
  encoding: string;
  tokens: number;
  characters: number;
  charsPerToken: number;
  contextWindow: number;
  contextUsedPct: number;
  costPer1kCalls: number;
  costAtRate?: number;
  accuracy: Accuracy;
  selfHosted: boolean;
}

export interface CompareOptions {
  models?: ModelId[];
  callsPerMonth?: number;
}

export interface TokenizeResult {
  ids: number[];
  pieces: string[];
}

export interface CostResult {
  perCall: number;
  total: number;
}

export interface CheapestResult {
  model: ModelId;
  costPer1kCalls: number;
  contextUsedPct: number;
  savingsVs?: {
    model: ModelId;
    costPer1kCalls: number;
    pct: number;
  };
}

export interface CheapestOptions {
  needContext?: number;
  mustBeExact?: boolean;
  callsPerMonth?: number;
}
