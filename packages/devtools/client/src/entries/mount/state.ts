import { MessagePortChannel } from '@modern-js/devtools-kit';
import { createBirpc } from 'birpc';
import { createHooks } from 'hookable';
import { activate, createBridge } from 'react-devtools-inline/backend';
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
  };
  const remote = createBirpc<ClientFunctions, ToClientFunctions>(definitions, {
    ...channel.handlers,
    timeout: 500,
  });
  return { remote, hooks };
});

$client.then(({ remote }) => {
  wallAgent.bindRemote(remote, 'sendReactDevtoolsData');
});
