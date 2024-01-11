import { MessagePortChannel } from '@modern-js/devtools-kit';
import { createBirpc } from 'birpc';
import { createDebugger, createHooks } from 'hookable';
import { activate, createBridge } from 'react-devtools-inline/backend';
import {
  ClientFunctions,
  MountPointFunctions as ToClientFunctions,
} from '@/types/rpc';
import { WallAgent } from '@/utils/react-devtools';

export const $clientChannel = MessagePortChannel.wait('channel:connect:client');

export const wallAgent = new WallAgent();
createDebugger(wallAgent, { tag: 'mount' });

export const bridge = createBridge(window, wallAgent);

export const $client = $clientChannel.then(channel => {
  const hooks = createHooks<ToClientFunctions>();
  const definitions: ToClientFunctions = {
    async activateReactDevtools() {
      activate(window, { bridge });
    },
    async sendReactDevtoolsData(e) {
      await hooks.callHook('sendReactDevtoolsData', e);
    },
  };
  const remote = createBirpc<ClientFunctions, ToClientFunctions>(definitions, {
    ...channel.handlers,
    timeout: 500,
  });
  return { remote, hooks };
});

$client.then(({ hooks, remote }) => {
  hooks.hook('sendReactDevtoolsData', async e => {
    await wallAgent.callHook('receive', e);
  });
  wallAgent.hook('send', async e => {
    await remote.sendReactDevtoolsData(e);
  });
});
