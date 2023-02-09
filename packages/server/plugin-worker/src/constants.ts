export const WORKER_SERVER = 'worker-server';
export const WORKER_SERVER_ENTRY = 'index.js';
export const MANIFEST_FILE = 'manifest.js';
export const PKG_FILE = 'package.json';
export const LOCK_FILE: Record<string, string> = {
  yarn: 'yarn.lock',
  npm: 'package-lock.json',
  pnpm: 'pnpm-lock.yaml',
};
export const WRANGLER_FILE = 'wrangler.toml';
