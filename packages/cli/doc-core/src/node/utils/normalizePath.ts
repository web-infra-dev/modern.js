import os from 'os';
import path from 'path';

export const isWindows = os.platform() === 'win32';

export function slash(p: string): string {
  return p.replace(/\\/g, '/');
}

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id);
}

export function removeLeadingSlash(str: string): string {
  return str.replace(/^\//, '');
}
