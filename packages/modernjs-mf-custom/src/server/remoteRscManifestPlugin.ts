import type { ServerPlugin } from '@modern-js/server-runtime';
import type {
  ClientManifest as RscClientManifest,
  SSRManifest as RscSSRManifest,
  ServerManifest as RscServerManifest,
} from '@modern-js/types/server';
import type { moduleFederationPlugin } from '@module-federation/sdk';
import {
  buildServerActionLookup,
  clearRemoteRscArtifacts,
  getRemoteRscArtifacts,
  mergeClientManifestWithRemotes,
  mergeSSRManifestWithRemotes,
  mergeServerManifestWithRemotes,
  setRemoteRscArtifacts,
} from './remoteRscManifests';

interface RemoteDefinition {
  name: string;
  manifestUrl: string;
}

interface RemoteRscManifestPluginOptions {
  remotes?:
    | moduleFederationPlugin.ModuleFederationPluginOptions['remotes']
    | undefined;
}

const MANIFEST_SUFFIX = '/static/mf-manifest.json';

const ensureTrailingSlash = (value: string) =>
  value.endsWith('/') ? value : `${value}/`;

const joinUrl = (base: string, relative: string) => {
  try {
    return new URL(relative, base).toString();
  } catch {
    return `${base.replace(/\/$/, '')}/${relative.replace(/^\//, '')}`;
  }
};

const normaliseEntryRelativePath = (
  entry: { path?: string; name?: string } | undefined,
  fallback: string,
) => {
  if (!entry) {
    return fallback;
  }
  const name = typeof entry.name === 'string' ? entry.name : fallback;
  if (typeof entry.path !== 'string' || entry.path.length === 0) {
    return name;
  }
  return `${entry.path.replace(/\/$/, '')}/${name.replace(/^\//, '')}`;
};

const resolveManifestEntryUrl = (
  entry: unknown,
  base: string | undefined,
  fallback: string,
) => {
  if (!entry) {
    return undefined;
  }
  if (typeof entry === 'string') {
    if (/^https?:\/\//i.test(entry) || !base) {
      return entry;
    }
    return joinUrl(base, entry);
  }
  if (typeof entry === 'object') {
    const candidateUrl = (entry as Record<string, unknown>).url;
    if (typeof candidateUrl === 'string') {
      return candidateUrl;
    }
    const relative = normaliseEntryRelativePath(
      entry as { path?: string; name?: string },
      fallback,
    );
    if (!base) {
      return relative;
    }
    return joinUrl(base, relative);
  }
  return undefined;
};

const normaliseRemoteEntries = (
  remotes: RemoteRscManifestPluginOptions['remotes'],
): RemoteDefinition[] => {
  if (!remotes) {
    return [];
  }

  const result: RemoteDefinition[] = [];
  const pushIfValid = (name: string, url?: string) => {
    if (!name || !url) {
      return;
    }
    result.push({ name, manifestUrl: url });
  };

  const parseRemoteValue = (value: unknown): string | undefined => {
    if (!value) {
      return undefined;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      return parseRemoteValue(value[0]);
    }

    if (
      typeof value === 'object' &&
      'external' in (value as Record<string, unknown>)
    ) {
      return parseRemoteValue((value as Record<string, unknown>).external);
    }

    if (
      typeof value === 'object' &&
      'url' in (value as Record<string, unknown>)
    ) {
      const possible = (value as Record<string, unknown>).url;
      return typeof possible === 'string' ? possible : undefined;
    }

    return undefined;
  };

  if (Array.isArray(remotes)) {
    for (const item of remotes) {
      if (item && typeof item === 'object') {
        for (const [remoteName, remoteValue] of Object.entries(item)) {
          const parsed = parseRemoteValue(remoteValue);
          pushIfValid(remoteName, parsed);
        }
      }
    }
  } else if (typeof remotes === 'object') {
    for (const [remoteName, remoteValue] of Object.entries(remotes)) {
      const parsed = parseRemoteValue(remoteValue);
      pushIfValid(remoteName, parsed);
    }
  }

  return result;
};

const splitRemoteString = (remoteValue: string) => {
  const atIndex = remoteValue.indexOf('@');
  if (atIndex === -1) {
    return { name: '', url: '' };
  }
  const name = remoteValue.slice(0, atIndex);
  const url = remoteValue.slice(atIndex + 1);
  return { name, url };
};

// Cache for filesystem bundle validation
const readyBundles = new Map<string, number>();

// Clear readiness cache in dev mode (for HMR)
const clearReadinessCacheInDev = () => {
  if (process.env.NODE_ENV === 'development') {
    readyBundles.clear();
  }
};

/**
 * Get the render bundle load specification for a remote.
 * Returns the location and mode (http or filesystem) for loading the server render bundle.
 */
