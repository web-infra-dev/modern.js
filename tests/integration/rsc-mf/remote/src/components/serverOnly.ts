import 'server-only';
import { readFileSync } from 'node:fs';

export function getServerOnlyInfo() {
  return typeof readFileSync === 'function'
    ? 'remote-server-only-ok'
    : 'remote-server-only-missing';
}
