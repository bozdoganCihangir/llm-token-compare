import { describe, expect, it } from 'vitest';
import { count, tokenize } from '../../src/tokenizers/anthropic.js';
import known from '../fixtures/known-counts.json' with { type: 'json' };

describe('tokenizers/anthropic', () => {
  for (const c of known.cases) {
    it(`counts "${c.name}" for claude-3.5-sonnet`, () => {
      expect(count(c.text, 'claude-3.5-sonnet')).toBe(c.counts['claude-3.5-sonnet']);
    });
  }

  it('tokenize returns pieces', () => {
    const r = tokenize('hello world', 'claude-3-haiku');
    expect(r.ids.length).toBeGreaterThan(0);
    expect(r.pieces.length).toBe(r.ids.length);
  });

  it('count equals tokenize().ids.length (consistency)', () => {
    for (const c of known.cases) {
      const c1 = count(c.text, 'claude-3.5-sonnet');
      const c2 = tokenize(c.text, 'claude-3.5-sonnet').ids.length;
      expect(c1).toBe(c2);
    }
  });

  it('cached tokenizer survives repeated tokenize+count calls', () => {
    for (let i = 0; i < 5; i++) {
      expect(count('hello world', 'claude-3.5-sonnet')).toBeGreaterThan(0);
      expect(tokenize('hello world', 'claude-3-haiku').ids.length).toBeGreaterThan(0);
    }
  });

  it('rejects non-Anthropic model id', () => {
    expect(() => count('hi', 'gpt-4o')).toThrow(/Not an Anthropic/);
  });

  it('rejects Object.prototype-shaped ids (prototype-chain guard)', () => {
    // biome-ignore lint/suspicious/noExplicitAny: validating runtime guard
    expect(() => count('hi', '__proto__' as any)).toThrow(/Not an Anthropic/);
    // biome-ignore lint/suspicious/noExplicitAny: validating runtime guard
    expect(() => count('hi', 'toString' as any)).toThrow(/Not an Anthropic/);
  });
});
