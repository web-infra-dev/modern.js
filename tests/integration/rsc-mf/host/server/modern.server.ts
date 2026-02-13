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

const REMOTE_COUNTER_ALIAS_MODULES = [
  'remote-module:rscRemote:./src/components/RemoteClientCounter.tsx',
  'remote-module:rscRemote:./RemoteClientCounter',
  'remote-module:rscRemote:./RemoteClientCounter.tsx',
];
const REMOTE_COUNTER_SOURCE_MODULE = './src/components/RemoteClientCounter.tsx';
const createRemoteNestedMixedAliasChunk = () =>
  `\n;(globalThis["chunk_rscHost"] = globalThis["chunk_rscHost"] || []).push([["__federation_expose_RemoteNestedMixed_alias"],{${REMOTE_COUNTER_ALIAS_MODULES.map(
    aliasModule =>
      `"${aliasModule}":function(module,__unused,__webpack_require__){module.exports=__webpack_require__("${REMOTE_COUNTER_SOURCE_MODULE}");}`,
  ).join(',')}}]);`;

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

  const shouldPatchCounterAlias =
    pathname.startsWith('/static/js/async/__federation_expose_') &&
    pathname.endsWith('.js');
  if (shouldPatchCounterAlias) {
    let chunkText = await upstream.text();
    if (!chunkText.includes('remote-client-server-count')) {
      c.res = new Response(chunkText, {
        status: upstream.status,
        headers: {
          'content-type': 'application/javascript; charset=utf-8',
        },
      });
      return;
    }

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
      name: 'proxy-remote-federation-asset',
      handler: proxyRemoteFederationAsset,
      order: 'pre',
      before: ['server-static'],
    },
  ],
});
