import { resolve as tsNodeResolve } from 'ts-node/esm';
import { load as tsNodeLoad } from 'ts-node/esm';
import {
  initialize as initializeTsPathsLoader,
  resolve as resolveTsPaths,
} from './ts-paths-loader.mjs';

export async function initialize(config) {
  await initializeTsPathsLoader(config);
}

export function resolve(specifier, context, defaultResolve) {
  return resolveTsPaths(specifier, context, (specifier, context) => {
    return tsNodeResolve(specifier, context, defaultResolve);
  });
}

export function load(url, context, defaultLoad) {
  const filePath = new URL(url).pathname;

  if (url.startsWith('node:')) {
    return defaultLoad(url, context);
  }

  if (filePath.includes('node_modules')) {
    return defaultLoad(url, context);
  }

  // Without ts-node here, local `.ts` files would be handed to Node as-is and
  // fail to execute in environments that do not natively run TypeScript.
  return tsNodeLoad(url, context, defaultLoad);
}
