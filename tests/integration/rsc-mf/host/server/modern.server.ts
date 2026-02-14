import {
  type MiddlewareHandler,
  defineServerConfig,
} from '@modern-js/server-runtime';

const REMOTE_MANIFEST_PATH = '/static/mf-manifest.json';
const EXPOSE_CHUNK_HASH_SUFFIX_PATTERN = /\.[a-z0-9]{6,}$/i;

interface RemoteManifestAssetEntry {
  assets?: {
    js?: {
      sync?: string[];
      async?: string[];
    };
    css?: {
      sync?: string[];
      async?: string[];
    };
  };
}

interface RemoteManifestShape {
  shared?: RemoteManifestAssetEntry[];
  exposes?: RemoteManifestAssetEntry[];
}

const isManifestFallbackEligiblePath = (pathname: string) =>
  pathname.includes('__federation_expose_') &&
  (pathname.endsWith('.js') || pathname.endsWith('.css'));

const toCanonicalChunkName = (filePath: string) =>
  filePath
    .replace(/\/+$/, '')
    .split('/')
    .pop()
    ?.replace(/\.(js|css)$/i, '')
    .replace(EXPOSE_CHUNK_HASH_SUFFIX_PATTERN, '');

const toNormalizedManifestAssetPath = (assetPath: string) => {
  try {
    return new URL(assetPath).pathname.replace(/^\/+/, '');
  } catch {
    return assetPath.replace(/^[./]+/, '').split(/[?#]/, 1)[0];
  }
};

const collectManifestAssetPaths = (manifest: RemoteManifestShape) => {
  const entries = [...(manifest.shared || []), ...(manifest.exposes || [])];
  const assetPaths = new Set<string>();
  for (const entry of entries) {
    const jsSyncAssets = entry.assets?.js?.sync || [];
    const jsAsyncAssets = entry.assets?.js?.async || [];
    const cssSyncAssets = entry.assets?.css?.sync || [];
    const cssAsyncAssets = entry.assets?.css?.async || [];
    for (const assetPath of [
      ...jsSyncAssets,
      ...jsAsyncAssets,
      ...cssSyncAssets,
      ...cssAsyncAssets,
    ]) {
      assetPaths.add(assetPath);
    }
  }
  return [...assetPaths];
};

const resolveManifestFallbackAssetPath = (
  pathname: string,
  manifest: RemoteManifestShape,
) => {
  if (!isManifestFallbackEligiblePath(pathname)) {
    return undefined;
  }

  const canonicalRequestedChunkName = toCanonicalChunkName(pathname);
  if (!canonicalRequestedChunkName) {
    return undefined;
  }

  const requestedAssetDirectory = pathname.includes('/static/css/async/')
    ? 'static/css/async/'
    : 'static/js/async/';
  const manifestAssets = collectManifestAssetPaths(manifest);
  return manifestAssets.find(assetPath => {
    const normalizedAssetPath = toNormalizedManifestAssetPath(assetPath);
    if (!normalizedAssetPath.startsWith(requestedAssetDirectory)) {
      return false;
    }
    return (
      toCanonicalChunkName(normalizedAssetPath) === canonicalRequestedChunkName
    );
  });
};

const createManifestFallbackAssetUrl = ({
  remoteOrigin,
  fallbackAssetPath,
  requestSearch,
}: {
  remoteOrigin: string;
  fallbackAssetPath: string;
  requestSearch: string;
}) => {
  let fallbackAssetUrl: URL;
  try {
    fallbackAssetUrl = new URL(fallbackAssetPath, `${remoteOrigin}/`);
  } catch {
    return undefined;
  }

  if (fallbackAssetUrl.origin !== new URL(remoteOrigin).origin) {
    return undefined;
  }

  if (!requestSearch) {
    return fallbackAssetUrl.toString();
  }

  const mergedSearchParams = new URLSearchParams(fallbackAssetUrl.search);
  const requestSearchParams = new URLSearchParams(requestSearch);
  for (const [key, value] of requestSearchParams.entries()) {
    mergedSearchParams.set(key, value);
  }
  const mergedSearch = mergedSearchParams.toString();
  fallbackAssetUrl.search = mergedSearch ? `?${mergedSearch}` : '';

  return fallbackAssetUrl.toString();
};

const fetchRemoteManifestFallbackAsset = async ({
  remoteOrigin,
  pathname,
  search,
}: {
  remoteOrigin: string;
  pathname: string;
  search: string;
}) => {
  if (!isManifestFallbackEligiblePath(pathname)) {
    return undefined;
  }

  const manifestResponse = await fetch(`${remoteOrigin}${REMOTE_MANIFEST_PATH}`)
    .then(response => {
      if (!response.ok) {
        return undefined;
      }
      return response;
    })
    .catch((): undefined => undefined);

  if (!manifestResponse) {
    return undefined;
  }

  const manifest = (await manifestResponse
    .json()
    .catch((): undefined => undefined)) as RemoteManifestShape | undefined;
  if (!manifest) {
    return undefined;
  }
  const fallbackAssetPath = resolveManifestFallbackAssetPath(
    pathname,
    manifest,
  );
  if (!fallbackAssetPath) {
    return undefined;
  }

  const fallbackAssetUrl = createManifestFallbackAssetUrl({
    remoteOrigin,
    fallbackAssetPath,
    requestSearch: search,
  });
  if (!fallbackAssetUrl) {
    return undefined;
  }
  const fallbackAssetResponse = await fetch(fallbackAssetUrl).catch(
    (): undefined => undefined,
  );
  if (!fallbackAssetResponse || !fallbackAssetResponse.ok) {
    return undefined;
  }
  return fallbackAssetResponse;
};

const shouldProxyRemoteAsset = (pathname: string) => {
  if (pathname.startsWith('/static/js/async/')) {
    return (
      pathname.includes('__federation_expose_') ||
      pathname.includes('_react-server-components_') ||
      pathname.includes('node_modules_pnpm_react')
    );
  }

  if (pathname.startsWith('/static/css/async/')) {
    return pathname.includes('__federation_expose_');
  }

  return false;
};

const proxyRemoteFederationAsset: MiddlewareHandler = async (c, next) => {
  const reqUrl = new URL(c.req.url);
  const pathname = reqUrl.pathname;

  if (!shouldProxyRemoteAsset(pathname)) {
    await next();
    return;
  }

  const remotePort = process.env.RSC_MF_REMOTE_PORT;
  if (!remotePort) {
    await next();
    return;
  }

  const remoteOrigin = `http://127.0.0.1:${remotePort}`;
  const remoteUrl = `${remoteOrigin}${pathname}${reqUrl.search}`;
  const upstream = await fetch(remoteUrl).catch((): undefined => undefined);

  const resolvedUpstream = upstream?.ok
    ? upstream
    : await fetchRemoteManifestFallbackAsset({
        remoteOrigin,
        pathname,
        search: reqUrl.search,
      });

  if (!resolvedUpstream || !resolvedUpstream.ok) {
    await next();
    return;
  }

  c.res = new Response(await resolvedUpstream.arrayBuffer(), {
    status: resolvedUpstream.status,
    headers: resolvedUpstream.headers,
  });
};

export default defineServerConfig({
  middlewares: [
    {
      name: 'proxy-remote-federation-asset',
      handler: proxyRemoteFederationAsset,
      order: 'pre',
      before: ['server-static'],
    },
  ],
});
