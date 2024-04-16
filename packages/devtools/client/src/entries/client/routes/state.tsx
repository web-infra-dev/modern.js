import {
  MessagePortChannel,
  PromiseStub,
  ServerFunctions,
  Tab,
  ClientFunctions as ToServerFunctions,
  WebSocketChannel,
  applyOperation,
  createServerExportedState,
} from '@modern-js/devtools-kit/runtime';
import { createBirpc } from 'birpc';
import { createHooks } from 'hookable';
import { stringifyParsedURL } from 'ufo';
import { proxy } from 'valtio';
import {
  MountPointFunctions,
  ClientFunctions as ToMountPointFunctions,
} from '@/types/rpc';

export const DATA_SOURCE = stringifyParsedURL({
  protocol: location.protocol === 'https:' ? 'wss:' : 'ws:',
  host: location.host,
  pathname: '/__devtools/rpc',
});

export const $mountPointChannel = MessagePortChannel.link(
  window.parent,
  'channel:connect:client',
);

export const $mountPoint = $mountPointChannel.then(async channel => {
  const hooks = createHooks<ToMountPointFunctions>();
  const definitions: ToMountPointFunctions = {
    async pullUp(target) {
      await hooks.callHook('pullUp', target);
    },
  };
  const remote = createBirpc<MountPointFunctions, ToMountPointFunctions>(
    definitions,
    { ...channel.handlers, timeout: 500 },
  );
  return { remote, hooks };
});

export const $socket = new window.WebSocket(DATA_SOURCE);

export const $serverChannel = WebSocketChannel.link($socket);

export const $serverExported = proxy(createServerExportedState().state);

export const $server = $serverChannel.then(async channel => {
  const hooks = createHooks<ToServerFunctions>();
  const definitions: ToServerFunctions = {
    async refresh() {
      location.reload();
    },
    async applyStateOperations(ops) {
      for (const op of ops) {
        applyOperation($serverExported, op);
      }
    },
  };
  const remote = createBirpc<ServerFunctions, ToServerFunctions>(definitions, {
    ...channel.handlers,
    timeout: 5000,
  });

  remote.pullExportedState().then(state => {
    for (const [key, newVal] of Object.entries(state)) {
      type Key = keyof typeof $serverExported;
      const val = $serverExported[key as Key];
      if (val instanceof Promise && newVal instanceof Promise) {
        continue;
      }
      if (val instanceof Promise) {
        PromiseStub.get<any>(val).resolve(newVal);
      }
      $serverExported[key as Key] = newVal;
    }
  });

  return { remote, hooks };
});

export const $tabs = proxy<Tab[]>([]);

export const VERSION = process.env.PKG_VERSION;
