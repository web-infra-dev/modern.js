import type { ModuleFederationRuntimePlugin } from '@module-federation/modern-js-v3';

const TARGET_REMOTE_ALIAS = 'rscRemote';
const SSR_BUNDLES_SEGMENT = '/bundles/';

interface FederationRemoteConfig {
  alias?: string;
  name?: string;
  entry?: string;
}

interface FederationInstanceLike {
  options?: {
    remotes?: Record<string, string | FederationRemoteConfig> | unknown[];
  };
}

interface FederationModuleInfoLike {
  alias?: string;
  name?: string;
  metaData?: {
    publicPath?: string;
    ssrPublicPath?: string;
  };
}

interface FederationGlobalLike {
  __INSTANCES__?: FederationInstanceLike[];
  moduleInfo?: Record<string, FederationModuleInfoLike>;
}

const getRemoteOriginPublicPath = (entry: string) => {
  try {
    return `${new URL(entry).origin}/`;
  } catch {
    return undefined;
  }
};

const getNormalizedAbsolutePublicPath = (value: string) => {
  try {
    const publicPathUrl = new URL(value);
    publicPathUrl.search = '';
    publicPathUrl.hash = '';
    publicPathUrl.pathname = publicPathUrl.pathname.endsWith('/')
      ? publicPathUrl.pathname
      : `${publicPathUrl.pathname}/`;
    return publicPathUrl.toString();
  } catch {
    return undefined;
  }
};

const getPublicPathFromSsrPublicPath = (ssrPublicPath: string) => {
  const normalizedSsrPublicPath =
    getNormalizedAbsolutePublicPath(ssrPublicPath);
  if (!normalizedSsrPublicPath) {
    return undefined;
  }
  try {
    const ssrPublicPathUrl = new URL(normalizedSsrPublicPath);
    if (!ssrPublicPathUrl.pathname.endsWith(SSR_BUNDLES_SEGMENT)) {
      return undefined;
    }
    ssrPublicPathUrl.pathname = ssrPublicPathUrl.pathname.replace(
      /\/bundles\/$/,
      '/',
    );
    return ssrPublicPathUrl.toString();
  } catch {
    return undefined;
  }
};

const getGlobalFederationState = () =>
  (globalThis as typeof globalThis & { __FEDERATION__?: FederationGlobalLike })
    .__FEDERATION__;

const getRemoteEntryFromRemoteConfig = (
  remoteConfig: string | FederationRemoteConfig | undefined,
) => {
  if (!remoteConfig) {
    return undefined;
  }
  if (typeof remoteConfig === 'string') {
    const atIndex = remoteConfig.indexOf('@');
    return atIndex >= 0 ? remoteConfig.slice(atIndex + 1) : remoteConfig;
  }
  if (typeof remoteConfig.entry === 'string') {
    return remoteConfig.entry;
  }
  return undefined;
};

const getRemoteEntryFromFederationInstances = (remoteAlias: string) => {
  const federationState = getGlobalFederationState();
  if (!federationState?.__INSTANCES__) {
    return undefined;
  }
  for (const instance of federationState.__INSTANCES__) {
    const remotes = instance?.options?.remotes;
    if (!remotes) {
      continue;
    }
    if (!Array.isArray(remotes) && typeof remotes === 'object') {
      const remoteConfig = remotes[remoteAlias] as
        | string
        | FederationRemoteConfig
        | undefined;
      const remoteEntry = getRemoteEntryFromRemoteConfig(remoteConfig);
      if (remoteEntry) {
        return remoteEntry;
      }
      for (const remotesEntry of Object.values(remotes)) {
        if (
          remotesEntry &&
          typeof remotesEntry === 'object' &&
          'alias' in remotesEntry &&
          remotesEntry.alias === remoteAlias
        ) {
          return getRemoteEntryFromRemoteConfig(
            remotesEntry as FederationRemoteConfig,
          );
        }
      }
      continue;
    }
    if (!Array.isArray(remotes)) {
      continue;
    }
    for (const remoteConfig of remotes) {
      if (!remoteConfig || typeof remoteConfig !== 'object') {
        continue;
      }
      const alias = 'alias' in remoteConfig ? remoteConfig.alias : undefined;
      const name = 'name' in remoteConfig ? remoteConfig.name : undefined;
      if (alias !== remoteAlias && name !== remoteAlias) {
        continue;
      }
      const remoteEntry = getRemoteEntryFromRemoteConfig(
        remoteConfig as FederationRemoteConfig,
      );
      if (remoteEntry) {
        return remoteEntry;
      }
    }
  }
  return undefined;
};

