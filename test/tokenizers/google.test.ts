import { describe, expect, it } from 'vitest';
import { count, tokenize } from '../../src/tokenizers/google.js';
import known from '../fixtures/known-counts.json' with { type: 'json' };

describe('tokenizers/google', () => {
  for (const c of known.cases) {
    it(`counts "${c.name}" for gemini-1.5-flash (calibrated)`, () => {
      expect(count(c.text, 'gemini-1.5-flash')).toBe(c.counts['gemini-1.5-flash']);
    });
  }

  it('tokenize returns pieces', () => {
    const r = tokenize('hello world', 'gemini-1.5-flash');
    expect(r.ids.length).toBeGreaterThan(0);
    expect(r.pieces.length).toBe(r.ids.length);
  });

  it('rejects non-Google model id', () => {
    expect(() => count('hi', 'gpt-4o')).toThrow(/Not a Google/);
  });
});
