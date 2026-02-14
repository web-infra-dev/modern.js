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
import { createSafeProxyResponse } from '../../shared/proxyResponse';

const REMOTE_MANIFEST_PATH = '/static/mf-manifest.json';

const fetchRemoteManifestFallbackAsset = async ({
  remoteOrigin,
  pathname,
  search,
  requestUrl,
}: {
  remoteOrigin: string;
  pathname: string;
  search: string;
  requestUrl: string;
}) => {
  if (!isExposeAssetRequestPath(pathname)) {
    return undefined;
  }

  const manifestResponse = await fetch(
    `${remoteOrigin}${REMOTE_MANIFEST_PATH}`,
    {
      headers: {
        [INTERNAL_FALLBACK_HEADER]: '1',
      },
    },
  )
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
    requestedAssetDirectory: getRequestedAssetDirectory(pathname),
    requestUrl,
  });
  if (!fallbackAssetUrl) {
    return undefined;
  }
  const fallbackAssetResponse = await fetch(fallbackAssetUrl, {
    headers: {
      [INTERNAL_FALLBACK_HEADER]: '1',
    },
  }).catch((): undefined => undefined);
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

const getRequestHeader = (
  c: Parameters<MiddlewareHandler>[0],
  name: string,
) => {
  const requestWithHeaders = c.req as typeof c.req & {
    header?: (headerName: string) => string | undefined;
    headers?: { get?: (headerName: string) => string | null | undefined };
  };
  const headerValue =
    typeof requestWithHeaders.header === 'function'
      ? requestWithHeaders.header(name)
      : undefined;
  return headerValue ?? requestWithHeaders.headers?.get?.(name);
};

const setContextResponse = (
  c: Parameters<MiddlewareHandler>[0],
  response: Response,
) => {
  const contextWithBody = c as typeof c & {
    body?: (
      body: BodyInit | null,
      status?: number,
      headers?: HeadersInit,
    ) => Response;
  };
  if (typeof contextWithBody.body === 'function') {
    const finalizedResponse = contextWithBody.body(
      response.body,
      response.status,
      response.headers,
    );
    c.res = finalizedResponse;
    return finalizedResponse;
  }
  c.res = response;
  return response;
};

const proxyRemoteFederationAsset: MiddlewareHandler = async (c, next) => {
  const isInternalFallbackFetch =
    getRequestHeader(c, INTERNAL_FALLBACK_HEADER) === '1';
  if (isInternalFallbackFetch) {
    await next();
    return;
  }
  const reqUrl = new URL(c.req.url);
  const pathname = reqUrl.pathname;
  const shouldProxy = shouldProxyRemoteAsset(pathname);

  if (!shouldProxy) {
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
        requestUrl: remoteUrl,
      });

  if (!resolvedUpstream || !resolvedUpstream.ok) {
    await next();
    return;
  }

  return setContextResponse(c, createSafeProxyResponse(resolvedUpstream));
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
