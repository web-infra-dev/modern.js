import React, { createContext, useContext, useMemo } from 'react';

export type MemoryRouteEntry =
  | string
  | {
      pathname?: string;
      search?: string;
      hash?: string;
      state?: unknown;
      key?: string;
    };

export interface MemoryRouterOptions {
  /** Single initial route path, e.g. '/detail/42?tab=info#top'. */
  entryPath?: string;
  /** Full initial history stack passed to `createMemoryRouter`. */
  initialEntries?: MemoryRouteEntry[];
  /** Active index into `initialEntries` (defaults to the last entry). */
  initialIndex?: number;
  /** Initial location state attached to `entryPath` when `initialEntries` is omitted. */
  initialState?: unknown;
  /** Optional basename for the memory router. */
  basename?: string;
}

/**
 * Shorthand or full configuration for memory routing:
 * - `true`: start from the current URL (or `'/'`)
 * - `'/dashboard'`: start from a specific path
 * - `{ entryPath, initialEntries, initialIndex, initialState, basename }`: full options
 */
export type MemoryRouterConfig = boolean | string | MemoryRouterOptions;

export interface NormalizedMemoryRouterConfig {
  initialEntries: MemoryRouteEntry[];
  initialIndex: number;
  activePath: string;
  basename?: string;
  hasExplicitInitialEntry: boolean;
}

export interface MemoryRouteState {
  enabled: boolean;
  initialEntries?: MemoryRouteEntry[];
  initialIndex?: number;
  basename?: string;
}

export interface MemoryRouteProviderProps extends MemoryRouterOptions {
  /** Optional shorthand config (`true`, `'/path'`, or `MemoryRouterOptions`). */
  config?: MemoryRouterConfig;
  children: React.ReactNode;
}

/** Internal context used by `<MemoryRouteProvider>` to configure nested Modern roots. */
export const MemoryRouteContext = createContext<MemoryRouterConfig | undefined>(
  undefined,
);

/** Runtime context exposed to components via `useMemoryRoute()`. */
export const ActiveMemoryRouteContext = createContext<MemoryRouteState>({
  enabled: false,
});

function normalizeBasename(basename?: string): string | undefined {
  if (!basename) return undefined;
  const collapsed = basename.trim().replace(/\/{2,}/g, '/');
  const trimmed = collapsed.replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '/';
}

function hasBasenamePrefix(pathname: string, basename: string): boolean {
  if (!basename || basename === '/') return true;
  return pathname === basename || pathname.startsWith(`${basename}/`);
}

function prefixPathname(pathname: string, basename?: string): string {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const normalizedBase = normalizeBasename(basename);
  if (!normalizedBase || normalizedBase === '/') return normalizedPath;
  if (hasBasenamePrefix(normalizedPath, normalizedBase)) return normalizedPath;
  return normalizedPath === '/'
    ? normalizedBase
    : `${normalizedBase}${normalizedPath}`;
}

function parsePathString(input: string): {
  pathname: string;
  search: string;
  hash: string;
} {
  const url = new URL(input || '/', 'http://modern.memory');
  return {
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
  };
}

export function applyMemoryBasename(
  entry: MemoryRouteEntry,
  basename?: string,
): MemoryRouteEntry {
  const normalizedBase = normalizeBasename(basename);
  if (!normalizedBase || normalizedBase === '/') return entry;
  if (typeof entry === 'string') {
    const parsed = parsePathString(entry);
    return `${prefixPathname(parsed.pathname, normalizedBase)}${parsed.search}${parsed.hash}`;
  }
  return {
    ...entry,
    pathname: prefixPathname(entry.pathname || '/', normalizedBase),
  };
}

export function memoryEntryToPath(entry: MemoryRouteEntry): string {
  if (typeof entry === 'string') {
    const parsed = parsePathString(entry);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }
  const pathname = entry.pathname || '/';
  const normalizedPathname = pathname.startsWith('/')
    ? pathname
    : `/${pathname}`;
  const search = entry.search
    ? entry.search.startsWith('?')
      ? entry.search
      : `?${entry.search}`
    : '';
  const hash = entry.hash
    ? entry.hash.startsWith('#')
      ? entry.hash
      : `#${entry.hash}`
    : '';
  return `${normalizedPathname}${search}${hash}`;
}

/**
 * Normalize shorthand or full `MemoryRouterConfig` into concrete options
 * consumable by both `createMemoryRouter` (CSR/hydration) and
 * `createStaticHandler` (SSR).
 */
