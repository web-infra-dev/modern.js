const EXPOSE_CHUNK_HASH_SUFFIX_PATTERN = /\.[a-z0-9]{6,}$/i;

export interface RemoteManifestAssetEntry {
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

export interface RemoteManifestShape {
  shared?: RemoteManifestAssetEntry[];
  exposes?: RemoteManifestAssetEntry[];
}

export const isExposeAssetRequestPath = (pathname: string) =>
  pathname.includes('__federation_expose_') &&
  (pathname.endsWith('.js') || pathname.endsWith('.css'));

export const getRequestedAssetDirectory = (pathname: string) =>
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

export const resolveManifestFallbackAssetPath = (
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

export const createManifestFallbackAssetUrl = ({
  remoteOrigin,
  fallbackAssetPath,
  requestSearch,
  requestedAssetDirectory,
  requestUrl,
}: {
  remoteOrigin: string;
  fallbackAssetPath: string;
  requestSearch: string;
  requestedAssetDirectory: string;
  requestUrl?: string;
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
  const normalizedFallbackPathname = fallbackAssetUrl.pathname.replace(
    /^\/+/,
    '',
  );
  if (!normalizedFallbackPathname.startsWith(requestedAssetDirectory)) {
    return undefined;
  }

  if (requestSearch) {
    const mergedSearchParams = new URLSearchParams(fallbackAssetUrl.search);
    const requestSearchParams = new URLSearchParams(requestSearch);
    for (const [key, value] of requestSearchParams.entries()) {
      mergedSearchParams.set(key, value);
    }
    const mergedSearch = mergedSearchParams.toString();
    fallbackAssetUrl.search = mergedSearch ? `?${mergedSearch}` : '';
  }

  const resolvedFallbackAssetUrl = fallbackAssetUrl.toString();
  if (requestUrl && resolvedFallbackAssetUrl === requestUrl) {
    return undefined;
  }

  return resolvedFallbackAssetUrl;
};
