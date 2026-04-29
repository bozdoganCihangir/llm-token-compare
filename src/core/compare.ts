import { DEFAULT_MODELS, getModel } from '../data/models.js';
import { countTokens, tokenizeText } from '../tokenizers/registry.js';
import { costPer1kCalls, tokensToCost } from './cost.js';
import type { CompareOptions, CompareResult, ModelId, TokenizeResult } from './types.js';

export async function count(text: string, model: ModelId): Promise<number> {
  return countTokens(text, model);
}

export async function tokenize(text: string, model: ModelId): Promise<TokenizeResult> {
  return tokenizeText(text, model);
}

export async function compare(text: string, opts: CompareOptions = {}): Promise<CompareResult[]> {
  const targets = opts.models ?? DEFAULT_MODELS;
  const characters = [...text].length;
  const results = await Promise.all(
    targets.map(async (id) => {
      const info = getModel(id);
      const tokens = await countTokens(text, id);
      const charsPerToken = tokens === 0 ? 0 : characters / tokens;
      const contextUsedPct = (tokens / info.contextWindow) * 100;
      const c1k = costPer1kCalls(tokens, info.inputPricePerMillion);
      const result: CompareResult = {
        model: id,
        family: info.family,
        encoding: info.encoding,
        tokens,
        characters,
        charsPerToken: round(charsPerToken, 2),
        contextWindow: info.contextWindow,
        contextUsedPct: round(contextUsedPct, 4),
        costPer1kCalls: round(c1k, 6),
        accuracy: info.accuracy,
        selfHosted: info.selfHosted,
      };
      if (opts.callsPerMonth != null) {
        result.costAtRate = round(
          tokensToCost(tokens, info.inputPricePerMillion) * opts.callsPerMonth,
          4,
        );
      }
      return result;
    }),
  );
  return results;
}

function round(n: number, places: number): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}
