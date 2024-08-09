import { pathToFileURL } from 'url';
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

export { load } from 'esbuild-register/loader';
