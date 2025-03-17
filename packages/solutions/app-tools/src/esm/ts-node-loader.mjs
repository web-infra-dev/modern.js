import { pathToFileURL } from 'url';
import { resolve as tsNodeResolve } from 'ts-node/esm';
import { load as tsNodeLoad } from 'ts-node/esm';
import { createMatchPath } from './utils.mjs';

let matchPath;
export async function initialize({ appDir, alias, tsconfigPath }) {
  matchPath = createMatchPath({
    alias,
    appDir,
    tsconfigPath,
  });
}

export function resolve(specifier, context, defaultResolve) {
  const match = matchPath(specifier);
  return match
    ? tsNodeResolve(pathToFileURL(match).href, context, defaultResolve)
    : tsNodeResolve(specifier, context, defaultResolve);
}

export function load(url, context, defaultLoad) {
  const filePath = new URL(url).pathname;

  if (url.startsWith('node:')) {
    return defaultLoad(url, context);
  }

  if (filePath.includes('node_modules')) {
    return defaultLoad(url, context);
  }

  return tsNodeLoad(url, context, defaultLoad);
}
