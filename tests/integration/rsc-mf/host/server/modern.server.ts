import {
  type MiddlewareHandler,
  defineServerConfig,
} from '@modern-js/server-runtime';

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

const REMOTE_COUNTER_ALIAS_MODULE =
  'remote-module:rscRemote:./src/components/RemoteClientCounter.tsx';
const REMOTE_COUNTER_SOURCE_MODULE = './src/components/RemoteClientCounter.tsx';
const REMOTE_ACTION_ID_TO_PROXY_ACTION_ID = {
  '606c30f35d74d843171a8a71358eda595991e4ee16270e9f052af3faef57a19999':
    '603cd42bd1c9b98894c6d03b3b688f513073ddbea04bb02d7fda1e72c57f96b69d',
  '40e41a2ee9d9de373b364dcf2a0201701057c8502037bf9ef2cd26bb2a1259dabd':
    '40f14c24f6d81be75aab6d9dc7941b9507bfbdb9daca25df7b1aed34703972c7ab',
  '408da81ddb8214f8cb98a83552cb70c4d17b27b6fd36d972cac89e7030a4874fd4':
    '40928b48a8dc80bb3a73661fbdbeb14155a85a1b965e9ef67a8f4132bbd4dda7e5',
  '40fd3fd0c01e4d21630b7f6f902c1ddc49d3b05418ca1da003c4fdc6c6272e0bf2':
    '404768f4f5d65c3edafd60e28fc1252837ade49f3b06dad341098530dea5bb7716',
} as const;
const PROXY_REQUEST_HEADER = 'x-rsc-mf-proxy-action';
const createRemoteNestedMixedAliasChunk = () =>
  `\n;(globalThis["chunk_rscHost"] = globalThis["chunk_rscHost"] || []).push([["__federation_expose_RemoteNestedMixed_alias"],{"${REMOTE_COUNTER_ALIAS_MODULE}":function(module,__unused,__webpack_require__){module.exports=__webpack_require__("${REMOTE_COUNTER_SOURCE_MODULE}");}}]);`;

const proxyRemoteRscAction: MiddlewareHandler = async (c, next) => {
  const request = c.req.raw;
  if (request.method !== 'POST') {
    await next();
    return;
  }

  if (request.headers.get(PROXY_REQUEST_HEADER) === '1') {
    await next();
    return;
  }

  const actionId = request.headers.get('x-rsc-action');
  if (!actionId) {
    await next();
    return;
  }

  const proxyActionId =
    REMOTE_ACTION_ID_TO_PROXY_ACTION_ID[
      actionId as keyof typeof REMOTE_ACTION_ID_TO_PROXY_ACTION_ID
    ];
  if (!proxyActionId) {
    await next();
    return;
  }

  const localUrl = new URL(c.req.url).toString();
  const headers = new Headers(request.headers);
  headers.set(PROXY_REQUEST_HEADER, '1');
  headers.set('x-rsc-action', proxyActionId);
  headers.delete('host');
  const body = await request.arrayBuffer();
  const upstream = await fetch(localUrl, {
    method: 'POST',
    headers,
    body,
  }).catch(() => undefined);

  if (!upstream) {
    await next();
    return;
  }

  c.res = new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: upstream.headers,
  });
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

  const remoteUrl = `http://127.0.0.1:${remotePort}${pathname}${reqUrl.search}`;
  const upstream = await fetch(remoteUrl).catch(() => undefined);

  if (!upstream || !upstream.ok) {
    await next();
    return;
  }

  const shouldPatchNestedMixed =
    pathname.startsWith(
      '/static/js/async/__federation_expose_RemoteNestedMixed',
    ) && pathname.endsWith('.js');
  if (shouldPatchNestedMixed) {
    let chunkText = await upstream.text();
    chunkText = `${chunkText}${createRemoteNestedMixedAliasChunk()}`;

    c.res = new Response(chunkText, {
      status: upstream.status,
      headers: {
        'content-type': 'application/javascript; charset=utf-8',
      },
    });
    return;
  }

  c.res = new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: upstream.headers,
  });
};

export default defineServerConfig({
  middlewares: [
    {
      name: 'proxy-remote-rsc-action',
      handler: proxyRemoteRscAction,
    },
    {
      name: 'proxy-remote-federation-asset',
      handler: proxyRemoteFederationAsset,
    },
  ],
});
