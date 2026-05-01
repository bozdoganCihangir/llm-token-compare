import { describe, expect, it } from 'vitest';
import { count, tokenize } from '../../src/tokenizers/openai.js';
import known from '../fixtures/known-counts.json' with { type: 'json' };

describe('tokenizers/openai', () => {
  for (const c of known.cases) {
    it(`counts "${c.name}" for gpt-4o`, () => {
      expect(count(c.text, 'gpt-4o')).toBe(c.counts['gpt-4o']);
    });
    it(`counts "${c.name}" for gpt-3.5-turbo`, () => {
      expect(count(c.text, 'gpt-3.5-turbo')).toBe(c.counts['gpt-3.5-turbo']);
    });
  }

  it('tokenize round-trips visually', () => {
    const text = 'hello world';
    const r = tokenize(text, 'gpt-4o');
    expect(r.ids.length).toBe(2);
    expect(r.pieces.join('')).toBe(text);
  });

  it('rejects non-OpenAI model id', () => {
    expect(() => count('hi', 'claude-3-haiku')).toThrow(/Not an OpenAI/);
  });

  it('rejects Object.prototype-shaped ids (prototype-chain guard)', () => {
    // biome-ignore lint/suspicious/noExplicitAny: validating runtime guard
    expect(() => count('hi', '__proto__' as any)).toThrow(/Not an OpenAI/);
    // biome-ignore lint/suspicious/noExplicitAny: validating runtime guard
    expect(() => count('hi', 'toString' as any)).toThrow(/Not an OpenAI/);
    // biome-ignore lint/suspicious/noExplicitAny: validating runtime guard
    expect(() => count('hi', 'constructor' as any)).toThrow(/Not an OpenAI/);
  });

  it('defaults to gpt-4o when model omitted', () => {
    expect(count('hello world')).toBe(2);
  });
});
