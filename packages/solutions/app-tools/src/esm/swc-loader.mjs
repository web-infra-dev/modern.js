import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createSwcOptions,
  getTypeScriptCandidates,
} from '@modern-js/server-utils';
import { transformSync } from '@swc/core';
import {
  initialize as initializeTsPathsLoader,
  resolve as resolveTsPaths,
} from './ts-paths-loader.mjs';

const TS_FILE = /\.(?:[cm]?ts|tsx)$/;

let compilerOptions = {};
let distDir;

export async function initialize(config) {
  compilerOptions = config.compilerOptions || {};
  distDir = config.distDir && path.resolve(config.distDir);
  await initializeTsPathsLoader(config);
}

export async function resolve(specifier, context, defaultResolve) {
  try {
    return await resolveTsPaths(specifier, context, defaultResolve);
  } catch (error) {
    // NodeNext-style sources import `./user.js` for `./user.ts`.
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
    ...createSwcOptions(
      filename,
      compilerOptions,
      format === 'module' ? 'module' : 'commonjs',
    ),
    sourceMaps: 'inline',
  });
  return { format, source: code, shortCircuit: true };
}
