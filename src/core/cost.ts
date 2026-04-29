import { getModel } from '../data/models.js';
import { ALL_MODELS } from '../data/models.js';
import { countTokens } from '../tokenizers/registry.js';
import type { CheapestOptions, CheapestResult, CostResult, ModelId } from './types.js';

export function tokensToCost(tokens: number, inputPricePerMillion: number): number {
  return (tokens / 1_000_000) * inputPricePerMillion;
}

export function costPer1kCalls(tokens: number, inputPricePerMillion: number): number {
  return tokensToCost(tokens, inputPricePerMillion) * 1000;
}

export async function cost(
  text: string,
  model: ModelId,
  opts: { calls?: number } = {},
): Promise<CostResult> {
  const info = getModel(model);
  const tokens = await countTokens(text, model);
  const perCall = tokensToCost(tokens, info.inputPricePerMillion);
  const total = perCall * (opts.calls ?? 1);
  return { perCall, total };
}

export async function cheapestThatFits(
  text: string,
  opts: CheapestOptions = {},
): Promise<CheapestResult> {
  const candidates = await Promise.all(
    ALL_MODELS.map(async (id) => {
      const info = getModel(id);
      if (opts.mustBeExact && info.accuracy !== 'exact') return null;
      if (info.selfHosted) return null;
      const tokens = await countTokens(text, id);
      if (opts.needContext != null && info.contextWindow < opts.needContext) return null;
      if (tokens > info.contextWindow) return null;
      const c1k = costPer1kCalls(tokens, info.inputPricePerMillion);
      const ctxPct = (tokens / info.contextWindow) * 100;
      return { id, costPer1kCalls: c1k, contextUsedPct: ctxPct, tokens };
    }),
  );
  const valid = candidates.filter((x): x is NonNullable<typeof x> => x != null);
  if (valid.length === 0) {
    throw new Error('No model fits the constraints.');
  }
  valid.sort((a, b) => a.costPer1kCalls - b.costPer1kCalls);
  const winner = valid[0];
  const mostExpensive = valid.at(-1);
  if (!winner || !mostExpensive) {
    throw new Error('No model fits the constraints.');
  }
  const result: CheapestResult = {
    model: winner.id,
    costPer1kCalls: winner.costPer1kCalls,
    contextUsedPct: winner.contextUsedPct,
  };
  if (mostExpensive.id !== winner.id && mostExpensive.costPer1kCalls > 0) {
    result.savingsVs = {
      model: mostExpensive.id,
      costPer1kCalls: mostExpensive.costPer1kCalls,
      pct:
        ((mostExpensive.costPer1kCalls - winner.costPer1kCalls) / mostExpensive.costPer1kCalls) *
        100,
    };
  }
  return result;
}
