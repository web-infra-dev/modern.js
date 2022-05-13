import { join } from 'path';
import chalk from 'chalk';

export const ROOT = join(process.cwd(), '..', '..');

export function isArrayEqual(arr1: unknown[], arr2: unknown[]) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  return arr1.every(key => arr2.includes(key));
}

export function formatPath(path: string) {
  return chalk.gray.underline(path.replace(ROOT, ''));
}
