import type { RuntimePluginFuture } from '@modern-js/runtime';
import type {
  ClientManifest as RscClientManifest,
  SSRManifest as RscSSRManifest,
  ServerManifest as RscServerManifest,
} from '@modern-js/types/server';
import type { moduleFederationPlugin as MFPluginOptions } from '@module-federation/sdk';
import {
  getRemoteRscArtifacts,
  mergeClientManifestWithRemotes,
  mergeSSRManifestWithRemotes,
  mergeServerManifestWithRemotes,
  setRemoteRscArtifacts,
} from '../server/remoteRscManifests';

interface RemoteDefinition {
  name: string;
  manifestUrl: string;
}

const normaliseRemoteEntries = (
  remotes: MFPluginOptions.ModuleFederationPluginOptions['remotes'],
): RemoteDefinition[] => {
  if (!remotes) {
    return [];
  }

  const result: RemoteDefinition[] = [];

  const push = (name: string, value?: unknown) => {
    if (!name || typeof value !== 'string') {
      return;
    }
    result.push({ name, manifestUrl: value });
  };

  const parseValue = (value: unknown): string | undefined => {
    if (!value) {
      return undefined;
    }
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return parseValue(value[0]);
    }
    if (typeof value === 'object' && value !== null && 'external' in value) {
      return parseValue((value as Record<string, unknown>).external);
    }
    if (typeof value === 'object' && value !== null && 'url' in value) {
      const inferred = (value as Record<string, unknown>).url;
      return typeof inferred === 'string' ? inferred : undefined;
    }
    return undefined;
  };

  if (Array.isArray(remotes)) {
    remotes.forEach(remote => {
      if (remote && typeof remote === 'object') {
        Object.entries(remote).forEach(([remoteName, remoteValue]) => {
          const parsed = parseValue(remoteValue);
          if (parsed) {
            push(remoteName, parsed);
          }
        });
      }
    });
  } else if (typeof remotes === 'object' && remotes !== null) {
    Object.entries(remotes).forEach(([remoteName, remoteValue]) => {
      const parsed = parseValue(remoteValue);
      if (parsed) {
        push(remoteName, parsed);
      }
    });
  }

  return result;
};

export interface RuntimeContext {
  request?: Request;
  serverManifest?: RscServerManifest;
  clientManifest?: RscClientManifest;
  ssrManifest?: RscSSRManifest;
}

/**
 * Runtime plugin to merge RSC manifests from remote modules with the host's manifests.
 * This enables the host to properly render server components from remote modules.
 */
