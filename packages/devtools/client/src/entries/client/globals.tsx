import {
  ServerManifest,
  MessagePortChannel,
  ServerFunctions,
  Tab,
  ClientFunctions as ToServerFunctions,
  WebSocketChannel,
  applyOperation,
  reviver,
} from '@modern-js/devtools-kit/runtime';
import { createBirpc } from 'birpc';
import { createHooks } from 'hookable';
import _ from 'lodash';
import {
  HiMiniCircleStack,
  HiOutlineAcademicCap,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineCube,
  HiOutlineHome,
  HiOutlineRectangleGroup,
} from 'react-icons/hi2';
import { RiReactjsLine, RiShieldCrossLine } from 'react-icons/ri';
import { parseQuery, resolveURL } from 'ufo';
import { proxy, ref } from 'valtio';
import type {
  MountPointFunctions,
  ClientFunctions as ToMountPointFunctions,
} from '@/types/rpc';
import { use } from '@/utils';
import { PluginGlobals, setupPlugins } from '@/utils/pluggable';

const initializeMountPoint = async () => {
  const channel = await MessagePortChannel.link(
    window.parent,
    'channel:connect:client',
  );
  const hooks = createHooks<ToMountPointFunctions>();
  const definitions: ToMountPointFunctions = {
    async pullUp(target) {
      await hooks.callHook('pullUp', target);
    },
  };
  const remote = createBirpc<MountPointFunctions, ToMountPointFunctions>(
    definitions,
    { ...channel.handlers, timeout: 8_000 },
  );
  return { remote, hooks };
};

const initializeManifest = async (url: string) => {
  const res = await fetch(url);
  const json: ServerManifest = JSON.parse(await res.text(), reviver());
  return json;
};

const initializeServer = async (url: string, state: ServerManifest) => {
  const _url = new URL(url, location.href);
  const socket = new window.WebSocket(_url);
  const channel = await WebSocketChannel.link(socket);
  const hooks = createHooks<ToServerFunctions>();
  const definitions: ToServerFunctions = {
    async refresh() {
      location.reload();
    },
    async applyStateOperations(ops) {
      for (const op of ops) {
        applyOperation(state, op);
      }
    },
  };
  const remote = createBirpc<ServerFunctions, ToServerFunctions>(definitions, {
    ...channel.handlers,
    timeout: 5000,
  });
  const server = { remote, hooks, url: _url };
  return server;
};

const initializeTabs = async () => {
  const globals = PluginGlobals.use();
  const tabs: Tab[] = proxy([
    {
      name: 'overview',
      title: 'Overview',
      icon: <HiOutlineHome />,
      view: { type: 'builtin', src: '/overview' },
    },
    {
      name: 'config',
      title: 'Config',
      icon: <HiOutlineAdjustmentsHorizontal />,
      view: { type: 'builtin', src: '/config' },
    },
    {
      name: 'pages',
      title: 'Pages',
      icon: <HiOutlineRectangleGroup />,
      view: { type: 'builtin', src: '/pages' },
    },
    {
      name: 'react',
      title: 'React',
      icon: <RiReactjsLine />,
      view: { type: 'builtin', src: '/react' },
    },
    {
      name: 'context',
      title: 'Context',
      icon: <HiOutlineCube />,
      view: { type: 'builtin', src: '/context' },
    },
    {
      name: 'headers',
      title: 'Header Modifier',
      icon: <HiOutlineAcademicCap />,
      view: { type: 'builtin', src: '/headers' },
    },
    {
      name: 'doctor',
      title: 'Doctor',
      icon: <RiShieldCrossLine />,
      view: { type: 'builtin', src: '/doctor' },
    },
    {
      name: 'storage',
      title: 'Storage',
      icon: <HiMiniCircleStack />,
      view: { type: 'builtin', src: '/storage/preset' },
    },
  ]);
  await globals.callHook('tab:list', tabs);
  for (const tab of tabs) {
    if (typeof tab.icon === 'object') {
      tab.icon = ref(tab.icon);
    }
    if (tab.view.type === 'external') {
      tab.view.component = ref(tab.view.component);
    }
  }
  return tabs;
};

const initializeState = async (url: string) => {
  const query = parseQuery(url);
  const manifestUrl = _.castArray(query.src)[0] ?? resolveURL(url, 'manifest');

  const $mountPoint = initializeMountPoint();
  const $manifest = initializeManifest(manifestUrl);
  const $server = $manifest.then(manifest =>
    manifest.websocket
      ? initializeServer(manifest.websocket, proxy(manifest))
      : null,
  );
  const $setupPlugins = $manifest.then(exported => {
    const runtimePlugins = exported.context.def.plugins;
    return setupPlugins(runtimePlugins);
  });
  const $tabs = $setupPlugins.then(initializeTabs);

  const [mountPoint, exported, server, tabs] = await Promise.all([
    $mountPoint,
    $manifest,
    $server,
    $tabs,
  ]);

  return proxy({
    ...exported,
    version: process.env.PKG_VERSION,
    tabs,
    server: server ? ref(server) : null,
    mountPoint: ref(mountPoint),
  });
};

export const $$globals = initializeState(location.href);

export const useGlobals = () => use($$globals);

export type GlobalState = Awaited<typeof $$globals>;
