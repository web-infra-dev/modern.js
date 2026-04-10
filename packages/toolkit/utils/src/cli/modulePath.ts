import fs from 'node:fs';
import path from 'node:path';
import type { MatchPath } from '../../compiled/tsconfig-paths';

export const SOURCE_EXTENSIONS = ['.ts', '.js'];
export const JS_LIKE_EXTENSION_RE = /\.(?:c|m)?js$/;

const isFile = (filepath: string) =>
  fs.existsSync(filepath) && fs.statSync(filepath).isFile();

// Resolve a source path to the actual file on disk, preferring `.ts` over `.js`
// and falling back to `index.ts` / `index.js` for directory matches.
export const findSourceEntry = (resolvedPath: string) => {
  const ext = path.extname(resolvedPath);

  if (ext) {
    if (isFile(resolvedPath)) {
      return resolvedPath;
    }

    if (JS_LIKE_EXTENSION_RE.test(resolvedPath)) {
      const tsPath = `${resolvedPath.slice(0, -ext.length)}.ts`;

      if (isFile(tsPath)) {
        return tsPath;
      }
    }

    return;
  }

  for (const candidateExt of SOURCE_EXTENSIONS) {
    const filePath = `${resolvedPath}${candidateExt}`;
    if (isFile(filePath)) {
      return filePath;
    }
  }

  for (const candidateExt of SOURCE_EXTENSIONS) {
    const indexPath = path.join(resolvedPath, `index${candidateExt}`);
    if (isFile(indexPath)) {
      return indexPath;
    }
  }
};

// Allow `.js` specifiers to point at `.ts` source files so runtime loaders and
// compile-time transforms follow the same alias matching rules.
export const findMatchedSourcePath = (
  matchPath: MatchPath,
  specifier: string,
) => {
  let matchedPath = matchPath(
    specifier,
    undefined,
    undefined,
    SOURCE_EXTENSIONS,
  );

  if (!matchedPath && JS_LIKE_EXTENSION_RE.test(specifier)) {
    matchedPath = matchPath(
      specifier.replace(JS_LIKE_EXTENSION_RE, ''),
      undefined,
      undefined,
      SOURCE_EXTENSIONS,
    );
  }

  return matchedPath;
};