export const getRenderBundleLoadSpec = (
  remoteName: string,
): { mode: 'http' | 'filesystem'; location: string } | null => {
  const artifacts = getRemoteRscArtifacts().get(remoteName);

  if (!artifacts) {
    if (process.env.DEBUG_MF_RSC_SERVER) {
      console.warn(`[MF RSC] No artifacts found for remote "${remoteName}"`);
    }
    return null;
  }

  if (!artifacts.renderBundle) {
    if (process.env.DEBUG_MF_RSC_SERVER) {
      console.warn(
        `[MF RSC] render bundle missing for "${remoteName}". Looked for meta.renderBundle and react-ssr-manifest.json.`,
      );
    }
    return null;
  }

  const isFilesystemMode = process.env.FEDERATION_CHUNK_LOAD === 'filesystem';

  if (isFilesystemMode) {
    // Filesystem mode: resolve to absolute path
    try {
      const path = require('path') as any;
      const fs = require('fs') as any;

      // Derive remote dist directory from manifestUrl or ssrPublicPath
      let remoteDistDir: string | null = null;

      // Try to parse from manifestUrl if it's a file:// URL or absolute path
      if (artifacts.manifestUrl.startsWith('file://')) {
        const urlPath = new URL(artifacts.manifestUrl).pathname;
        remoteDistDir = path.dirname(path.dirname(urlPath)); // Go up from static/mf-manifest.json
      } else if (path.isAbsolute(artifacts.manifestUrl)) {
        remoteDistDir = path.dirname(path.dirname(artifacts.manifestUrl));
      }

      if (!remoteDistDir) {
        console.warn(
          `[MF RSC] Cannot determine filesystem path for remote "${remoteName}" (manifestUrl: ${artifacts.manifestUrl})`,
        );
        return null;
      }

      const location = path.join(remoteDistDir, artifacts.renderBundle);

      if (!fs.existsSync(location)) {
        console.warn(
          `[MF RSC] render bundle not found at filesystem path: ${location}`,
        );
        return null;
      }

      if (process.env.DEBUG_MF_RSC_SERVER) {
        console.log(
          `[MF RSC] render bundle for "${remoteName}": filesystem ${location}`,
        );
      }

      return { mode: 'filesystem', location };
    } catch (err) {
      console.error(
        `[MF RSC] Failed to resolve filesystem path for "${remoteName}":`,
        err,
      );
      return null;
    }
  } else {
    // HTTP mode: build full URL
    if (!artifacts.ssrPublicPath) {
      console.warn(
        `[MF RSC] Cannot build HTTP URL for "${remoteName}": missing ssrPublicPath`,
      );
      return null;
    }

    try {
      const location = new URL(
        artifacts.renderBundle,
        artifacts.ssrPublicPath,
      ).toString();

      if (process.env.DEBUG_MF_RSC_SERVER) {
        console.log(
          `[MF RSC] render bundle for "${remoteName}": http ${location}`,
        );
      }

      return { mode: 'http', location };
    } catch (err) {
      console.error(
        `[MF RSC] Failed to build HTTP URL for "${remoteName}":`,
        err,
      );
      return null;
    }
  }
};

/**
 * Ensure the render bundle is ready for SSR.
 * For filesystem mode, validates and warms the import cache.
 * For HTTP mode, just validates the spec exists.
 * Returns null if bundle cannot be loaded, with actionable error message.
 */
export const ensureRenderBundleReady = async (
  remoteName: string,
): Promise<{ mode: 'http' | 'filesystem'; location: string } | null> => {
  const bundleSpec = getRenderBundleLoadSpec(remoteName);

  if (!bundleSpec) {
    console.error(
      `[MF RSC] Cannot find render bundle for remote "${remoteName}". Ensure the remote emits bundles/server.js or bundles/server-component-root.js, and that ssrPublicPath is correctly configured.`,
    );
    return null;
  }

  // For filesystem mode, validate by attempting import with cache busting in dev
  if (bundleSpec.mode === 'filesystem') {
    try {
      const fs = require('fs') as any;
      const { pathToFileURL } = await import('url');

      // Get file mtime for cache busting in dev mode
      let mtime = 0;
      if (process.env.NODE_ENV === 'development') {
        try {
          const stat = fs.statSync(bundleSpec.location);
          mtime = stat.mtimeMs;
        } catch {}
      }

      // Check if already validated with current mtime
      const cached = readyBundles.get(remoteName);
      if (
        cached !== undefined &&
        (process.env.NODE_ENV !== 'development' || cached === mtime)
      ) {
        return bundleSpec;
      }

      // Build file URL with cache busting query in dev
      let fileUrl = pathToFileURL(bundleSpec.location).href;
      if (process.env.NODE_ENV === 'development' && mtime > 0) {
        fileUrl += `?v=${mtime}`;
      }

      // Attempt to import to validate and warm cache
      await import(fileUrl);

      if (process.env.DEBUG_MF_RSC_SERVER) {
        console.log(
          `[MF RSC] Validated filesystem render bundle for "${remoteName}": ${bundleSpec.location}`,
        );
      }

      readyBundles.set(remoteName, mtime);
      return bundleSpec;
    } catch (err) {
      console.error(
        `[MF RSC] Failed to load filesystem render bundle for "${remoteName}" at ${bundleSpec.location}:`,
        err,
      );
      return null;
    }
  }

  // For HTTP mode, just mark as ready (MF runtime will handle fetching)
  // In dev mode, re-validate on each request to catch remote changes
  const shouldValidate =
    process.env.NODE_ENV !== 'development' || !readyBundles.has(remoteName);

  if (shouldValidate) {
    if (process.env.DEBUG_MF_RSC_SERVER) {
      console.log(
        `[MF RSC] HTTP render bundle ready for "${remoteName}": ${bundleSpec.location}`,
      );
    }
    readyBundles.set(remoteName, Date.now());
  }

  return bundleSpec;
};

