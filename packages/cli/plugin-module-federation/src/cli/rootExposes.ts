import fs from 'node:fs';
import path from 'node:path';

/** Only candidate Modern root modules get a separate compiler resource identity. */
export function markRootExposes<T>(
  exposes: T,
  appDirectory: string,
  metaName = 'modern-js',
): T {
  const mark = (request: string): string => {
    if (request.includes('?')) return request;
    const base = path.isAbsolute(request)
      ? request
      : path.resolve(appDirectory, request);
    const candidates = [
      base,
      ...['.tsx', '.ts', '.jsx', '.js', '.mjs', '.mts'].map(
        extension => `${base}${extension}`,
      ),
    ];
    const filename = candidates.find(candidate => {
      try {
        return fs.statSync(candidate).isFile();
      } catch {
        return false;
      }
    });
    if (!filename) return request;
    // This is only a cheap candidate check. The runtime loader resolves actual
    // import bindings and provider references with the parser before rewriting.
    const source = fs.readFileSync(filename, 'utf8');
    return source.includes(`@${metaName}/runtime/react`)
      ? `${request}?modern-mf-root`
      : request;
  };
  const entry = (value: unknown): unknown => {
    if (typeof value === 'string') return mark(value);
    if (Array.isArray(value)) return value.map(entry);
    if (value && typeof value === 'object' && 'import' in value)
      return { ...value, import: entry(value.import) };
    return value;
  };
  if (!exposes) return exposes;
  if (Array.isArray(exposes))
    return exposes.map(item =>
      typeof item === 'string'
        ? mark(item)
        : markRootExposes(item, appDirectory, metaName),
    ) as T;
  return Object.fromEntries(
    Object.entries(exposes).map(([key, value]) => [key, entry(value)]),
  ) as T;
}
