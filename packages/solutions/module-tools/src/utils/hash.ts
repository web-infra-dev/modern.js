import { createHash } from 'crypto';

export function getHash(
  content: Buffer | string,
  encoding: any,
  type = 'md5',
): string {
  return createHash(type).update(content.toString(), encoding).digest('hex');
}