export function normalizeMemoryRouterConfig(
  config: MemoryRouterConfig | undefined,
  fallbackUrl = '/',
  fallbackBasename?: string,
): NormalizedMemoryRouterConfig | undefined {
  if (!config) return undefined;

  const fallbackPath = memoryEntryToPath(fallbackUrl);

  if (config === true) {
    const entry = applyMemoryBasename(fallbackPath, fallbackBasename);
    return {
      initialEntries: [entry],
      initialIndex: 0,
      activePath: memoryEntryToPath(entry),
      basename: normalizeBasename(fallbackBasename),
      hasExplicitInitialEntry: false,
    };
  }

  if (typeof config === 'string') {
    const entry = applyMemoryBasename(config, fallbackBasename);
    return {
      initialEntries: [entry],
      initialIndex: 0,
      activePath: memoryEntryToPath(entry),
      basename: normalizeBasename(fallbackBasename),
      hasExplicitInitialEntry: true,
    };
  }

  const effectiveBasename = normalizeBasename(
    config.basename ?? fallbackBasename,
  );
  let rawEntries: MemoryRouteEntry[];
  let hasExplicitInitialEntry = true;

  if (
    Array.isArray(config.initialEntries) &&
    config.initialEntries.length > 0
  ) {
    rawEntries = config.initialEntries;
  } else if (
    typeof config.entryPath === 'string' &&
    config.entryPath.length > 0
  ) {
    if (config.initialState !== undefined) {
      const parsed = parsePathString(config.entryPath);
      rawEntries = [{ ...parsed, state: config.initialState }];
    } else {
      rawEntries = [config.entryPath];
    }
  } else {
    rawEntries = [fallbackPath];
    hasExplicitInitialEntry = false;
  }

  const initialEntries = rawEntries.map(entry =>
    applyMemoryBasename(entry, effectiveBasename),
  );
  const rawIndex =
    typeof config.initialIndex === 'number' &&
    Number.isInteger(config.initialIndex)
      ? config.initialIndex
      : initialEntries.length - 1;
  const initialIndex = Math.min(
    Math.max(rawIndex, 0),
    initialEntries.length - 1,
  );

  return {
    initialEntries,
    initialIndex,
    activePath: memoryEntryToPath(initialEntries[initialIndex]),
    basename: effectiveBasename,
    hasExplicitInitialEntry,
  };
}

/**
 * Produce an updated `MemoryRouterOptions` after an internal SSR redirect so
 * client hydration starts at the landed path while preserving history entries.
 */
export function updateMemoryRouteForRedirect(
  source: MemoryRouterOptions,
  normalized: NormalizedMemoryRouterConfig,
  redirectPath: string,
): MemoryRouterOptions {
  const effectiveBasename = normalized.basename;
  const landedEntry = applyMemoryBasename(redirectPath, effectiveBasename);
  const landedPath = memoryEntryToPath(landedEntry);
  const nextEntries = [...normalized.initialEntries];
  nextEntries[normalized.initialIndex] = landedEntry;
  return {
    ...source,
    entryPath: landedPath,
    initialEntries: nextEntries,
    initialIndex: normalized.initialIndex,
    ...(effectiveBasename && effectiveBasename !== '/'
      ? { basename: effectiveBasename }
      : {}),
  };
}

/**
 * Enable memory routing for a Modern.js root tree via JSX API without touching
 * `modern.runtime.ts` or browser history.
 */
export function MemoryRouteProvider({
  config,
  entryPath,
  initialEntries,
  initialIndex,
  initialState,
  basename,
  children,
}: MemoryRouteProviderProps) {
  const value = useMemo<MemoryRouterConfig>(() => {
    if (config !== undefined) {
      if (
        entryPath === undefined &&
        initialEntries === undefined &&
        initialIndex === undefined &&
        initialState === undefined &&
        basename === undefined
      ) {
        return config;
      }
      const base =
        typeof config === 'object' && config !== null
          ? config
          : typeof config === 'string'
            ? { entryPath: config }
            : {};
      return {
        ...base,
        ...(entryPath !== undefined ? { entryPath } : {}),
        ...(initialEntries !== undefined ? { initialEntries } : {}),
        ...(initialIndex !== undefined ? { initialIndex } : {}),
        ...(initialState !== undefined ? { initialState } : {}),
        ...(basename !== undefined ? { basename } : {}),
      };
    }
    if (
      entryPath === undefined &&
      initialEntries === undefined &&
      initialIndex === undefined &&
      initialState === undefined &&
      basename === undefined
    ) {
      return true;
    }
    return {
      ...(entryPath !== undefined ? { entryPath } : {}),
      ...(initialEntries !== undefined ? { initialEntries } : {}),
      ...(initialIndex !== undefined ? { initialIndex } : {}),
      ...(initialState !== undefined ? { initialState } : {}),
      ...(basename !== undefined ? { basename } : {}),
    };
  }, [config, entryPath, initialEntries, initialIndex, initialState, basename]);

  return (
    <MemoryRouteContext.Provider value={value}>
      {children}
    </MemoryRouteContext.Provider>
  );
}

/** Inspect whether the current Modern.js router is running in memory mode. */
export function useMemoryRoute(): MemoryRouteState {
  return useContext(ActiveMemoryRouteContext);
}
