import { createHash as createHashFunc } from 'crypto';

export function createHash(str: string) {
  return createHashFunc('sha256').update(str).digest('hex').slice(0, 8);
}
