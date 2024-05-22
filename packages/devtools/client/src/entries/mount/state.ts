import { MessagePortChannel } from '@modern-js/devtools-kit/runtime';
import { createBirpc } from 'birpc';
import { createHooks } from 'hookable';
import createDeferred from 'p-defer';
import { proxy } from 'valtio';
import { activate, createBridge } from 'react-devtools-inline/backend';
import _ from 'lodash';
import {
  ClientFunctions,
  MountPointFunctions as ToClientFunctions,
} from '@/types/rpc';
import { WallAgent } from '@/utils/react-devtools';

export const $clientChannel = MessagePortChannel.wait(
  window,
  'channel:connect:client',
);

export const wallAgent = new WallAgent();

export const bridge = createBridge(window, wallAgent);

export const $client = $clientChannel.then(channel => {
  const hooks = createHooks<ToClientFunctions>();
  const definitions: ToClientFunctions = {
    async activateReactDevtools() {
      activate(window, { bridge });
    },
    async onFinishRender() {
      await hooks.callHook('onFinishRender');
    },
    async cookies(items) {
      const cookiesReq = await fetch('/__devtools/api/cookies', {
        method: 'POST',
        body: JSON.stringify({ setCookies: items }),
      });
      const { cookies } = await cookiesReq.json();
      if (!cookies || typeof cookies !== 'object') {
        throw new TypeError('No cookies returned from server');
      }

      const { parse } = await import('cookie-es');
      const clientOnly = parse(document.cookie);
      const serverOnly: Record<string, string> = _.omit(
        cookies,
        Object.keys(clientOnly),
      );
      return { client: clientOnly, server: serverOnly };
    },
    async localStorage(items) {
      _.each(items, (v, k) => {
        window.localStorage.setItem(k, v);
      });
      return { ...window.localStorage };
    },
    async sessionStorage(items) {
      _.each(items, (v, k) => {
        window.sessionStorage.setItem(k, v);
      });
      return { ...window.sessionStorage };
    },
  };
  const remote = createBirpc<ClientFunctions, ToClientFunctions>(definitions, {
    ...channel.handlers,
    timeout: 500,
  });
  return { remote, hooks };
});

export const $inner = proxy({
  loaded: false,
});

export const innerLoaded = createDeferred<void>();

$client.then(({ remote, hooks }) => {
  wallAgent.bindRemote(remote, 'sendReactDevtoolsData');
  hooks.hook('onFinishRender', async () => {
    $inner.loaded = true;
    innerLoaded.resolve();
  });
});
