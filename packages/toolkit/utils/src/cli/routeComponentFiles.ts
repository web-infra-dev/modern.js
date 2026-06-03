import fs from 'node:fs';
import path from 'node:path';

/**
 * Shared route-component-file collection + path normalization.
 *
 * Lives in `@modern-js/utils` because it is needed on BOTH sides of the stream
 * SSR lazy-compilation route-eager feature, which sit in different packages
 * that must NOT depend on each other at runtime:
 *   - the COLLECTION side (`@modern-js/runtime` plugin-runtime, during route
 *     generation) walks the FINAL routes and normalizes each route file path;
 *   - the MATCHING side (`@modern-js/app-tools`, in the SSR builder plugin)
 *     normalizes `module.resource` to compare against the collected set.
 * Both normalizations MUST be identical, and both packages already depend on
 * `@modern-js/utils`, so the single source of truth lives here.
 */

type RouteLike = {
  _component?: string;
  children?: RouteLike[];
};

const RESOLVE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs'];

/**
 * Normalize a path so that route-component collection and `module.resource`
 * comparison use the exact same form: resolve symlinks (best effort), make it
 * absolute, and use POSIX separators. Used on both sides of the `test` match so
 * Windows / symlink / mixed-separator paths still line up.
 */
export function normalizeModulePath(filePath: string): string {
  const absolute = path.resolve(filePath);
  let real = absolute;
  try {
    real = fs.realpathSync.native(absolute);
  } catch {
    // File may not exist yet (virtual / not emitted); fall back to absolute.
  }
  return real.split(path.sep).join('/');
}

export type CollectResult = {
  /** Normalized absolute paths of resolved route component files. */
  files: Set<string>;
  /** `_component` specifiers that could not be mapped to a real file. */
  unresolved: string[];
};

/**
 * Resolve a route component's `_component` (alias form from `replaceWithAlias`,
 * possibly without extension) to a real file, normalized. Intentionally narrow:
 * only alias-relative or absolute specifiers that map to an existing file. npm
 * packages / other aliases / server-only conditional exports are NOT resolved
 * here — they are reported as unresolved so the caller can bail out instead of
 * silently leaving a route lazy.
 */
function resolveRouteComponentFile(
  component: string,
  srcDirectory: string,
  srcAlias: string,
): string | undefined {
  const normalizedAlias = srcAlias.replace(/[\\/]+$/, '');
  let candidate: string | undefined;

  if (
    component === normalizedAlias ||
    component.startsWith(`${normalizedAlias}/`)
  ) {
    const relative = component
      .slice(normalizedAlias.length)
      .replace(/^\/+/, '');
    candidate = path.resolve(srcDirectory, relative);
  } else if (path.isAbsolute(component)) {
    candidate = path.resolve(component);
  } else {
    return undefined;
  }

  if (path.extname(candidate) && fs.existsSync(candidate)) {
    return normalizeModulePath(candidate);
  }
  for (const ext of RESOLVE_EXTENSIONS) {
    if (fs.existsSync(candidate + ext)) {
      return normalizeModulePath(candidate + ext);
    }
  }
  for (const ext of RESOLVE_EXTENSIONS) {
    const indexFile = path.join(candidate, `index${ext}`);
    if (fs.existsSync(indexFile)) {
      return normalizeModulePath(indexFile);
    }
  }
  return undefined;
}

/**
 * Walk the file-system route tree and collect the normalized absolute file
 * paths of every route component, plus any `_component` specifiers that could
 * not be resolved to a real file.
 */
export function collectRouteComponentFiles(
  routes: unknown,
  srcDirectory: string,
  srcAlias: string,
): CollectResult {
  const files = new Set<string>();
  const unresolved: string[] = [];
  const walk = (list: unknown) => {
    if (!Array.isArray(list)) {
      return;
    }
    for (const route of list as RouteLike[]) {
      if (route._component) {
        const file = resolveRouteComponentFile(
          route._component,
          srcDirectory,
          srcAlias,
        );
        if (file) {
          files.add(file);
        } else {
          unresolved.push(route._component);
        }
      }
      walk(route.children);
    }
  };
  walk(routes);
  return { files, unresolved };
}
