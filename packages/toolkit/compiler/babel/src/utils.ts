import * as path from 'path';

export function addSourceMappingUrl(code: string, loc: string): string {
  return `${code}\n//# sourceMappingURL=${path.basename(loc)}`;
}
