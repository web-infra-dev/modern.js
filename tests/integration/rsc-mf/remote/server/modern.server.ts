import {
  type MiddlewareHandler,
  defineServerConfig,
} from '@modern-js/server-runtime';

const INTERNAL_FALLBACK_HEADER = 'x-rsc-mf-internal-fallback';
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

const isExposeAssetRequestPath = (pathname: string) =>
  pathname.includes('__federation_expose_') &&
  (pathname.endsWith('.js') || pathname.endsWith('.css'));

const getRequestedAssetDirectory = (pathname: string) =>
  pathname.includes('/static/css/async/')
    ? 'static/css/async/'
    : 'static/js/async/';

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
  if (!isExposeAssetRequestPath(pathname)) {
    return undefined;
  }

  const canonicalRequestedChunkName = toCanonicalChunkName(pathname);
  if (!canonicalRequestedChunkName) {
    return undefined;
  }

  const requestedAssetDirectory = getRequestedAssetDirectory(pathname);
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
  requestedAssetDirectory,
}: {
  remoteOrigin: string;
  fallbackAssetPath: string;
  requestSearch: string;
  requestedAssetDirectory: string;
}) => {
  let fallbackAssetUrl: URL;
  try {
    fallbackAssetUrl = new URL(fallbackAssetPath, `${remoteOrigin}/`);
  } catch {
    return undefined;
  }

  if (fallbackAssetUrl.origin !== remoteOrigin) {
    return undefined;
  }
  const normalizedFallbackPathname = fallbackAssetUrl.pathname.replace(
    /^\/+/,
    '',
  );
  if (!normalizedFallbackPathname.startsWith(requestedAssetDirectory)) {
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

const recoverRemoteExposeAssetMiddleware: MiddlewareHandler = async (
  c,
  next,
) => {
  const reqUrl = new URL(c.req.url);
  const pathname = reqUrl.pathname;
  if (!isExposeAssetRequestPath(pathname)) {
    await next();
    return;
  }

  const requestHeaders = c.req.headers;
  const isInternalFallbackFetch =
    requestHeaders?.get?.(INTERNAL_FALLBACK_HEADER) === '1';
  if (isInternalFallbackFetch) {
    await next();
    return;
  }

  const remoteOrigin = reqUrl.origin;
  const manifestResponse = await fetch(
    `${remoteOrigin}${REMOTE_MANIFEST_PATH}`,
    {
      headers: {
        [INTERNAL_FALLBACK_HEADER]: '1',
      },
    },
  ).catch((): undefined => undefined);
  if (!manifestResponse?.ok) {
    await next();
    return;
  }

  const manifest = (await manifestResponse
    .json()
    .catch((): undefined => undefined)) as RemoteManifestShape | undefined;
  if (!manifest) {
    await next();
    return;
  }

  const fallbackAssetPath = resolveManifestFallbackAssetPath(
    pathname,
    manifest,
  );
  if (!fallbackAssetPath) {
    await next();
    return;
  }

  const fallbackAssetUrl = createManifestFallbackAssetUrl({
    remoteOrigin,
    fallbackAssetPath,
    requestSearch: reqUrl.search,
    requestedAssetDirectory: getRequestedAssetDirectory(pathname),
  });
  if (!fallbackAssetUrl || fallbackAssetUrl === reqUrl.toString()) {
    await next();
    return;
  }

  const fallbackAssetResponse = await fetch(fallbackAssetUrl, {
    headers: {
      [INTERNAL_FALLBACK_HEADER]: '1',
    },
  }).catch((): undefined => undefined);
  if (!fallbackAssetResponse?.ok) {
    await next();
    return;
  }

  c.res = new Response(await fallbackAssetResponse.arrayBuffer(), {
    status: fallbackAssetResponse.status,
    headers: fallbackAssetResponse.headers,
  });
};

export default defineServerConfig({
  middlewares: [
    {
      name: 'recover-remote-federation-expose-asset',
      handler: recoverRemoteExposeAssetMiddleware,
      order: 'pre',
      before: ['server-static'],
    },
  ],
});
