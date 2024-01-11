import {
  MessagePortChannel,
  ServerFunctions,
  ClientFunctions as ToServerFunctions,
  WebSocketChannel,
} from '@modern-js/devtools-kit';
import { createBirpc } from 'birpc';
import { createHooks } from 'hookable';
import {
  HiOutlineAcademicCap,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineCube,
  HiOutlineHome,
  HiOutlineRectangleGroup,
} from 'react-icons/hi2';
import { RiReactjsLine } from 'react-icons/ri';
import { stringifyParsedURL } from 'ufo';
import { proxy, ref } from 'valtio';
import { InternalTab } from '../types';
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
    async sendReactDevtoolsData(e) {
      await hooks.callHook('sendReactDevtoolsData', e);
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

export const $tabs = proxy<InternalTab[]>([
  {
    name: 'overview',
    title: 'Overview',
    icon: ref(<HiOutlineHome />),
    view: { type: 'builtin', url: '/overview' },
  },
  {
    name: 'config',
    title: 'Config',
    icon: ref(<HiOutlineAdjustmentsHorizontal />),
    view: { type: 'builtin', url: '/config' },
  },
  {
    name: 'pages',
    title: 'Pages',
    icon: ref(<HiOutlineRectangleGroup />),
    view: { type: 'builtin', url: '/pages' },
  },
  {
    name: 'react',
    title: 'React',
    icon: ref(<RiReactjsLine />),
    view: { type: 'builtin', url: '/react' },
  },
  {
    name: 'context',
    title: 'Context',
    icon: ref(<HiOutlineCube />),
    view: { type: 'builtin', url: '/context' },
  },
  {
    name: 'headers',
    title: 'Header Modifier',
    icon: ref(<HiOutlineAcademicCap />),
    view: { type: 'builtin', url: '/headers' },
  },
]);

export const VERSION = process.env.PKG_VERSION;

const _definitionTask = $server.then(({ remote }) =>
  remote.getClientDefinition(),
);

export const $definition = proxy({
  name: _definitionTask.then(def => def.name),
  packages: _definitionTask.then(def => def.packages),
  assets: _definitionTask.then(def => def.assets),
  announcement: _definitionTask.then(def => def.announcement),
});

export const $dependencies = proxy<Record<string, string>>({});

export const $perf = proxy({
  compileDuration: $server.then(({ remote }) => remote.getCompileTimeCost()),
});
