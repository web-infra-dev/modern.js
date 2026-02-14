import {
  type MiddlewareHandler,
  defineServerConfig,
} from '@modern-js/server-runtime';
import {
  type RemoteManifestShape,
  createManifestFallbackAssetUrl,
  getRequestedAssetDirectory,
  isExposeAssetRequestPath,
  resolveManifestFallbackAssetPath,
} from '../../shared/manifestFallback';

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
    requestedAssetDirectory: getRequestedAssetDirectory(pathname),
    requestUrl,
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
        requestUrl: remoteUrl,
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
