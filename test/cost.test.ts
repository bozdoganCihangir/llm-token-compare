import { describe, expect, it } from 'vitest';
import { cheapestThatFits, cost, costPer1kCalls, tokensToCost } from '../src/core/cost.js';

describe('cost math', () => {
  it('tokensToCost is linear in tokens', () => {
    expect(tokensToCost(1_000_000, 2.5)).toBeCloseTo(2.5, 6);
    expect(tokensToCost(500_000, 2.5)).toBeCloseTo(1.25, 6);
    expect(tokensToCost(0, 2.5)).toBe(0);
  });

  it('costPer1kCalls multiplies by 1000', () => {
    expect(costPer1kCalls(100, 10)).toBeCloseTo(1, 6);
  });

  it('cost(text, model) returns positive perCall for paid model', async () => {
    const c = await cost('hello world', 'gpt-4o');
    expect(c.perCall).toBeGreaterThan(0);
    expect(c.total).toBe(c.perCall);
  });

  it('cost respects calls multiplier', async () => {
    const c = await cost('hello', 'gpt-4o', { calls: 1000 });
    expect(c.total).toBeCloseTo(c.perCall * 1000, 12);
  });

  it('llama-3.1 is free (self-hosted)', async () => {
    const c = await cost('hello world', 'llama-3.1');
    expect(c.perCall).toBe(0);
  });
});

describe('cheapestThatFits', () => {
  it('picks the cheapest paid model when no constraints', async () => {
    const r = await cheapestThatFits('hello');
    expect(r.model).toBe('gemini-1.5-flash');
    expect(r.savingsVs).toBeDefined();
    expect(r.savingsVs?.pct).toBeGreaterThan(50);
  });

  it('respects mustBeExact', async () => {
    const r = await cheapestThatFits('hello', { mustBeExact: true });
    expect(['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']).toContain(r.model);
  });

  it('respects needContext', async () => {
    const r = await cheapestThatFits('hello', { needContext: 1_500_000 });
    expect(r.model).toBe('gemini-1.5-pro');
  });

  it('omits savingsVs when only one candidate survives constraints', async () => {
    const r = await cheapestThatFits('hello', { needContext: 1_500_000 });
    expect(r.model).toBe('gemini-1.5-pro');
    expect(r.savingsVs).toBeUndefined();
  });

  it('throws when needContext exceeds every paid model', async () => {
    await expect(cheapestThatFits('hello', { needContext: 10_000_000 })).rejects.toThrow(
      /No model fits/,
    );
  });

  it('savingsVs.pct is bounded in (0, 100)', async () => {
    const r = await cheapestThatFits('hello world');
    expect(r.savingsVs).toBeDefined();
    expect(r.savingsVs?.pct).toBeGreaterThan(0);
    expect(r.savingsVs?.pct).toBeLessThan(100);
  });
});
