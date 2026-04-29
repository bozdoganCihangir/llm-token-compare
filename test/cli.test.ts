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
});
