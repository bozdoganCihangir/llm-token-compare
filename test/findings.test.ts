import { describe, expect, it } from 'vitest';
import { compare } from '../src/core/compare.js';
import { findings } from '../src/core/findings.js';

describe('findings', () => {
  it('returns empty for empty results', () => {
    expect(findings([])).toEqual([]);
  });

  it('reports a cheapest finding when prices differ', async () => {
    const results = await compare('hello world', {
      models: ['gpt-4o', 'claude-3-opus', 'gemini-1.5-flash'],
    });
    const fs = findings(results);
    expect(fs.some((f) => f.text.startsWith('Cheapest:'))).toBe(true);
  });

  it('flags non-ASCII when sourceText supplied', async () => {
    const text = '안녕하세요 세계';
    const results = await compare(text, { models: ['gpt-4o', 'llama-3.1'] });
    const fs = findings(results, text);
    expect(fs.some((f) => f.text.includes('Non-ASCII'))).toBe(true);
  });

  it('omits non-ASCII finding when text is plain English', async () => {
    const results = await compare('hello world', { models: ['gpt-4o'] });
    const fs = findings(results, 'hello world');
    expect(fs.some((f) => f.text.includes('Non-ASCII'))).toBe(false);
  });
});
