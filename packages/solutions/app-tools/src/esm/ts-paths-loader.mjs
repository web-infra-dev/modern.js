import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createMatchPath as oCreateMatchPath } from '@modern-js/utils/tsconfig-paths';

let matchPath;
let appDir;

const resolvePathWithExtensions = matchedPath => {
  if (path.extname(matchedPath)) {
    return matchedPath;
  }

  const fileCandidates = [
    matchedPath,
    `${matchedPath}.ts`,
    `${matchedPath}.tsx`,
    `${matchedPath}.mts`,
    `${matchedPath}.cts`,
    `${matchedPath}.js`,
    `${matchedPath}.mjs`,
    `${matchedPath}.cjs`,
  ];

  for (const candidate of fileCandidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  const indexCandidates = [
    path.join(matchedPath, 'index.ts'),
    path.join(matchedPath, 'index.tsx'),
    path.join(matchedPath, 'index.mts'),
    path.join(matchedPath, 'index.cts'),
    path.join(matchedPath, 'index.js'),
    path.join(matchedPath, 'index.mjs'),
    path.join(matchedPath, 'index.cjs'),
  ];

  for (const candidate of indexCandidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return matchedPath;
};

export async function initialize({ appDir: currentAppDir, baseUrl, paths }) {
  appDir = path.resolve(currentAppDir);
  matchPath = oCreateMatchPath(baseUrl || './', paths || {});
}

export function resolve(specifier, context, defaultResolve) {
  const parentPath = context.parentURL
    ? path.dirname(fileURLToPath(context.parentURL))
    : process.cwd();
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
    const resolvedPath = resolvePathWithExtensions(
      path.resolve(parentPath, specifier),
    );

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

  const match = matchPath(specifier, undefined, undefined, [
    '.ts',
    '.tsx',
    '.mts',
    '.cts',
    '.js',
    '.mjs',
    '.cjs',
  ]);
  if (!match) {
    return defaultResolve(specifier, context, defaultResolve);
  }

  const resolvedPath = resolvePathWithExtensions(match);
  return defaultResolve(
    pathToFileURL(resolvedPath).href,
    context,
    defaultResolve,
  );
}
