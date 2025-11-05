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
    const response = await fetch(url, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return undefined;
    }
    return (await response.json()) as T;
  } catch {
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

    const remoteDefinitions = normaliseRemoteEntries(options.remotes);
    const initMessage = `[module-federation] remote RSC manifest plugin initialised with ${remoteDefinitions.length} remote(s).`;
    logger?.info?.(initMessage);
    if (!logger?.info) {
      console.log(initMessage);
    }

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
          return joinUrl(publicPath, 'bundles/static/remoteEntry.js');
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

    const ensureRemoteArtifacts = async () => {
      if (remoteDefinitions.length === 0) {
        clearRemoteRscArtifacts();
        return;
      }

      const tasks = remoteDefinitions.map(remote => {
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
