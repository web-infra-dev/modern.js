import fs from 'node:fs';
import path from 'node:path';

type RouteLike = {
  _component?: string;
  children?: RouteLike[];
};

type ModuleLike = { resource?: string };
type LazyCompilationTestFn = (m: ModuleLike) => boolean;
/** Matches Rspack's `LazyCompilationOptions['test']`. */
type LazyCompilationTest = RegExp | LazyCompilationTestFn | undefined;

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

type CollectResult = {
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

/**
 * Route component data collected during route generation, keyed by app
 * directory then entry name. Kept in module scope (rather than appContext)
 * because the builder receives an appContext snapshot that does not see later
 * `updateAppContext` writes. Recomputed per entry so route changes don't leave
 * stale data.
 */
const routeDataByApp = new Map<string, Map<string, CollectResult>>();

export function setRouteComponentFiles(
  appDirectory: string,
  entryName: string,
  result: CollectResult,
): void {
  let byEntry = routeDataByApp.get(appDirectory);
  if (!byEntry) {
    byEntry = new Map();
    routeDataByApp.set(appDirectory, byEntry);
  }
  byEntry.set(entryName, result);
}

/**
 * Drop an app's collected route data, so a fresh route generation (e.g. after a
 * dev restart triggered by adding/removing routes) doesn't keep stale entries.
 */
export function clearRouteComponentFiles(appDirectory: string): void {
  routeDataByApp.delete(appDirectory);
}

export type RouteComponentInfo = {
  files: Set<string>;
  /** Specifiers that could not be resolved, keyed by entry name. */
  unresolvedByEntry: Map<string, string[]>;
};

export function getRouteComponentFiles(
  appDirectory: string,
): RouteComponentInfo {
  const files = new Set<string>();
  const unresolvedByEntry = new Map<string, string[]>();
  const byEntry = routeDataByApp.get(appDirectory);
  if (byEntry) {
    for (const [entryName, result] of byEntry) {
      for (const file of result.files) {
        files.add(file);
      }
      if (result.unresolved.length > 0) {
        unresolvedByEntry.set(entryName, result.unresolved);
      }
    }
  }
  return { files, unresolvedByEntry };
}

/**
 * Build a `lazyCompilation.test` that forces route component modules to compile
 * eagerly (so SSR first-screen chunk/CSS injection has the assets it needs at
 * render time), while delegating all other modules to the user's `test`
 * (defaulting to lazy when the user did not provide one).
 */
export function buildSSRLazyCompilationTest(
  routeFiles: Set<string>,
  userTest?: LazyCompilationTest,
): LazyCompilationTestFn {
  // Normalize the user's test (RegExp | fn | undefined) to a function.
  const userTestFn: LazyCompilationTestFn =
    typeof userTest === 'function'
      ? userTest
      : userTest instanceof RegExp
        ? (m: ModuleLike) => userTest.test(m.resource || '')
        : () => true;

  return (m: ModuleLike) => {
    const resource = m.resource;
    if (!resource) {
      return userTestFn(m);
    }
    if (routeFiles.has(normalizeModulePath(resource))) {
      // Route component → must be eager, regardless of the user's test.
      return false;
    }
    return userTestFn(m);
  };
}

export type SSRLazyPlan =
  | { apply: false; unresolvedByEntry?: Map<string, string[]> }
  | { apply: true; lazyCompilation: Record<string, unknown> };

/**
 * Decide whether to apply the route-eager lazy compilation for an SSR project.
 * Checks unresolved route components FIRST: if any exist we cannot guarantee
 * they are eager, so we skip the optimization (and surface them so the caller
 * can warn) rather than silently leaving a route lazy. `current` is the
 * existing `dev.lazyCompilation` value (lazy must be enabled for this to apply).
 */
export function planSSRLazyCompilation(
  current: unknown,
  info: RouteComponentInfo,
): SSRLazyPlan {
  if (!current) {
    return { apply: false };
  }
  if (info.unresolvedByEntry.size > 0) {
    return { apply: false, unresolvedByEntry: info.unresolvedByEntry };
  }
  if (info.files.size === 0) {
    return { apply: false };
  }
  const base = typeof current === 'object' ? (current as object) : {};
  const userTest = (current as { test?: LazyCompilationTest }).test;
  return {
    apply: true,
    lazyCompilation: {
      ...base,
      test: buildSSRLazyCompilationTest(info.files, userTest),
    },
  };
}
