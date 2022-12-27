import path from 'path';

export const isProduction = () => process.env.NODE_ENV === 'production';

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

export const DIRECTIVE_TYPES: string[] = [
  'tip',
  'warning',
  'caution',
  'danger',
  'info',
];

export const APP_HTML_MARKER = '<!--<?- DOC_CONTENT ?>-->';
export const HEAD_MARKER = '<!--<?- HEAD ?>-->';
