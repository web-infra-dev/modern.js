import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'url';
import { findMatchedSourcePath, findSourceEntry } from '@modern-js/utils';
import { createMatchPath as oCreateMatchPath } from '@modern-js/utils/tsconfig-paths';

let matchPath;
let appDir;

// Node's ESM loader does not guarantee that `context.parentURL` is always a
// `file://` URL. Some packages, such as Tailwind v4, can trigger resolutions
// from synthetic modules like `data:` URLs. Guarding the conversion here keeps
// app-local relative import handling working for normal file parents without
// crashing on non-file schemes.
const getParentPath = parentURL => {
  if (!parentURL) {
    return process.cwd();
  }

  if (path.isAbsolute(parentURL)) {
    return path.dirname(parentURL);
  }

  try {
    const url = new URL(parentURL);

    if (url.protocol === 'file:') {
      return path.dirname(fileURLToPath(url));
    }
  } catch {}

  return process.cwd();
};

export async function initialize({ appDir: currentAppDir, baseUrl, paths }) {
  appDir = path.resolve(currentAppDir);
  matchPath = oCreateMatchPath(baseUrl || './', paths || {});
}

export function resolve(specifier, context, defaultResolve) {
  // Without this branch, app-local imports like `../service/user` would fail
  // under native ESM because Node does not try `.ts` / `.js` extensions here.
  const parentPath = getParentPath(context.parentURL);
  const relativeFromApp = appDir ? path.relative(appDir, parentPath) : '';

  const isAppFile =
    appDir &&
    (parentPath === appDir ||
      (relativeFromApp &&
        !relativeFromApp.startsWith('..') &&
        !path.isAbsolute(relativeFromApp)));

  if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    !path.extname(specifier) &&
    isAppFile
  ) {
    const matchedPath = path.resolve(parentPath, specifier);
    const resolvedPath = findSourceEntry(matchedPath) || matchedPath;

    if (resolvedPath && fs.existsSync(resolvedPath)) {
      return defaultResolve(
        pathToFileURL(resolvedPath).href,
        context,
        defaultResolve,
      );
    }
  }

  if (!matchPath) {
    return defaultResolve(specifier, context, defaultResolve);
  }

  // Without this rewrite, aliases such as `@service/user` and
  // `@service/user.js` would be left to Node's default resolver, which cannot
  // map tsconfig paths to the real source files.
  const match = findMatchedSourcePath(matchPath, specifier);
  if (!match) {
    return defaultResolve(specifier, context, defaultResolve);
  }

  const resolvedPath = findSourceEntry(match) || match;
  return defaultResolve(
    pathToFileURL(resolvedPath).href,
    context,
    defaultResolve,
  );
}
