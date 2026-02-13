import {
  type MiddlewareHandler,
  defineServerConfig,
} from '@modern-js/server-runtime';
import {
  decodeReply,
  renderToReadableStream,
} from 'react-server-dom-rspack/server.node';

const REMOTE_ACTION_IDS = {
  incrementRemoteCount:
    '606c30f35d74d843171a8a71358eda595991e4ee16270e9f052af3faef57a19999',
  remoteActionEcho:
    '40e41a2ee9d9de373b364dcf2a0201701057c8502037bf9ef2cd26bb2a1259dabd',
  nestedRemoteAction:
    '408da81ddb8214f8cb98a83552cb70c4d17b27b6fd36d972cac89e7030a4874fd4',
  defaultRemoteAction:
    '40fd3fd0c01e4d21630b7f6f902c1ddc49d3b05418ca1da003c4fdc6c6272e0bf2',
} as const;

const remoteActionLoaders: Record<
  string,
  () => Promise<(...args: any[]) => any>
> = {
  [REMOTE_ACTION_IDS.incrementRemoteCount]: async () => {
    const remote = await import('rscRemote/actions');
    return remote.incrementRemoteCount;
  },
  [REMOTE_ACTION_IDS.remoteActionEcho]: async () => {
    const remote = await import('rscRemote/actions');
    return remote.remoteActionEcho;
  },
  [REMOTE_ACTION_IDS.nestedRemoteAction]: async () => {
    const remote = await import('rscRemote/nestedActions');
    return remote.nestedRemoteAction;
  },
  [REMOTE_ACTION_IDS.defaultRemoteAction]: async () => {
    const remote = await import('rscRemote/defaultAction');
    return remote.default;
  },
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

const REMOTE_COUNTER_ALIAS_MODULE =
  'remote-module:rscRemote:./src/components/RemoteClientCounter.tsx';
const REMOTE_COUNTER_SOURCE_MODULE = './src/components/RemoteClientCounter.tsx';
const createRemoteNestedMixedAliasChunk = () =>
  `\n;(globalThis["chunk_rscHost"] = globalThis["chunk_rscHost"] || []).push([["__federation_expose_RemoteNestedMixed_alias"],{"${REMOTE_COUNTER_ALIAS_MODULE}":function(module,__unused,__webpack_require__){module.exports=__webpack_require__("${REMOTE_COUNTER_SOURCE_MODULE}");}}]);`;

const handleRemoteRscAction: MiddlewareHandler = async (c, next) => {
  const request = c.req.raw;
  const actionId = request.headers.get('x-rsc-action');
  if (!actionId || request.method !== 'POST') {
    await next();
    return;
  }

  const loadRemoteAction = remoteActionLoaders[actionId];
  if (!loadRemoteAction) {
    await next();
    return;
  }

  const remoteAction = await loadRemoteAction().catch(() => undefined);
  if (!remoteAction) {
    await next();
    return;
  }

  const contentType = request.headers.get('content-type');
  const args = contentType?.includes('multipart/form-data')
    ? await decodeReply(await request.formData())
    : await decodeReply(await request.text());
  const result = await Promise.resolve(remoteAction.apply(null, args));
  c.res = new Response(renderToReadableStream(result), {
    status: 200,
    headers: {
      'content-type': 'text/html',
    },
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

  if (
    pathname === '/static/js/async/__federation_expose_RemoteNestedMixed.js'
  ) {
    const chunkText = await upstream.text();
    c.res = new Response(`${chunkText}${createRemoteNestedMixedAliasChunk()}`, {
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
      name: 'handle-remote-rsc-action',
      handler: handleRemoteRscAction,
    },
    {
      name: 'proxy-remote-federation-asset',
      handler: proxyRemoteFederationAsset,
    },
  ],
});
