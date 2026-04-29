import { describe, expect, it } from 'vitest';
import { compare, count, tokenize } from '../src/core/compare.js';

describe('compare', () => {
  it('returns one row per default model', async () => {
    const r = await compare('hello world');
    expect(r.length).toBe(4);
    const ids = r.map((x) => x.model).sort();
    expect(ids).toEqual(['claude-3.5-sonnet', 'gemini-1.5-flash', 'gpt-4o', 'llama-3.1']);
  });

  it('respects explicit model list', async () => {
    const r = await compare('hi', { models: ['gpt-4o', 'llama-3.1'] });
    expect(r.length).toBe(2);
  });

  it('computes chars-per-token sensibly', async () => {
    const r = await compare('hello world', { models: ['gpt-4o'] });
    expect(r[0]?.charsPerToken).toBeGreaterThan(0);
  });

  it('flags accuracy correctly', async () => {
    const r = await compare('hi', {
      models: ['gpt-4o', 'claude-3.5-sonnet', 'gemini-1.5-flash', 'llama-3.1'],
    });
    expect(r.find((x) => x.model === 'gpt-4o')?.accuracy).toBe('exact');
    expect(r.find((x) => x.model === 'llama-3.1')?.accuracy).toBe('exact');
    expect(r.find((x) => x.model === 'claude-3.5-sonnet')?.accuracy).toBe('approx');
    expect(r.find((x) => x.model === 'gemini-1.5-flash')?.accuracy).toBe('approx');
  });

  it('marks llama as self-hosted with $0 cost', async () => {
    const r = await compare('hi', { models: ['llama-3.1'] });
    expect(r[0]?.selfHosted).toBe(true);
    expect(r[0]?.costPer1kCalls).toBe(0);
  });

  it('includes costAtRate when callsPerMonth is provided', async () => {
    const r = await compare('hello', { models: ['gpt-4o'], callsPerMonth: 1_000_000 });
    expect(r[0]?.costAtRate).toBeGreaterThan(0);
  });

  it('count and tokenize work directly', async () => {
    expect(await count('hello world', 'gpt-4o')).toBe(2);
    const t = await tokenize('hello world', 'gpt-4o');
    expect(t.pieces.length).toBe(2);
  });

  it('handles empty string without dividing by zero', async () => {
    const r = await compare('', { models: ['gpt-4o'] });
    expect(r[0]?.tokens).toBe(0);
    expect(r[0]?.characters).toBe(0);
    expect(r[0]?.charsPerToken).toBe(0);
    expect(r[0]?.contextUsedPct).toBe(0);
    expect(r[0]?.costPer1kCalls).toBe(0);
  });

  it('counts characters by code points (emoji = 1)', async () => {
    const r = await compare('🚀', { models: ['gpt-4o'] });
    expect(r[0]?.characters).toBe(1);
  });
});
