import {
  type EagerRouteComponentFilesByEntry,
  type RouteComponentFileCollection,
  normalizeModulePath,
} from '@modern-js/utils';

// The COLLECTION side of this feature (`collectRouteComponentFiles`,
// `normalizeModulePath`, `RouteComponentFileCollection`) lives in
// `@modern-js/utils` so the route generator in `@modern-js/runtime`
// plugin-runtime can collect route files WITHOUT a runtime value-import of
// `@modern-js/app-tools` (app-tools is only a devDependency there). This module
// keeps the MATCHING/PLANNING side, which is consumed by the SSR builder plugin
// (adapterSSR). Both sides share `normalizeModulePath` from utils so the
// normalization stays identical.
//
// Re-export the collection helpers (which live in utils) so the SSR builder
// plugin's matching side and app-tools' own unit tests have one import surface.
export {
  type EagerRouteComponentFilesByEntry,
  type RouteComponentFileCollection,
  collectRouteComponentFiles,
  normalizeModulePath,
} from '@modern-js/utils';

type ModuleLike = { resource?: string };
type LazyCompilationTestFn = (m: ModuleLike) => boolean;
/** Matches Rspack's `LazyCompilationOptions['test']`. */
type LazyCompilationTest = RegExp | LazyCompilationTestFn | undefined;

export type EagerRouteComponentInfo = {
  files: Set<string>;
  /** Specifiers that could not be resolved, keyed by entry name. */
  unresolvedByEntry: Map<string, string[]>;
};

/**
 * Aggregate the per-entry route component data (collected by the router plugin
 * during route generation and threaded in as
 * `BuilderOptions.eagerRouteComponentFilesByEntry`) into the flat shape
 * {@link planSSRLazyCompilation} expects: one Set of all route files plus the
 * unresolved specifiers keyed by entry.
 */
export function aggregateEagerRouteComponentFiles(
  byEntry: EagerRouteComponentFilesByEntry | undefined,
): EagerRouteComponentInfo {
  const files = new Set<string>();
  const unresolvedByEntry = new Map<string, string[]>();
  if (byEntry) {
    for (const [entryName, collection] of byEntry) {
      for (const file of collection.resolvedFiles) {
        files.add(file);
      }
      if (collection.unresolvedSpecifiers.length > 0) {
        unresolvedByEntry.set(entryName, collection.unresolvedSpecifiers);
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
  eagerRouteFiles: Set<string>,
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
    if (eagerRouteFiles.has(normalizeModulePath(resource))) {
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
  info: EagerRouteComponentInfo,
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
