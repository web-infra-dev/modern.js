import { Buffer } from 'buffer';
import path from 'path';
import {
  DevtoolsContext,
  replacer,
  reviver,
  ServerManifest,
  StoragePresetWithIdent,
  type ClientFunctions,
  type ServerFunctions,
} from '@modern-js/devtools-kit/node';
import { fs, nanoid } from '@modern-js/utils';
import _ from '@modern-js/utils/lodash';
import { BirpcOptions, createBirpc } from 'birpc';
import * as flatted from 'flatted';
import { subscribe } from 'valtio';
import { RawData } from 'ws';
import { CliPluginAPI, DevtoolsConfig, Plugin } from '../types';
import { SocketServer } from '../utils/socket';

export interface SetupClientConnectionOptions {
  api: CliPluginAPI;
  server: SocketServer;
  ctx: DevtoolsContext;
}

export const pluginRpc: Plugin = {
  async setup(api) {
    const httpServer = api.vars.http;
    if (!httpServer) return;

    const server = new SocketServer({ server: httpServer, path: '/rpc' });
    let handleMessage: null | ((data: RawData, isBinary: boolean) => void) =
      null;
    const onceConnection = new Promise<void>(resolve => {
      server.on('connection', ws => {
        resolve();
        ws.on('message', (data, isBinary) => handleMessage?.(data, isBinary));
      });
    });

    const frameworkApi = await api.setupFramework();
    const validateSafeToOpen = (filename: string) => {
      const { appDirectory } = frameworkApi.useAppContext();
      const resolved = path.resolve(appDirectory, filename);
      for (const preset of api.context.storagePresets) {
        if (path.resolve(appDirectory, preset.filename) === resolved) {
          return true;
        }
      }
      return false;
    };

    // setup rpc instance (server <-> client).
    const serverFunctions: ServerFunctions = {
      echo(content) {
        return content;
      },
      async pullExportedState() {
        try {
          return api.vars.state as ServerManifest;
        } catch (e) {
          console.error(e);
          throw e;
        }
      },
      async createTemporaryStoragePreset() {
        const appCtx = frameworkApi.useAppContext();
        const basename = `${api.context.def.name.shortName}.runtime.json`;
        const filename = path.resolve(appCtx.appDirectory, basename);
        const id = nanoid();
        const name = `New Preset ${id.slice(0, 6)}`;
        const config: DevtoolsConfig = {};
        if (await fs.pathExists(filename)) {
          Object.assign(config, await fs.readJSON(filename));
        }
        const newPreset: StoragePresetWithIdent = {
          name,
          id,
          cookie: {},
          localStorage: {},
          sessionStorage: {},
        };
        config.storagePresets ||= [];
        config.storagePresets.push(newPreset);
        await fs.outputJSON(filename, config, { spaces: 2 });
        return newPreset;
      },
      async pasteStoragePreset(target) {
        const { default: clipboardy } = await import('clipboardy');
        const raw = clipboardy.readSync();
        const HEAD = `data:application/json;base64,`;
        if (!raw.startsWith(HEAD)) {
          throw new Error('Failed to parse data URL');
        }
        const encoded = raw.slice(HEAD.length);
        const preset: StoragePresetWithIdent = JSON.parse(
          Buffer.from(encoded, 'base64').toString('utf-8'),
        );
        if (typeof preset !== 'object' || preset === null) {
          throw new Error('Failed to parse data URL');
        }
        if (typeof preset.name !== 'string') {
          throw new Error('Failed to parse data URL');
        }
        const appCtx = frameworkApi.useAppContext();
        const filename = path.resolve(appCtx.appDirectory, target.filename);
        const config: DevtoolsConfig = {};
        if (await fs.pathExists(filename)) {
          Object.assign(config, await fs.readJSON(filename));
        }
        config.storagePresets ||= [];
        const diff = _.pick(preset, [
          'cookie',
          'localStorage',
          'sessionStorage',
        ]);
        const matched = _.find(config.storagePresets, { id: target.id });
        if (matched) {
          _.merge(matched, diff);
        } else {
          config.storagePresets.push(preset);
        }
        await fs.outputJSON(filename, config, { spaces: 2 });
      },
      async open(filename) {
        const name = path.resolve(
          frameworkApi.useAppContext().appDirectory,
          filename,
        );
        const validated = validateSafeToOpen(name);
        if (!validated) {
          throw new Error('Failed to validate the file.');
        }
        const { default: open } = await import('open');
        await open(name);
      },
    };
    const clientRpcOptions: BirpcOptions<ClientFunctions> = {
      post: data =>
        onceConnection.then(() => server.clients.forEach(ws => ws.send(data))),
      on: cb => (handleMessage = cb),
      serialize: v => flatted.stringify([v], replacer()),
      deserialize: v => {
        const msg = flatted.parse(v.toString(), reviver())[0];
        return msg;
      },
      onError(error, functionName, args) {
        const stringifiedArgs = args.map(arg => JSON.stringify(arg)).join(', ');
        console.error(
          new Error(
            `DevTools failed to execute RPC function: ${functionName}(${stringifiedArgs})`,
          ),
        );
        console.error(error);
      },
    };

    const clientConn = createBirpc<ClientFunctions, ServerFunctions>(
      serverFunctions,
      clientRpcOptions,
    );

    // sync state operations to remote.
    subscribe(api.vars.state, ops => {
      clientConn.applyStateOperations.asEvent(ops);
    });
  },
};
