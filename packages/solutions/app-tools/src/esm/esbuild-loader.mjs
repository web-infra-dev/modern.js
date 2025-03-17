import { pathToFileURL } from 'url';
import { load as esbuildLoad } from 'esbuild-register/loader';
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
    ? defaultResolve(pathToFileURL(match).href, context)
    : defaultResolve(specifier, context);
}

export function load(url, context, defaultLoad) {
  const filePath = new URL(url).pathname;

  if (url.startsWith('node:')) {
    return defaultLoad(url, context);
  }

  if (filePath.includes('node_modules')) {
    return defaultLoad(url, context);
  }

  return esbuildLoad(url, context, defaultLoad);
}
