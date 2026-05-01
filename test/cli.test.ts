import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const REPO = new URL('..', import.meta.url).pathname;
const CLI = join(REPO, 'src', 'cli.ts');

function run(args: string[], input?: string) {
  return spawnSync('npx', ['tsx', CLI, ...args], {
    input,
    encoding: 'utf8',
    cwd: REPO,
  });
}

describe('cli', () => {
  let workdir: string;
  beforeAll(() => {
    workdir = mkdtempSync(join(tmpdir(), 'ltc-'));
  });
  afterAll(() => {
    rmSync(workdir, { recursive: true, force: true });
  });

  it('--help exits 0 and lists commands', () => {
    const r = run(['--help']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('llm-token-compare');
    expect(r.stdout).toContain('samples');
    expect(r.stdout).toContain('cheapest');
  });

  it('default command prints a table', () => {
    const r = run(['hello world', '--no-color', '--no-viz']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('Tokens');
    expect(r.stdout).toContain('gpt-4o');
  });

  it('--json output is parseable', () => {
    const r = run(['hello world', '--json']);
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout);
    expect(Array.isArray(parsed.results)).toBe(true);
    expect(parsed.results.length).toBeGreaterThan(0);
  });

  it('--share emits a markdown table', () => {
    const r = run(['hello world', '--share']);
    expect(r.status).toBe(0);
    expect(r.stdout.trim().startsWith('|')).toBe(true);
  });

  it('--html writes a file', () => {
    const file = join(workdir, 'out.html');
    const r = run(['hello world', '--html', file]);
    expect(r.status).toBe(0);
    const html = readFileSync(file, 'utf8');
    expect(html).toContain('<!doctype html>');
  });

  it('reads from -f file', () => {
    const file = join(workdir, 'in.txt');
    writeFileSync(file, 'hello world');
    const r = run(['-f', file, '--json']);
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.results[0].characters).toBe(11);
  });

  it('reads from stdin', () => {
    const r = run(['--json'], 'hello world');
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.results[0].characters).toBe(11);
  });

  it('samples command runs across showcase texts', () => {
    const r = run(['samples', '--no-color']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('python');
    expect(r.stdout).toContain('korean');
    expect(r.stdout).toContain('json');
    expect(r.stdout).toContain('prose');
  });

  it('cheapest command names a model', () => {
    const r = run(['cheapest', 'hello world']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('Cheapest:');
  });

  it('rejects an unknown model', () => {
    const r = run(['hi', '--models', 'gpt-9000', '--no-color']);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('Unknown model');
  });

  it('--all expands to ten models', () => {
    const r = run(['hello', '--all', '--json']);
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.results.length).toBe(10);
  });

  it('--calls-per-month populates costAtRate', () => {
    const r = run(['hello world', '--calls-per-month', '1m', '--json']);
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout);
    const gpt = parsed.results.find(
      (x: { model: string; costAtRate?: number }) => x.model === 'gpt-4o',
    );
    expect(gpt?.costAtRate).toBeGreaterThan(0);
  });

  it('rejects invalid --calls-per-month', () => {
    const r = run(['hi', '--calls-per-month', 'not-a-number', '--no-color']);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('Invalid --calls-per-month');
  });

  it('cheapest --exact restricts to families with exact tokenizers', () => {
    const r = run(['cheapest', 'hello world', '--exact']);
    expect(r.status).toBe(0);
    // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping ANSI escape sequences
    const stripped = r.stdout.replace(/\x1b\[[0-9;]*m/g, '');
    expect(stripped).toMatch(/Cheapest:\s+gpt-/);
  });

  it('cheapest rejects non-numeric --context instead of silently ignoring it', () => {
    const r = run(['cheapest', 'hello world', '--context', 'not-a-number']);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('Invalid --context');
  });

  it('rejects model ids that match Object.prototype keys', () => {
    const r = run(['hi', '--models', '__proto__', '--no-color']);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('Unknown model');
  });
});