const getRemoteModuleInfoFromFederationState = (remoteAlias: string) => {
  const federationState = getGlobalFederationState();
  if (!federationState?.moduleInfo) {
    return undefined;
  }
  const directRemoteModuleInfo = federationState.moduleInfo[remoteAlias];
  if (directRemoteModuleInfo) {
    return directRemoteModuleInfo;
  }
  return Object.values(federationState.moduleInfo).find(
    moduleInfo =>
      moduleInfo?.alias === remoteAlias || moduleInfo?.name === remoteAlias,
  );
};

const resolveRemotePublicPaths = ({
  remoteAlias,
  remoteEntry,
}: {
  remoteAlias: string;
  remoteEntry?: string;
}) => {
  const preferredRemoteEntry =
    remoteEntry || getRemoteEntryFromFederationInstances(remoteAlias);
  const remotePublicPath = preferredRemoteEntry
    ? getRemoteOriginPublicPath(preferredRemoteEntry)
    : undefined;
  if (remotePublicPath) {
    return {
      remotePublicPath,
      remoteSsrPublicPath: `${remotePublicPath}bundles/`,
    };
  }

  const remoteModuleInfo = getRemoteModuleInfoFromFederationState(remoteAlias);
  const remoteModuleInfoPublicPath = remoteModuleInfo?.metaData?.publicPath
    ? getNormalizedAbsolutePublicPath(remoteModuleInfo.metaData.publicPath)
    : undefined;
  const remoteModuleInfoSsrPublicPath = remoteModuleInfo?.metaData
    ?.ssrPublicPath
    ? getNormalizedAbsolutePublicPath(remoteModuleInfo.metaData.ssrPublicPath)
    : undefined;
  const fallbackRemotePublicPath =
    remoteModuleInfoPublicPath ||
    (remoteModuleInfoSsrPublicPath
      ? getPublicPathFromSsrPublicPath(remoteModuleInfoSsrPublicPath)
      : undefined);
  const fallbackRemoteSsrPublicPath =
    remoteModuleInfoSsrPublicPath ||
    (fallbackRemotePublicPath
      ? `${fallbackRemotePublicPath}bundles/`
      : undefined);
  return {
    remotePublicPath: fallbackRemotePublicPath,
    remoteSsrPublicPath: fallbackRemoteSsrPublicPath,
  };
};

const forceRemotePublicPath = (): ModuleFederationRuntimePlugin => ({
  name: 'rsc-mf-force-remote-public-path',
  loadRemoteSnapshot(args: any) {
    const { remoteInfo, remoteSnapshot } = args;
    if (remoteInfo?.alias !== TARGET_REMOTE_ALIAS || !remoteSnapshot) {
      return args;
    }
    const { remotePublicPath, remoteSsrPublicPath } = resolveRemotePublicPaths({
      remoteAlias: remoteInfo.alias,
      remoteEntry:
        typeof remoteInfo?.entry === 'string' ? remoteInfo.entry : undefined,
    });
    if (!remotePublicPath) {
      return args;
    }

    if ('publicPath' in remoteSnapshot) {
      remoteSnapshot.publicPath = remotePublicPath;
    }
    if (remoteSnapshot.metaData && 'publicPath' in remoteSnapshot.metaData) {
      remoteSnapshot.metaData.publicPath = remotePublicPath;
    }
    if (remoteSnapshot.metaData && 'ssrPublicPath' in remoteSnapshot.metaData) {
      remoteSnapshot.metaData.ssrPublicPath =
        remoteSsrPublicPath || `${remotePublicPath}bundles/`;
    }

    return args;
  },
});

export default forceRemotePublicPath;
