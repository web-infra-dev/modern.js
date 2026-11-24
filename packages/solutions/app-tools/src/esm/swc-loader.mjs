import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from '@swc/core';
import {
  initialize as initializeTsPathsLoader,
  resolve as resolveTsPaths,
} from './ts-paths-loader.mjs';

const TS_FILE = /\.(?:[cm]?ts|tsx)$/;

// NodeNext-style sources import `./user.js` for `./user.ts`.
const TS_FOR_JS = {
  '.js': ['.ts', '.tsx'],
  '.jsx': ['.tsx'],
  '.mjs': ['.mts'],
  '.cjs': ['.cts'],
};

const getTypeScriptCandidates = specifier => {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
    return [];
  }
  const ext = path.extname(specifier);
  return (TS_FOR_JS[ext] || []).map(
    tsExt => specifier.slice(0, -ext.length) + tsExt,
  );
};

// swc options per source extension, computed by the main thread from the
// server tsconfig (`createSwcOptions` in @modern-js/server-utils).
let swcOptions = {};
let distDir;

export async function initialize(config) {
  swcOptions = config.swcOptions || {};
  distDir = config.distDir && path.resolve(config.distDir);
  await initializeTsPathsLoader(config);
}

export async function resolve(specifier, context, defaultResolve) {
  try {
    return await resolveTsPaths(specifier, context, defaultResolve);
  } catch (error) {
    if (error?.code !== 'ERR_MODULE_NOT_FOUND') {
      throw error;
    }
    for (const candidate of getTypeScriptCandidates(specifier)) {
      try {
        return await resolveTsPaths(candidate, context, defaultResolve);
      } catch {}
    }
    throw error;
  }
}

const isAppSource = filename => {
  if (!TS_FILE.test(filename) || filename.endsWith('.d.ts')) {
    return false;
  }
  if (filename.split(path.sep).includes('node_modules')) {
    return false;
  }
  return !distDir || !filename.startsWith(distDir + path.sep);
};

export function load(url, context, defaultLoad) {
  if (!url.startsWith('file:')) {
    return defaultLoad(url, context);
  }
  const filename = fileURLToPath(url);
  if (!isAppSource(filename)) {
    return defaultLoad(url, context);
  }

  // Without this, local `.ts` files would be handed to Node as-is: native type
  // stripping rejects enums, decorators and parameter properties.
  const format = filename.endsWith('.cts') ? 'commonjs' : 'module';
  const { code } = transformSync(fs.readFileSync(filename, 'utf8'), {
    ...swcOptions[path.extname(filename)],
    filename,
  });
  return { format, source: code, shortCircuit: true };
}
