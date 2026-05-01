import { describe, expect, it } from 'vitest';
import { count, tokenize } from '../../src/tokenizers/meta.js';
import known from '../fixtures/known-counts.json' with { type: 'json' };

describe('tokenizers/meta', () => {
  for (const c of known.cases) {
    it(`counts "${c.name}" for llama-3.1`, () => {
      expect(count(c.text, 'llama-3.1')).toBe(c.counts['llama-3.1']);
    });
  }

  it('does not add BOS/EOS', () => {
    expect(count('hello world', 'llama-3.1')).toBe(2);
  });

  it('tokenize returns pieces matching ids length', () => {
    const r = tokenize('hello world', 'llama-3.1');
    expect(r.pieces.length).toBe(r.ids.length);
  });

  it('rejects non-Meta model id', () => {
    expect(() => count('hi', 'gpt-4o')).toThrow(/Not a Meta/);
  });

  it('rejects Object.prototype-shaped ids (prototype-chain guard)', () => {
    // biome-ignore lint/suspicious/noExplicitAny: validating runtime guard
    expect(() => count('hi', '__proto__' as any)).toThrow(/Not a Meta/);
    // biome-ignore lint/suspicious/noExplicitAny: validating runtime guard
    expect(() => count('hi', 'toString' as any)).toThrow(/Not a Meta/);
  });
});
