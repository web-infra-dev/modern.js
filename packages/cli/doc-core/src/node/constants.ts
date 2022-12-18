import path from 'path';

const dirname = path.dirname(new URL(import.meta.url).pathname);

export const PACKAGE_ROOT = path.join(dirname, '..');

export const CLIENT_ENTRY = path.join(
  PACKAGE_ROOT,
  'src',
  'runtime',
  'clientEntry.tsx',
);

export const SSR_ENTRY = path.join(
  PACKAGE_ROOT,
  'src',
  'runtime',
  'ssrEntry.tsx',
);

export const OUTPUT_DIR = 'doc_build';
