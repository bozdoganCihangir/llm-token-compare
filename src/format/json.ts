import type { Finding } from '../core/findings.js';
import type { CompareResult } from '../core/types.js';

export interface JsonOutput {
  results: CompareResult[];
  findings?: Finding[];
}

export function formatJson(payload: JsonOutput, pretty = true): string {
  return pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
}
