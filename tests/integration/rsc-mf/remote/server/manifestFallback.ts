const EXPOSE_CHUNK_HASH_SUFFIX_PATTERN = /\.[a-z0-9]{6,}$/i;
const EXPOSE_CHUNK_HASHED_ASSET_PATTERN = /\.[a-z0-9]{6,}\.(js|css)$/i;
export const INTERNAL_FALLBACK_HEADER = 'x-rsc-mf-internal-fallback';

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

const toNormalizedRequestPath = (pathname: string) =>
  pathname.replace(/^\/+/, '').split(/[?#]/, 1)[0];

const hasChunkHashInAssetPath = (assetPath: string) =>
  EXPOSE_CHUNK_HASHED_ASSET_PATTERN.test(assetPath);

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
  const normalizedRequestedPath = toNormalizedRequestPath(pathname);
  const manifestAssets = collectManifestAssetPaths(manifest);
  const candidateAssets = manifestAssets
    .map(assetPath => ({
      assetPath,
      normalizedAssetPath: toNormalizedManifestAssetPath(assetPath),
    }))
    .filter(({ normalizedAssetPath }) => {
      if (!normalizedAssetPath.startsWith(requestedAssetDirectory)) {
        return false;
      }
      return (
        toCanonicalChunkName(normalizedAssetPath) ===
        canonicalRequestedChunkName
      );
    });

  const preferredCandidate =
    candidateAssets.find(
      ({ normalizedAssetPath }) =>
        normalizedAssetPath !== normalizedRequestedPath &&
        hasChunkHashInAssetPath(normalizedAssetPath),
    ) ||
    candidateAssets.find(
      ({ normalizedAssetPath }) =>
        normalizedAssetPath !== normalizedRequestedPath,
    ) ||
    candidateAssets.find(({ normalizedAssetPath }) =>
      hasChunkHashInAssetPath(normalizedAssetPath),
    ) ||
    candidateAssets[0];

  return preferredCandidate?.assetPath;
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
  let remoteOriginUrl: URL;
  try {
    remoteOriginUrl = new URL(remoteOrigin);
  } catch {
    return undefined;
  }

  let fallbackAssetUrl: URL;
  try {
    fallbackAssetUrl = new URL(fallbackAssetPath, `${remoteOriginUrl.origin}/`);
  } catch {
    return undefined;
  }

  if (fallbackAssetUrl.origin !== remoteOriginUrl.origin) {
    return undefined;
  }
  const normalizedFallbackPathname = fallbackAssetUrl.pathname.replace(
    /^\/+/,
    '',
  );
  let decodedFallbackPathname: string;
  try {
    decodedFallbackPathname = decodeURIComponent(normalizedFallbackPathname);
  } catch {
    return undefined;
  }
  if (!decodedFallbackPathname.startsWith(requestedAssetDirectory)) {
    return undefined;
  }
  if (decodedFallbackPathname.split('/').some(segment => segment === '..')) {
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