export const rscManifestMergerPlugin = ({
  remotes,
}: {
  remotes?: MFPluginOptions.ModuleFederationPluginOptions['remotes'];
} = {}): RuntimePluginFuture => {
  console.log(
    '[MF RSC] rscManifestMergerPlugin initialized with remotes:',
    remotes,
  );

  const remoteDefinitions = normaliseRemoteEntries(remotes);
  console.log('[MF RSC] Normalized remote definitions:', remoteDefinitions);

  const pendingLoads = new Map<string, Promise<void>>();

  const loadRemoteArtifacts = async (remote: RemoteDefinition) => {
    const remoteValue = remote.manifestUrl.includes('@')
      ? remote.manifestUrl.split('@')
      : [remote.name, remote.manifestUrl];

    const remoteName = remoteValue[0] || remote.name;
    const manifestUrl = remoteValue[1];

    if (!manifestUrl) {
      console.error(
        `[MF RSC] No manifest URL found for remote "${remoteName}"`,
      );
      return;
    }

    console.log(
      `[MF RSC] Fetching manifest for "${remoteName}" from ${manifestUrl}`,
    );

    const manifestResponse = await fetch(manifestUrl).catch(error => {
      console.error(
        `[MF RSC] Failed to fetch manifest from ${manifestUrl}:`,
        error,
      );
      return undefined;
    });

    if (!manifestResponse?.ok) {
      console.error(
        `[MF RSC] Manifest fetch failed with status ${manifestResponse?.status} from ${manifestUrl}`,
      );
      return;
    }

    const manifestJson = await manifestResponse.json().catch(error => {
      console.error(
        `[MF RSC] Failed to parse manifest JSON from ${manifestUrl}:`,
        error,
      );
      return undefined;
    });

    if (!manifestJson) {
      return;
    }

    // Extract base URL from manifest URL
    // For URL like http://localhost:3002/static/mf-manifest.json, we want http://localhost:3002/
    const defaultRoot = manifestUrl.endsWith('/static/mf-manifest.json')
      ? manifestUrl.slice(0, -'static/mf-manifest.json'.length)
      : new URL('.', manifestUrl).toString();

    // Determine the actual runtime URL by using the manifest fetch URL's origin
    // This handles cases where manifest has hardcoded URLs that don't match runtime
    let publicPath: string;
    let ssrPublicPath: string;

    const manifestPublicPath = manifestJson.metaData?.publicPath;
    const manifestSsrPublicPath = manifestJson.metaData?.ssrPublicPath;

    // If the manifest contains absolute URLs (starting with http:// or https://),
    // check if they match the actual fetch origin. If not, use defaultRoot instead.
    if (
      manifestPublicPath &&
      (manifestPublicPath.startsWith('http://') ||
        manifestPublicPath.startsWith('https://'))
    ) {
      try {
        const manifestOrigin = new URL(manifestPublicPath).origin;
        const fetchOrigin = new URL(manifestUrl).origin;

        // If origins don't match, the manifest has stale/incorrect URLs, use defaultRoot
        if (manifestOrigin !== fetchOrigin) {
          console.warn(
            `[MF RSC] Manifest publicPath origin (${manifestOrigin}) doesn't match fetch origin (${fetchOrigin}), using fetch URL`,
          );
          publicPath = defaultRoot.endsWith('/')
            ? defaultRoot
            : `${defaultRoot}/`;
        } else {
          publicPath = manifestPublicPath.endsWith('/')
            ? manifestPublicPath
            : `${manifestPublicPath}/`;
        }
      } catch {
        publicPath = defaultRoot.endsWith('/')
          ? defaultRoot
          : `${defaultRoot}/`;
      }
    } else if (manifestPublicPath) {
      // Relative path - append to defaultRoot
      publicPath = new URL(manifestPublicPath, defaultRoot).toString();
      if (!publicPath.endsWith('/')) {
        publicPath += '/';
      }
    } else {
      publicPath = defaultRoot.endsWith('/') ? defaultRoot : `${defaultRoot}/`;
    }

    // Same logic for ssrPublicPath
    if (
      manifestSsrPublicPath &&
      (manifestSsrPublicPath.startsWith('http://') ||
        manifestSsrPublicPath.startsWith('https://'))
    ) {
      try {
        const manifestSsrOrigin = new URL(manifestSsrPublicPath).origin;
        const fetchOrigin = new URL(manifestUrl).origin;

        if (manifestSsrOrigin !== fetchOrigin) {
          console.warn(
            `[MF RSC] Manifest ssrPublicPath origin (${manifestSsrOrigin}) doesn't match fetch origin (${fetchOrigin}), using fetch URL`,
          );
          ssrPublicPath = `${publicPath}bundles/`;
        } else {
          ssrPublicPath = manifestSsrPublicPath.endsWith('/')
            ? manifestSsrPublicPath
            : `${manifestSsrPublicPath}/`;
        }
      } catch {
        ssrPublicPath = `${publicPath}bundles/`;
      }
    } else if (manifestSsrPublicPath) {
      // Relative path - append to publicPath
      ssrPublicPath = new URL(manifestSsrPublicPath, publicPath).toString();
      if (!ssrPublicPath.endsWith('/')) {
        ssrPublicPath += '/';
      }
    } else {
      ssrPublicPath = `${publicPath}bundles/`;
    }

    console.log(`[MF RSC] Remote "${remoteName}" paths:`, {
      manifestPublicPath,
      manifestSsrPublicPath,
      defaultRoot,
      publicPath,
      ssrPublicPath,
    });

    const fetchJson = async (url: string) => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.error(`[MF RSC] Failed to fetch ${url}: HTTP ${res.status}`);
          return undefined;
        }
        return await res.json();
      } catch (error) {
        console.error(`[MF RSC] Error fetching ${url}:`, error);
        return undefined;
      }
    };

    const [
      clientManifest,
      serverManifest,
      serverReferencesManifest,
      ssrManifest,
    ] = await Promise.all([
      fetchJson(new URL('react-client-manifest.json', publicPath).toString()),
      fetchJson(
        new URL('react-server-manifest.json', ssrPublicPath).toString(),
      ),
      fetchJson(
        new URL('server-references-manifest.json', ssrPublicPath).toString(),
      ),
      fetchJson(new URL('react-ssr-manifest.json', publicPath).toString()),
    ]);

    setRemoteRscArtifacts({
      name: remoteName,
      manifestUrl,
      publicPath,
      ssrPublicPath,
      clientManifest: clientManifest as RscClientManifest | undefined,
      serverManifest: serverManifest as RscServerManifest | undefined,
      ssrManifest: ssrManifest as RscSSRManifest | undefined,
      serverReferences: serverReferencesManifest as Record<string, unknown>,
    });

    console.log(
      `[MF RSC] Successfully loaded artifacts for remote "${remoteName}"`,
    );
  };

  const ensureRemoteArtifacts = async () => {
    if (remoteDefinitions.length === 0) {
      console.log('[MF RSC] No remote definitions to load');
      return;
    }

    console.log(
      '[MF RSC] Loading artifacts for',
      remoteDefinitions.length,
      'remote(s)',
    );

    const tasks = remoteDefinitions.map(remote => {
      if (getRemoteRscArtifacts().has(remote.name)) {
        console.log(
          `[MF RSC] Remote "${remote.name}" already loaded, skipping`,
        );
        return Promise.resolve();
      }
      const existing = pendingLoads.get(remote.name);
      if (existing) {
        console.log(`[MF RSC] Remote "${remote.name}" is already being loaded`);
        return existing;
      }
      const task = loadRemoteArtifacts(remote).finally(() => {
        pendingLoads.delete(remote.name);
      });
      pendingLoads.set(remote.name, task);
      return task;
    });

    await Promise.all(tasks);
    console.log('[MF RSC] Finished loading all remote artifacts');
  };

  return {
    name: '@module-federation/modern-js/rsc-manifest-merger',

    setup(api) {
      console.log('[MF RSC] Plugin setup() called - registering hooks');

      // Register the beforeRender hook
      api.onBeforeRender(async context => {
        console.log('[MF RSC] onBeforeRender hook called');

        // Load remote artifacts before rendering
        await ensureRemoteArtifacts();

        if (remoteDefinitions.length) {
          pendingLoads.clear();
        }

        const remoteArtifacts = getRemoteRscArtifacts();

        // Skip if no remote artifacts are loaded
        if (remoteArtifacts.size === 0) {
          console.log(
            '[MF RSC] No remote artifacts loaded, skipping manifest merge',
          );
          return context;
        }

        // Merge the manifests
        const mergedContext = {
          ...context,
          clientManifest: mergeClientManifestWithRemotes(
            context.clientManifest,
          ),
          serverManifest: mergeServerManifestWithRemotes(
            context.serverManifest,
          ),
          ssrManifest: mergeSSRManifestWithRemotes(context.ssrManifest),
        };

        console.log(
          '[MF RSC] Merged manifests from',
          remoteArtifacts.size,
          'remote(s)',
        );

        // Log remote artifacts for debugging
        for (const [name, artifact] of remoteArtifacts.entries()) {
          console.log(`[MF RSC] Remote "${name}":`, {
            clientManifest: artifact.clientManifest ? 'loaded' : 'missing',
            serverManifest: artifact.serverManifest ? 'loaded' : 'missing',
            ssrManifest: artifact.ssrManifest ? 'loaded' : 'missing',
          });
        }

        return mergedContext;
      });
    },
  };
};

export default rscManifestMergerPlugin;

// Provide backwards-compatible named export expected by runtime-register
export const mfRscManifestMergerPlugin = rscManifestMergerPlugin;
