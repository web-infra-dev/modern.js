import type {
  ClientManifest as RscClientManifest,
  SSRManifest as RscSSRManifest,
  ServerManifest as RscServerManifest,
} from '@modern-js/types/server';

export interface RemoteRscArtifacts {
  readonly name: string;
  readonly manifestUrl: string;
  readonly publicPath?: string;
  readonly ssrPublicPath?: string;
  readonly clientManifest?: RscClientManifest;
  readonly serverManifest?: RscServerManifest;
  readonly ssrManifest?: RscSSRManifest;
  readonly serverReferences?: Record<string, unknown>;
  readonly remoteEntry?: string;
}

const remoteArtifactsStore = new Map<string, RemoteRscArtifacts>();

export function setRemoteRscArtifacts(artifacts: RemoteRscArtifacts) {
  remoteArtifactsStore.set(artifacts.name, artifacts);
}

export function clearRemoteRscArtifacts() {
  remoteArtifactsStore.clear();
}

export function getRemoteRscArtifacts() {
  return remoteArtifactsStore;
}

export function mergeClientManifestWithRemotes(
  base?: RscClientManifest,
): RscClientManifest | undefined {
  if (remoteArtifactsStore.size === 0) {
    console.log('[MF RSC Merge] No remote artifacts in store');
    return base;
  }

  console.log(
    '[MF RSC Merge] Merging client manifests from',
    remoteArtifactsStore.size,
    'remote(s)',
  );
  console.log(
    '[MF RSC Merge] Base manifest keys:',
    base ? Object.keys(base) : 'none',
  );

  const merged: RscClientManifest = {
    ...(base || {}),
  };

  for (const [remoteName, artifact] of remoteArtifactsStore.entries()) {
    if (artifact.clientManifest) {
      const remoteKeys = Object.keys(artifact.clientManifest);
      console.log(
        `[MF RSC Merge] Merging ${remoteKeys.length} entries from remote "${remoteName}"`,
      );
      console.log(`[MF RSC Merge] Remote keys:`, remoteKeys);
      Object.assign(merged, artifact.clientManifest);
    } else {
      console.log(
        `[MF RSC Merge] Remote "${remoteName}" has no client manifest`,
      );
    }
  }

  console.log(
    '[MF RSC Merge] Final merged manifest keys:',
    Object.keys(merged),
  );
  return merged;
}

export function mergeServerManifestWithRemotes(
  base?: RscServerManifest,
): RscServerManifest | undefined {
  if (remoteArtifactsStore.size === 0) {
    return base;
  }

  const merged: RscServerManifest = {
    ...(base || {}),
  };

  for (const artifact of remoteArtifactsStore.values()) {
    if (artifact.serverManifest) {
      Object.assign(merged, artifact.serverManifest);
    }
  }

  return merged;
}

export function mergeSSRManifestWithRemotes(
  base?: RscSSRManifest,
): RscSSRManifest | undefined {
  if (remoteArtifactsStore.size === 0) {
    return base;
  }

  const merged: RscSSRManifest = {
    ...(base || {}),
  };

  for (const artifact of remoteArtifactsStore.values()) {
    if (artifact.ssrManifest) {
      Object.assign(merged, artifact.ssrManifest);
    }
  }

  return merged;
}

/**
 * Server action reference with federation metadata
 */
export interface ServerActionReference {
  path: string;
  exports: string[];
  moduleId?: string | number | null;
  federationRef?: {
    remote: string;
    expose: string;
  };
}

/**
 * Build a stable lookup map for server actions using federation references when available.
 * This ensures that server action IDs remain stable across module federation boundaries,
 * even when webpack module IDs change.
 */
export function buildServerActionLookup(): Map<
  string,
  {
    reference: ServerActionReference;
    remoteName?: string;
    lookupKey: string;
  }
> {
  const lookup = new Map<
    string,
    {
      reference: ServerActionReference;
      remoteName?: string;
      lookupKey: string;
    }
  >();

  for (const [remoteName, artifact] of remoteArtifactsStore.entries()) {
    if (!artifact.serverReferences) {
      continue;
    }

    const serverRefs = artifact.serverReferences as {
      serverReferences?: ServerActionReference[];
    };

    if (
      !serverRefs.serverReferences ||
      !Array.isArray(serverRefs.serverReferences)
    ) {
      continue;
    }

    for (const ref of serverRefs.serverReferences) {
      // Prefer federation reference for stable lookup
      if (ref.federationRef) {
        const federationKey = `${ref.federationRef.remote}:${ref.federationRef.expose}`;
        lookup.set(federationKey, {
          reference: ref,
          remoteName,
          lookupKey: federationKey,
        });

        // Also register by moduleId as fallback
        if (ref.moduleId != null) {
          const moduleIdKey = `moduleId:${ref.moduleId}`;
          if (!lookup.has(moduleIdKey)) {
            lookup.set(moduleIdKey, {
              reference: ref,
              remoteName,
              lookupKey: moduleIdKey,
            });
          }
        }
      } else if (ref.moduleId != null) {
        // No federation ref, use moduleId only
        const moduleIdKey = `moduleId:${ref.moduleId}`;
        lookup.set(moduleIdKey, {
          reference: ref,
          remoteName,
          lookupKey: moduleIdKey,
        });
      }
    }
  }

  return lookup;
}