/**
 * Create middleware that validates remote SSR bundles are ready before rendering.
 * Returns 503 if any remote bundle is unavailable, preventing 610 errors.
 */
export const createSsrRemotesReadinessMiddleware = () => {
  return async (c: any, next: any) => {
    // Only validate on potential SSR requests
    const accept = String(c.req.header('accept') || '');
    const method = c.req.method;
    const url = c.req.url;

    // Heuristic: likely an SSR request if:
    // - GET method
    // - Accepts HTML or wildcard, OR doesn't explicitly request JSON/JS/CSS
    const isStaticAsset =
      url.includes('/static/') ||
      url.includes('/bundles/') ||
      accept.includes('application/json') ||
      accept.includes('application/javascript') ||
      accept.includes('text/css') ||
      accept.includes('image/');

    const isLikelyHtmlRequest =
      method === 'GET' &&
      !isStaticAsset &&
      (accept.includes('text/html') || accept.includes('*/*') || accept === '');

    if (!isLikelyHtmlRequest) {
      return next();
    }

    // Get all known remotes from artifacts
    const artifacts = getRemoteRscArtifacts();
    if (artifacts.size === 0) {
      // No remotes configured, continue
      return next();
    }

    // Validate each remote's render bundle is ready (concurrent with timeout)
    const remoteNames = Array.from(artifacts.keys());
    if (process.env.DEBUG_MF_RSC_SERVER) {
      console.log(
        `[MF RSC] Validating SSR bundles for remotes: ${remoteNames.join(', ')}`,
      );
    }

    // Validate concurrently with per-remote timeout
    const REMOTE_TIMEOUT_MS = 2000;
    const validationPromises = remoteNames.map(async remoteName => {
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout validating ${remoteName}`)),
          REMOTE_TIMEOUT_MS,
        ),
      );

      try {
        const spec = await Promise.race([
          ensureRenderBundleReady(remoteName),
          timeoutPromise,
        ]);

        if (!spec) {
          return {
            remoteName,
            error: `Bundle not found or invalid`,
          };
        }

        return { remoteName, spec };
      } catch (err: any) {
        return {
          remoteName,
          error: err.message || 'Unknown error',
        };
      }
    });

    const results = await Promise.all(validationPromises);

    // Check for any failures
    const failures = results.filter(r => 'error' in r);
    if (failures.length > 0) {
      const errorMsg = `[MF RSC] Remote SSR bundle(s) unavailable:\n${failures.map((f: any) => `  - ${f.remoteName}: ${f.error}`).join('\n')}\nCheck that remotes are built and accessible.`;

      console.error(errorMsg);
      clearReadinessCacheInDev(); // Clear cache for retry on next request
      return c.text(errorMsg, 503);
    }

    if (process.env.DEBUG_MF_RSC_SERVER) {
      console.log(`[MF RSC] All ${remoteNames.length} remote(s) ready for SSR`);
    }

    return next();
  };
};

const fetchJson = async <T>(url: string): Promise<T | undefined> => {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (process.env.DEBUG_MF_RSC_SERVER) {
      console.log(`[MF RSC] fetch ${url} -> ${response.status}`);
    }
    if (!response.ok) {
      return undefined;
    }
    return (await response.json()) as T;
  } catch (err) {
    if (process.env.DEBUG_MF_RSC_SERVER) {
      console.log(`[MF RSC] fetch ${url} failed:`, err);
    }
    return undefined;
  }
};

const deriveBaseUrls = (manifestUrl: string, metaData?: any) => {
  const defaultRoot = manifestUrl.endsWith(MANIFEST_SUFFIX)
    ? manifestUrl.slice(0, -MANIFEST_SUFFIX.length)
    : new URL('.', manifestUrl).toString();

  const publicPath = ensureTrailingSlash(
    metaData?.publicPath || defaultRoot || manifestUrl,
  );

  const ssrPublicPath = ensureTrailingSlash(
    metaData?.ssrPublicPath ||
      (publicPath.endsWith('bundles/')
        ? publicPath
        : new URL('bundles/', publicPath).toString()),
  );

  return {
    publicPath,
    ssrPublicPath,
  };
};

export const remoteRscManifestPlugin = (
  options: RemoteRscManifestPluginOptions,
): ServerPlugin => ({
  name: '@module-federation/modern-js/remote-rsc-manifest',
  setup: api => {
    console.log('[module-federation] remote RSC manifest plugin setup invoked');
    api.onPrepare(() => {
      console.log('[module-federation] remote RSC manifest plugin onPrepare');
    });

    const logger = api.getLogger
      ? api.getLogger()
      : { info: console.log, warn: console.warn, error: console.error };

    let remoteDefinitions = normaliseRemoteEntries(options.remotes);
    // Load persisted remotes if not provided by plugin options
    if (remoteDefinitions.length === 0) {
      try {
        // Use sync require to avoid top-level await in CJS
        const path = require('path') as any;
        const fs = require('fs') as any;
        const file = path.join(
          process.cwd(),
          'node_modules',
          '.modern-js',
          'mf-remotes.json',
        );
        if (fs.existsSync(file)) {
          const json = JSON.parse(fs.readFileSync(file, 'utf-8')) as {
            definitions?: Array<{ name: string; manifestUrl: string }>;
          };
          if (json?.definitions?.length) {
            console.log(
              '[MF RSC] Loaded remotes from persisted JSON:',
              json.definitions,
            );
            remoteDefinitions = json.definitions;
          }
        }
      } catch {}
    }
    if (remoteDefinitions.length === 0) {
      const envCsr = process.env.RSC_CSR_REMOTE_URL || process.env.REMOTE_URL;
      const envSsr = process.env.RSC_SSR_REMOTE_URL;
      const defs: RemoteDefinition[] = [];
      if (envCsr) {
        defs.push({
          name: 'rsc_csr_remote',
          manifestUrl: new URL('static/mf-manifest.json', envCsr).toString(),
        });
      }
      if (envSsr) {
        defs.push({
          name: 'rsc_ssr_remote',
          manifestUrl: new URL('static/mf-manifest.json', envSsr).toString(),
        });
      }
      if (defs.length) {
        console.log('[MF RSC] Fallback remotes from env:', defs);
        remoteDefinitions = defs;
      }
    }
    const initMessage = `[module-federation] remote RSC manifest plugin initialised with ${remoteDefinitions.length} remote(s). remotes option type=${typeof options.remotes}`;
    logger?.info?.(initMessage);
    if (!logger?.info) {
      console.log(initMessage);
    }
    try {
      console.log('[MF RSC] remotes option snapshot:', options.remotes);
      console.log('[MF RSC] env REMOTE_URL=', process.env.REMOTE_URL);
      console.log(
        '[MF RSC] env RSC_CSR_REMOTE_URL=',
        process.env.RSC_CSR_REMOTE_URL,
      );
      console.log(
        '[MF RSC] env RSC_SSR_REMOTE_URL=',
        process.env.RSC_SSR_REMOTE_URL,
      );
    } catch {}

    // Early background preload so first request sees merged manifests
    let preloadPromise: Promise<void> | undefined;
    const startPreload = () => {
      if (preloadPromise) return preloadPromise;
      // Defer execution so helper functions declared below are initialized
      preloadPromise = Promise.resolve().then(async () => {
        try {
          if (remoteDefinitions.length === 0) {
            const persisted = readPersistedRemotes();
            if (persisted.length) {
              console.log(
                '[MF RSC] (prepare) using persisted remotes:',
                persisted,
              );
              remoteDefinitions = persisted;
            } else {
              const fromConfig = await loadRemotesFromAppConfig();
              if (fromConfig.length) {
                console.log(
                  '[MF RSC] (prepare) using app-config remotes:',
                  fromConfig,
                );
                remoteDefinitions = fromConfig;
              }
            }
          }
          if (remoteDefinitions.length) {
            const tasks = remoteDefinitions.map(r => loadRemoteArtifacts(r));
            await Promise.allSettled(tasks);
          }
        } catch (err) {
          console.warn('[MF RSC] (prepare) failed to preload remotes:', err);
        }
      });
      return preloadPromise;
    };

    // kick off preload
    startPreload();

    const logFederationRemotes = (phase: string) => {
      if (!process.env.DEBUG_MF_RSC_SERVER) {
        return;
      }
      try {
        const federation = (globalThis as any).__FEDERATION__;
        if (!federation) {
          console.log(`[MF RSC] (${phase}) federation global unavailable`);
          return;
        }
        const instances = federation.__INSTANCES__;
        if (!instances || !instances.length) {
          console.log(`[MF RSC] (${phase}) federation instances unavailable`);
          return;
        }
        console.log(
          `[MF RSC] (${phase}) federation has ${instances.length} instance(s)`,
        );
        const summary = instances.map((instance: any) => {
          let remotes = instance.options?.remotes;
          if (remotes instanceof Map) {
            remotes = Array.from(remotes.entries());
          }
          let remoteInfo = instance.remoteInfo;
          if (remoteInfo instanceof Map) {
            remoteInfo = Array.from(remoteInfo.entries());
          }
          return {
            name: instance.name,
            remotes,
            remoteInfo,
          };
        });
        console.dir(summary, { depth: 4 });
      } catch (err) {
        console.log(
          `[MF RSC] (${phase}) failed to inspect federation remotes`,
          err,
        );
      }
    };

    const patchRemoteEntry = (
      remoteName: string,
      remoteEntryUrl: string | undefined,
      metaData: any,
      attempt = 0,
    ) => {
      if (!remoteEntryUrl) {
        return false;
      }
      try {
        const federation = (globalThis as any).__FEDERATION__;
        const instances = federation?.__INSTANCES__;
        if (!instances || !instances.length) {
          if (attempt < 5) {
            setTimeout(
              () =>
                patchRemoteEntry(
                  remoteName,
                  remoteEntryUrl,
                  metaData,
                  attempt + 1,
                ),
              50 * (attempt + 1),
            );
          }
          return false;
        }
        let patched = false;
        for (const instance of instances) {
          const remotes = instance.options?.remotes;
          if (Array.isArray(remotes)) {
            for (const remoteOption of remotes) {
              const remoteAlias = remoteOption?.alias || remoteOption?.name;
              if (remoteAlias === remoteName && !remoteOption.entry) {
                remoteOption.entry = remoteEntryUrl;
                if (!remoteOption.entryGlobalName && metaData?.globalName) {
                  remoteOption.entryGlobalName = metaData.globalName;
                }
                patched = true;
              }
            }
          }
          if (instance.remoteInfo instanceof Map) {
            const info = instance.remoteInfo.get(remoteName);
            if (info && !info.entry) {
              info.entry = remoteEntryUrl;
              patched = true;
            }
          } else if (
            instance.remoteInfo &&
            typeof instance.remoteInfo === 'object' &&
            remoteName in instance.remoteInfo &&
            !instance.remoteInfo[remoteName]?.entry
          ) {
            instance.remoteInfo[remoteName].entry = remoteEntryUrl;
            patched = true;
          }
        }
        if (!patched && attempt < 5) {
          setTimeout(
            () =>
              patchRemoteEntry(
                remoteName,
                remoteEntryUrl,
                metaData,
                attempt + 1,
              ),
            50 * (attempt + 1),
          );
        } else if (!patched) {
          console.warn(
            `[MF RSC] Unable to patch federation remote entry for "${remoteName}" after ${attempt + 1} attempt(s).`,
          );
        } else if (patched && process.env.DEBUG_MF_RSC_SERVER) {
          console.log(
            `[MF RSC] Patched federation remote entry for "${remoteName}" with ${remoteEntryUrl}`,
          );
        }
        return patched;
      } catch (err) {
        console.warn(
          `[MF RSC] Failed to patch federation remote entry for "${remoteName}":`,
          err,
        );
      }
      return false;
    };

    const loadRemoteArtifacts = async (remote: RemoteDefinition) => {
      const remoteValue = remote.manifestUrl.includes('@')
        ? splitRemoteString(remote.manifestUrl)
        : { name: remote.name, url: remote.manifestUrl };

      const remoteName = remoteValue.name || remote.name;
      const manifestUrl = remoteValue.url;

      if (!manifestUrl) {
        logger?.warn?.(
          `[module-federation] Skip remote "${remoteName}" manifest fetching because url is empty.`,
        );
        return;
      }

      const manifestJson = await fetchJson<any>(manifestUrl);
      if (!manifestJson) {
        const warnMessage = `[module-federation] Failed to fetch Module Federation manifest for remote "${remoteName}" from ${manifestUrl}.`;
        logger?.warn?.(warnMessage);
        if (!logger?.warn) {
          console.warn(warnMessage);
        }
        return;
      }

      const { publicPath, ssrPublicPath } = deriveBaseUrls(
        manifestUrl,
        manifestJson.metaData,
      );

      const ssrRemoteEntryBase =
        manifestJson.metaData?.ssrPublicPath &&
        typeof manifestJson.metaData.ssrPublicPath === 'string'
          ? ensureTrailingSlash(manifestJson.metaData.ssrPublicPath)
          : ssrPublicPath;

      const clientManifestUrl = new URL(
        'react-client-manifest.json',
        publicPath,
      ).toString();
      const serverManifestUrl = new URL(
        'react-server-manifest.json',
        ssrPublicPath,
      ).toString();
      const serverReferencesManifestUrl = new URL(
        'server-references-manifest.json',
        ssrPublicPath,
      ).toString();
      const rscSSRManifestUrl = new URL(
        'react-ssr-manifest.json',
        publicPath,
      ).toString();

      const [
        clientManifest,
        serverManifest,
        serverReferencesManifest,
        ssrManifest,
      ] = await Promise.all([
        fetchJson(clientManifestUrl),
        fetchJson(serverManifestUrl),
        fetchJson(serverReferencesManifestUrl),
        fetchJson(rscSSRManifestUrl),
      ]);

      if (process.env.DEBUG_MF_RSC_SERVER && serverReferencesManifest) {
        console.log(
          `[MF RSC] Loaded server references manifest for "${remoteName}":`,
          JSON.stringify(serverReferencesManifest, null, 2),
        );
      }

      const remoteEntryUrl = (() => {
        const candidate =
          manifestJson?.ssrRemoteEntry ??
          manifestJson?.metaData?.ssrRemoteEntry ??
          manifestJson?.remoteEntry ??
          manifestJson?.metaData?.remoteEntry;
        const baseForCandidate =
          manifestJson?.ssrRemoteEntry || manifestJson?.metaData?.ssrRemoteEntry
            ? ssrRemoteEntryBase
            : publicPath;

        const resolved = resolveManifestEntryUrl(
          candidate,
          baseForCandidate,
          'static/remoteEntry.js',
        );
        if (resolved) {
          return resolved;
        }
        if (baseForCandidate) {
          return joinUrl(baseForCandidate, 'static/remoteEntry.js');
        }
        if (publicPath) {
          // In development, remotes serve assets from /static only. Avoid
          // using the /bundles prefix which is production-only.
          const dev = process.env.NODE_ENV === 'development';
          return joinUrl(
            publicPath,
            dev ? 'static/remoteEntry.js' : 'bundles/static/remoteEntry.js',
          );
        }
        return undefined;
      })();

      // Infer which bundle is the actual server render bundle
      const renderBundle = await (async () => {
        // Prefer bundles/server-component-root.js if present
        const candidates = [
          'bundles/server-component-root.js',
          'bundles/server.js',
        ];

        for (const candidate of candidates) {
          try {
            const testUrl = new URL(candidate, ssrPublicPath).toString();
            const response = await fetch(testUrl, {
              method: 'HEAD',
              cache: 'no-store',
            });
            if (response.ok) {
              if (process.env.DEBUG_MF_RSC_SERVER) {
                console.log(
                  `[MF RSC] Found render bundle for "${remoteName}": ${candidate}`,
                );
              }
              return candidate;
            }
          } catch {}
        }

        // Fallback: parse react-ssr-manifest.json to find server root chunk
        if (ssrManifest && typeof ssrManifest === 'object') {
          try {
            // Look for the server entry chunk in SSR manifest
            const entries = Object.values(ssrManifest);
            if (entries.length > 0) {
              const serverEntry = entries.find(
                (e: any) =>
                  e &&
                  typeof e === 'object' &&
                  Array.isArray(e.chunks) &&
                  e.chunks.length > 0,
              ) as any;
              if (serverEntry?.chunks?.[0]) {
                const chunk = serverEntry.chunks[0];
                const inferredBundle = `bundles/${chunk}`;
                if (process.env.DEBUG_MF_RSC_SERVER) {
                  console.log(
                    `[MF RSC] Inferred render bundle from SSR manifest for "${remoteName}": ${inferredBundle}`,
                  );
                }
                return inferredBundle;
              }
            }
          } catch {}
        }

        if (process.env.DEBUG_MF_RSC_SERVER) {
          console.warn(
            `[MF RSC] Could not determine render bundle for "${remoteName}", looked for: ${candidates.join(', ')}`,
          );
        }
        return null;
      })();

      setRemoteRscArtifacts({
        name: remoteName,
        manifestUrl,
        publicPath,
        ssrPublicPath,
        clientManifest: clientManifest as RscClientManifest | undefined,
        serverManifest: serverManifest as RscServerManifest | undefined,
        ssrManifest: ssrManifest as RscSSRManifest | undefined,
        serverReferences: serverReferencesManifest as Record<string, unknown>,
        remoteEntry: remoteEntryUrl,
        renderBundle: renderBundle || undefined,
      });

      logFederationRemotes(`after-set-artifacts:${remoteName}`);

      patchRemoteEntry(remoteName, remoteEntryUrl, manifestJson?.metaData);

      const successMessage = `[module-federation] Loaded remote RSC manifests for "${remoteName}"`;
      logger?.info?.(successMessage);
      if (!logger?.info) {
        console.log(successMessage);
      }
    };

    const pendingLoads = new Map<string, Promise<void>>();

    const getFederationRemoteEntries = () => {
      try {
        const federation = (globalThis as any).__FEDERATION__;
        const instances = federation?.__INSTANCES__;
        const out: RemoteDefinition[] = [];
        if (!instances || !instances.length) return out;
        for (const instance of instances) {
          // Prefer concrete remoteInfo entries (post-initialization)
          if (instance.remoteInfo instanceof Map) {
            for (const [name, info] of instance.remoteInfo.entries()) {
              const entry = info?.entry as string | undefined;
              if (name && typeof entry === 'string' && entry.length) {
                // Derive mf-manifest.json from remoteEntry.js location
                const manifestUrl = new URL(
                  'mf-manifest.json',
                  entry,
                ).toString();
                out.push({ name, manifestUrl });
              }
            }
          } else if (
            instance.remoteInfo &&
            typeof instance.remoteInfo === 'object'
          ) {
            for (const [name, info] of Object.entries(instance.remoteInfo)) {
              const entry = (info as any)?.entry as string | undefined;
              if (name && typeof entry === 'string' && entry.length) {
                const manifestUrl = new URL(
                  'mf-manifest.json',
                  entry,
                ).toString();
                out.push({ name, manifestUrl });
              }
            }
          }

          // Fallback: parse options.remotes (pre-initialization)
          const remotes = instance.options?.remotes;
          const pushFromValue = (remoteName: string, value: any) => {
            let str: string | undefined;
            if (typeof value === 'string') str = value;
            else if (Array.isArray(value))
              str = typeof value[0] === 'string' ? value[0] : undefined;
            else if (value && typeof value === 'object') {
              if (typeof value.external === 'string')
                str = value.external as string;
              else if (typeof value.url === 'string') str = value.url as string;
            }
            if (str?.includes('@')) {
              const parts = str.split('@');
              const url = parts.slice(1).join('@');
              try {
                const manifestUrl = new URL('mf-manifest.json', url).toString();
                out.push({ name: remoteName, manifestUrl });
              } catch {}
            }
          };
          if (Array.isArray(remotes)) {
            for (const item of remotes) {
              if (item && typeof item === 'object') {
                for (const [remoteName, value] of Object.entries(item)) {
                  pushFromValue(remoteName, value);
                }
              }
            }
          } else if (remotes && typeof remotes === 'object') {
            for (const [remoteName, value] of Object.entries(remotes)) {
              pushFromValue(remoteName, value);
            }
          }
        }
        return out;
      } catch {
        return [] as RemoteDefinition[];
      }
    };

    const readPersistedRemotes = (): RemoteDefinition[] => {
      try {
        const path = require('path') as any;
        const fs = require('fs') as any;
        const file = path.join(
          process.cwd(),
          'node_modules',
          '.modern-js',
          'mf-remotes.json',
        );
        if (fs.existsSync(file)) {
          const json = JSON.parse(fs.readFileSync(file, 'utf-8')) as {
            definitions?: Array<{ name: string; manifestUrl: string }>;
          };
          if (json?.definitions?.length) {
            return json.definitions;
          }
        }
      } catch {}
      return [];
    };

    const loadRemotesFromAppConfig = async (): Promise<RemoteDefinition[]> => {
      try {
        // Dynamically bundle-require the app's module-federation.config.* file
        const path = require('path') as any;
        const fs = require('fs') as any;
        const candidates = [
          'module-federation.config.ts',
          'module-federation.config.js',
          'module-federation.config.mjs',
          'module-federation.config.cjs',
        ].map((f: string) => path.join(process.cwd(), f));
        const file = candidates.find((p: string) => fs.existsSync(p));
        if (!file) return [];
        const { bundle } = require('@modern-js/node-bundle-require');
        const mod = await bundle(file);
        const cfg = (mod?.default || mod) as { remotes?: any };
        if (!cfg?.remotes) return [];

        const out: RemoteDefinition[] = [];
        const push = (name: string, value: any) => {
          let str: string | undefined;
          if (typeof value === 'string') str = value;
          else if (Array.isArray(value))
            str = typeof value[0] === 'string' ? value[0] : undefined;
          else if (value && typeof value === 'object') {
            if (typeof (value as any).external === 'string')
              str = (value as any).external;
            else if (typeof (value as any).url === 'string')
              str = (value as any).url;
          }
          if (str?.includes('@')) {
            const parts = str.split('@');
            const url = parts.slice(1).join('@');
            try {
              // If the provided URL already points to a manifest, use it as-is.
              const manifestUrl = /mf-manifest\.json(\?|#|$)/.test(url)
                ? url
                : new URL('mf-manifest.json', url).toString();
              out.push({ name, manifestUrl });
            } catch {}
          }
        };

        if (Array.isArray(cfg.remotes)) {
          for (const item of cfg.remotes) {
            if (item && typeof item === 'object') {
              for (const [name, value] of Object.entries(item))
                push(name, value);
            }
          }
        } else if (typeof cfg.remotes === 'object') {
          for (const [name, value] of Object.entries(cfg.remotes))
            push(name, value);
        }
        return out;
      } catch {
        return [];
      }
    };

    const ensureRemoteArtifacts = async () => {
      let defs = remoteDefinitions;
      if (defs.length === 0) {
        // Fallback: derive from federation runtime entries (dev often sets entry only)
        const derived = getFederationRemoteEntries();
        if (derived.length) {
          console.log(
            '[MF RSC] Derived remote definitions from federation:',
            derived,
          );
          defs = derived;
        }
        if (defs.length === 0) {
          const persisted = readPersistedRemotes();
          if (persisted.length) {
            console.log(
              '[MF RSC] Loaded persisted remote definitions:',
              persisted,
            );
            defs = persisted;
          }
        }
        if (defs.length === 0) {
          const fromConfig = await loadRemotesFromAppConfig();
          if (fromConfig.length) {
            console.log(
              '[MF RSC] Loaded remote definitions from app config:',
              fromConfig,
            );
            defs = fromConfig;
          }
        }
      }

      if (defs.length === 0) {
        clearRemoteRscArtifacts();
        return;
      }

      const tasks = defs.map(remote => {
        const existing = getRemoteRscArtifacts().get(remote.name);
        if (existing) {
          return Promise.resolve();
        }
        const existingTask = pendingLoads.get(remote.name);
        if (existingTask) {
          return existingTask;
        }
        const task = loadRemoteArtifacts(remote).finally(() => {
          pendingLoads.delete(remote.name);
        });
        pendingLoads.set(remote.name, task);
        return task;
      });

      await Promise.all(tasks);
    };

    logFederationRemotes('before-load');

    const { middlewares } = api.getServerContext();

    // Add SSR readiness middleware to validate remote bundles before SSR
    middlewares.push({
      name: 'module-federation-ssr-remotes-readiness',
      handler: createSsrRemotesReadinessMiddleware(),
    });

    middlewares.push({
      name: 'module-federation-merge-remote-rsc-manifest',
      handler: async (c, next) => {
        await ensureRemoteArtifacts();
        // If still empty on first pass, await preload once with timeout
        if (getRemoteRscArtifacts().size === 0 && preloadPromise) {
          const timeout = new Promise<void>(resolve =>
            setTimeout(resolve, 2000),
          );
          await Promise.race([preloadPromise.catch(() => {}), timeout]);
          await ensureRemoteArtifacts();
        }

        // Clear readiness cache in dev when artifacts change
        clearReadinessCacheInDev();

        const applyMerge = () => {
          const artifacts = getRemoteRscArtifacts();
          if (!artifacts.size) {
            console.log('[MF RSC] No remote artifacts to merge');
            return;
          }

          const baseClientManifest =
            c.get<RscClientManifest>('rscClientManifest');
          console.log(
            '[MF RSC] Base client manifest:',
            JSON.stringify(baseClientManifest),
          );

          const mergedClient =
            mergeClientManifestWithRemotes(baseClientManifest);
          if (mergedClient) {
            console.log(
              '[MF RSC] Merged client manifest keys:',
              Object.keys(mergedClient),
            );
            c.set('rscClientManifest', mergedClient);
          }

          const baseServerManifest =
            c.get<RscServerManifest>('rscServerManifest');
          const mergedServer =
            mergeServerManifestWithRemotes(baseServerManifest);
          if (mergedServer) {
            console.log(
              '[MF RSC] Merged server manifest keys:',
              Object.keys(mergedServer),
            );
            c.set('rscServerManifest', mergedServer);
          }

          const baseSSRManifest = c.get<RscSSRManifest>('rscSSRManifest');
          const mergedSSR = mergeSSRManifestWithRemotes(baseSSRManifest);
          if (mergedSSR) {
            console.log(
              '[MF RSC] Merged SSR manifest keys:',
              Object.keys(mergedSSR),
            );
            c.set('rscSSRManifest', mergedSSR);
          }

          // Build and expose server action lookup for federation-aware routing
          const serverActionLookup = buildServerActionLookup();
          if (serverActionLookup.size > 0) {
            if (process.env.DEBUG_MF_RSC_SERVER) {
              console.log(
                `[MF RSC] Built server action lookup with ${serverActionLookup.size} entries`,
              );
              for (const [key, value] of serverActionLookup.entries()) {
                console.log(
                  `[MF RSC]   ${key} -> remote=${value.remoteName}, federationRef=${value.reference.federationRef ? JSON.stringify(value.reference.federationRef) : 'none'}`,
                );
              }
            }
            // Store in context for use by server action handlers
            c.set('serverActionLookup', serverActionLookup);
          }
        };

        applyMerge();
        await next();
        applyMerge();
      },
    });
  },
});

export default remoteRscManifestPlugin;
