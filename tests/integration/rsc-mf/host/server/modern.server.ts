import fs from 'node:fs/promises';
import path from 'node:path';
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
const createRemoteNestedMixedAliasChunk = () =>
  `\n;(globalThis["chunk_rscHost"] = globalThis["chunk_rscHost"] || []).push([["__federation_expose_RemoteNestedMixed_alias"],{"${REMOTE_COUNTER_ALIAS_MODULE}":function(module,__unused,__webpack_require__){module.exports=__webpack_require__("${REMOTE_COUNTER_SOURCE_MODULE}");}}]);`;

const REMOTE_ACTION_ID_TO_PROXY_EXPORT = {
  '606c30f35d74d843171a8a71358eda595991e4ee16270e9f052af3faef57a19999':
    'proxyIncrementRemoteCount',
  '40e41a2ee9d9de373b364dcf2a0201701057c8502037bf9ef2cd26bb2a1259dabd':
    'proxyRemoteActionEcho',
  '408da81ddb8214f8cb98a83552cb70c4d17b27b6fd36d972cac89e7030a4874fd4':
    'proxyNestedRemoteAction',
  '40fd3fd0c01e4d21630b7f6f902c1ddc49d3b05418ca1da003c4fdc6c6272e0bf2':
    'proxyDefaultRemoteAction',
} as const;
const ACTION_EXPOSE_PATHS = new Set([
  '/static/js/async/__federation_expose_actions.js',
  '/static/js/async/__federation_expose_nestedActions.js',
  '/static/js/async/__federation_expose_defaultAction.js',
]);

let cachedProxyActionIds:
  | Partial<
      Record<
        (typeof REMOTE_ACTION_ID_TO_PROXY_EXPORT)[keyof typeof REMOTE_ACTION_ID_TO_PROXY_EXPORT],
        string
      >
    >
  | undefined;

const getProxyActionIds = async () => {
  if (cachedProxyActionIds) {
    return cachedProxyActionIds;
  }

  const serverBundlePath = path.resolve(
    __dirname,
    '../dist/bundles/server-component-root.js',
  );
  const serverBundleCode = await fs.readFile(serverBundlePath, 'utf-8');

  const actionIdMap: Partial<
    Record<
      (typeof REMOTE_ACTION_ID_TO_PROXY_EXPORT)[keyof typeof REMOTE_ACTION_ID_TO_PROXY_EXPORT],
      string
    >
  > = {};
  Object.values(REMOTE_ACTION_ID_TO_PROXY_EXPORT).forEach(exportName => {
    const pattern = new RegExp(
      `registerServerReference\\\\(${exportName},\\\\s*"([^"]+)"`,
    );
    const match = serverBundleCode.match(pattern);
    if (match?.[1]) {
      actionIdMap[exportName] = match[1];
    }
  });
  cachedProxyActionIds = actionIdMap;

  return actionIdMap;
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

  const shouldPatchActionChunk = ACTION_EXPOSE_PATHS.has(pathname);
  const shouldPatchNestedMixed =
    pathname === '/static/js/async/__federation_expose_RemoteNestedMixed.js';
  if (shouldPatchActionChunk || shouldPatchNestedMixed) {
    let chunkText = await upstream.text();

    if (shouldPatchActionChunk) {
      const proxyActionIds = await getProxyActionIds().catch(() => ({}));
      Object.entries(REMOTE_ACTION_ID_TO_PROXY_EXPORT).forEach(
        ([remoteActionId, proxyExport]) => {
          const proxyActionId = proxyActionIds[proxyExport];
          if (!proxyActionId) {
            return;
          }
          chunkText = chunkText.split(remoteActionId).join(proxyActionId);
        },
      );
    }

    if (shouldPatchNestedMixed) {
      chunkText = `${chunkText}${createRemoteNestedMixedAliasChunk()}`;
    }

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
    },
  ],
});
