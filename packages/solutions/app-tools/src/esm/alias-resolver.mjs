import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

let absoluteBaseUrl;
let tsPaths; // { pattern: string, prefix: string, replacements: string[] }[]

const TS_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

function tryResolveFile(filePath) {
  // Try exact path
  try {
    if (fs.statSync(filePath).isFile()) {
      return filePath;
    }
  } catch {}

  // Try adding extensions
  for (const ext of TS_EXTENSIONS) {
    try {
      const withExt = filePath + ext;
      if (fs.statSync(withExt).isFile()) {
        return withExt;
      }
    } catch {}
  }

  // Try index files
  for (const ext of TS_EXTENSIONS) {
    try {
      const indexPath = path.join(filePath, `index${ext}`);
      if (fs.statSync(indexPath).isFile()) {
        return indexPath;
      }
    } catch {}
  }

  return null;
}

function matchAlias(specifier) {
  if (!tsPaths) {
    return null;
  }

  for (const { prefix, hasWildcard, replacements } of tsPaths) {
    if (hasWildcard) {
      if (specifier.startsWith(prefix)) {
        const rest = specifier.slice(prefix.length);
        for (const replacement of replacements) {
          const resolved = path.resolve(absoluteBaseUrl, replacement + rest);
          const file = tryResolveFile(resolved);
          if (file) {
            return file;
          }
        }
      }
    } else {
      if (specifier === prefix) {
        for (const replacement of replacements) {
          const resolved = path.resolve(absoluteBaseUrl, replacement);
          const file = tryResolveFile(resolved);
          if (file) {
            return file;
          }
        }
      }
    }
  }

  return null;
}

export function initialize(data) {
  absoluteBaseUrl = data.absoluteBaseUrl;

  // Convert paths config to lookup-friendly format
  tsPaths = Object.entries(data.paths).map(([pattern, replacements]) => {
    const hasWildcard = pattern.includes('*');
    const prefix = hasWildcard ? pattern.replace('/*', '/') : pattern;
    const processedReplacements = (
      Array.isArray(replacements) ? replacements : [replacements]
    ).map(r => (hasWildcard ? r.replace('/*', '/') : r));

    return { prefix, hasWildcard, replacements: processedReplacements };
  });
}

export function resolve(specifier, context, defaultResolve) {
  // 1. Try tsconfig path aliases
  const aliasMatch = matchAlias(specifier);
  if (aliasMatch) {
    return defaultResolve(pathToFileURL(aliasMatch).href, context);
  }

  // 2. Handle relative imports with missing extensions
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    const parentPath = context.parentURL
      ? fileURLToPath(context.parentURL)
      : undefined;

    if (parentPath) {
      const parentDir = path.dirname(parentPath);
      const absolutePath = path.resolve(parentDir, specifier);
      const resolved = tryResolveFile(absolutePath);
      if (resolved) {
        return defaultResolve(pathToFileURL(resolved).href, context);
      }
    }
  }

  return defaultResolve(specifier, context);
}
