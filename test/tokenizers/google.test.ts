import { describe, expect, it } from 'vitest';
import { count, tokenize } from '../../src/tokenizers/google.js';
import known from '../fixtures/known-counts.json' with { type: 'json' };

describe('tokenizers/google', () => {
  for (const c of known.cases) {
    it(`counts "${c.name}" for gemini-1.5-flash`, () => {
      expect(count(c.text, 'gemini-1.5-flash')).toBe(c.counts['gemini-1.5-flash']);
    });
  }

  it('tokenize returns pieces', () => {
    const r = tokenize('hello world', 'gemini-1.5-flash');
    expect(r.ids.length).toBeGreaterThan(0);
    expect(r.pieces.length).toBe(r.ids.length);
  });

  it('count equals tokenize().ids.length (consistency)', () => {
    for (const c of known.cases) {
      const c1 = count(c.text, 'gemini-1.5-flash');
      const c2 = tokenize(c.text, 'gemini-1.5-flash').ids.length;
      expect(c1).toBe(c2);
    }
    const longText = 'lorem ipsum dolor sit amet '.repeat(80);
    expect(count(longText, 'gemini-1.5-flash')).toBe(
      tokenize(longText, 'gemini-1.5-flash').ids.length,
    );
  });

  it('rejects non-Google model id', () => {
    expect(() => count('hi', 'gpt-4o')).toThrow(/Not a Google/);
  });

  it('rejects Object.prototype-shaped ids (prototype-chain guard)', () => {
    // biome-ignore lint/suspicious/noExplicitAny: validating runtime guard
    expect(() => count('hi', '__proto__' as any)).toThrow(/Not a Google/);
    // biome-ignore lint/suspicious/noExplicitAny: validating runtime guard
    expect(() => count('hi', 'toString' as any)).toThrow(/Not a Google/);
  });
});
