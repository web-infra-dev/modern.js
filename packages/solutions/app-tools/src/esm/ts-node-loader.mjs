import { pathToFileURL } from 'url';
import { resolve as tsNodeResolve } from 'ts-node/esm';
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

export { transformSource, load } from 'ts-node/esm';
