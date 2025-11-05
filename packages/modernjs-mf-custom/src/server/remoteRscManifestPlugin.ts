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
      preloadPromise = (async () => {
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
      })();
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
