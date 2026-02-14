import {
  type MiddlewareHandler,
  defineServerConfig,
} from '@modern-js/server-runtime';
import {
  INTERNAL_FALLBACK_HEADER,
  type RemoteManifestShape,
  createManifestFallbackAssetUrl,
  getRequestedAssetDirectory,
  isExposeAssetRequestPath,
  resolveManifestFallbackAssetPath,
} from '../../shared/manifestFallback';

const REMOTE_MANIFEST_PATH = '/static/mf-manifest.json';

const createProxyResponse = (upstream: Response) => {
  const headers = new Headers(upstream.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('transfer-encoding');
  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
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
    requestUrl: reqUrl.toString(),
  });
  if (!fallbackAssetUrl) {
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

  c.res = createProxyResponse(fallbackAssetResponse);
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
