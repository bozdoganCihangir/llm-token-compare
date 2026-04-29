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

  it('warns when context usage exceeds 50%', () => {
    const synthetic = [
      {
        model: 'llama-3' as const,
        family: 'meta' as const,
        encoding: 'tiktoken-llama3',
        tokens: 6000,
        characters: 24000,
        charsPerToken: 4,
        contextWindow: 8192,
        contextUsedPct: 73.2,
        costPer1kCalls: 0,
        accuracy: 'exact' as const,
        selfHosted: true,
      },
    ];
    const fs = findings(synthetic);
    expect(fs.some((f) => f.level === 'warn' && f.text.includes('llama-3'))).toBe(true);
  });

  it('reports an efficiency finding with chars/token', async () => {
    const results = await compare('hello world from a friendly planet', {
      models: ['gpt-4o', 'claude-3.5-sonnet'],
    });
    const fs = findings(results);
    expect(fs.some((f) => f.text.startsWith('Most efficient:'))).toBe(true);
  });
});
