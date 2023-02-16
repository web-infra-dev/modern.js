import path from 'path';
import { fileURLToPath } from 'url';

export const isProduction = () => process.env.NODE_ENV === 'production';

export const importStatementRegex = /import\s+(.*?)\s+from\s+['"](.*?)['"];?/gm;

const dirname = path.dirname(fileURLToPath(new URL(import.meta.url)));

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

export const APP_HTML_MARKER = '<!--<?- DOC_CONTENT ?>-->';
export const HEAD_MARKER = '<!--<?- HEAD ?>-->';
export const HTML_START_TAG = '<html';
export const BODY_START_TAG = '<body';

export const PUBLIC_DIR = 'public';
