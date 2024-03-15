import {
  MessagePortChannel,
  ServerFunctions,
  Tab,
  ClientFunctions as ToServerFunctions,
  WebSocketChannel,
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

export const $server = $serverChannel.then(async channel => {
  const hooks = createHooks<ToServerFunctions>();
  const definitions: ToServerFunctions = {
    async refresh() {
      location.reload();
    },
    async updateFileSystemRoutes(e) {
      await hooks.callHook('updateFileSystemRoutes', e);
    },
  };
  const remote = createBirpc<ServerFunctions, ToServerFunctions>(
    definitions,
    channel,
  );
  return { remote, hooks };
});

export const $framework = proxy({
  context: $server.then(({ remote }) => remote.getAppContext()),
  config: {
    resolved: $server.then(({ remote }) => remote.getFrameworkConfig()),
    transformed: $server.then(({ remote }) =>
      remote.getTransformedFrameworkConfig(),
    ),
  },
});

export const $builder = proxy({
  context: $server.then(({ remote }) => remote.getBuilderContext()),
  config: {
    resolved: $server.then(({ remote }) => remote.getBuilderConfig()),
    transformed: $server.then(({ remote }) =>
      remote.getTransformedBuilderConfig(),
    ),
  },
});

export const $bundler = proxy({
  config: {
    resolved: $server.then(({ remote }) => remote.getBundlerConfigs()),
    transformed: $server.then(({ remote }) =>
      remote.getTransformedBundlerConfigs(),
    ),
  },
});

export const $tabs = proxy<Tab[]>([]);

export const VERSION = process.env.PKG_VERSION;

const _definitionTask = $server.then(({ remote }) =>
  remote.getClientDefinition(),
);

export const $definition = proxy({
  name: _definitionTask.then(def => def.name),
  packages: _definitionTask.then(def => def.packages),
  assets: _definitionTask.then(def => def.assets),
  announcement: _definitionTask.then(def => def.announcement),
  doctor: _definitionTask.then(def => def.doctor),
  plugins: _definitionTask.then(def => def.plugins),
});

export const _dependenciesTask = $server.then(({ remote }) =>
  remote.getDependencies(),
);

export const $dependencies = proxy<Record<string, string>>({});

_dependenciesTask.then(def => Object.assign($dependencies, def));

export const $perf = proxy({
  compileDuration: $server.then(({ remote }) => remote.getCompileTimeCost()),
});
