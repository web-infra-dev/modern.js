import { Server } from 'http';
import path from 'path';
import { createDebugger, signale as logger } from '@modern-js/utils';
import ws from 'ws';
import { ESMServer } from './server';
import {
  fileToModules,
  idToModules,
  AssetModule,
  invalidateAssetModule,
} from './AssetModule';
import { logWithHistory } from './utils';

const debug = createDebugger('esm:hmr');

const historyLogger = logWithHistory();

interface SocketClient extends ws {
  isAlive?: boolean;
}

export type HMRError = {
  title?: 'string';
  message?: string;
  stack?: string;
  frame?: string;
  loc?: {
    line: number;
    column: number;
    file: string;
  };
};

type HMRMessage =
  | { type: 'connected' }
  | { type: 'reload' }
  | { type: 'update'; changes: Array<Boundary>; hmrTimestamp: number }
  | { type: 'prune'; changes: Array<string> }
  | ({
      type: 'error';
    } & HMRError);

// cache error before connection established

export class WebSocketServer {
  wsHeartbeatInterval: number;

  wsServer: ws.Server;

  bufferedError: null | HMRMessage;

  constructor(server: Server, path: string) {
    this.wsHeartbeatInterval = 30000;
    this.wsServer = new ws.Server({
      noServer: true,
      path,
    });

    server.on('upgrade', (req, socket: any, head) => {
      if (
        !this.wsServer.shouldHandle(req) &&
        // Only handle upgrades modern-js-esm-hmr requests, ignore others.
        req.headers['sec-websocket-protocol'] !== 'modern-js-esm-hmr'
      ) {
        return;
      }

      this.wsServer.handleUpgrade(req, socket, head, connection => {
        this.wsServer.emit('connection', connection, req);
      });
    });

    const noop = () => {
      /** empty */
    };

    const interval = setInterval(() => {
      this.wsServer.clients.forEach((client: SocketClient) => {
        if (!client.isAlive) {
          return client.terminate();
        }

        client.isAlive = false;
        client.ping(noop);
      });
    }, this.wsHeartbeatInterval).unref();

    this.wsServer.on('connection', (client: SocketClient) => {
      client.isAlive = true;
      client.on('pong', () => {
        client.isAlive = true;
      });
      client.send(JSON.stringify({ type: 'connected' }));
      if (this.bufferedError) {
        client.send(JSON.stringify(this.bufferedError));
        this.bufferedError = null;
      }
    });

    this.wsServer.on('close', () => {
      clearInterval(interval);
    });

    this.bufferedError = null;
  }

  get clients() {
    return this.wsServer.clients;
  }

  send(data: HMRMessage) {
    if (data.type === 'error' && !this.wsServer.clients.size) {
      this.bufferedError = data;
    }

    this.wsServer.clients.forEach(client => {
      if (client.readyState !== ws.OPEN) {
        return;
      }
      client.send(JSON.stringify(data));
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.wsServer.close(err => {
        if (err) {
          reject(err);
        } else {
          resolve(null);
        }
      });
    });
  }
}

type Boundary = {
  id: string;
  accepted: string;
};

let depChains: Array<AssetModule>[] = [];

const findUpdateBoundary = (
  assetModule: AssetModule,
  boundaries: Array<Boundary>,
  timestamp: number,
  currentDepsChain: Array<AssetModule>,
) => {
  const { id: moduleId } = assetModule;

  const { dependents } = assetModule;

  // Circular reference should return ?
  if (currentDepsChain.find(dep => dep.filePath === assetModule.filePath)) {
    debug(
      `Circular reference`,
      [...currentDepsChain, assetModule].map(m => m.filePath),
    );
    return;
  }

  currentDepsChain.push(assetModule);

  if (assetModule.selfAccepted) {
    boundaries.push({
      id: assetModule.id,
      accepted: assetModule.id,
    });
    depChains.push([...currentDepsChain]);
    return;
  }

  debug(`find boundary -> `, assetModule);

  if (dependents.size) {
    for (const dependent of dependents) {
      const dependentModule = idToModules.get(dependent);
      if (dependentModule) {
        if (dependentModule.acceptIds.has(moduleId)) {
          depChains.push([...currentDepsChain, dependentModule]);
          boundaries.push({ id: dependentModule.id, accepted: moduleId });
        } else {
          findUpdateBoundary(dependentModule, boundaries, timestamp, [
            ...currentDepsChain,
          ]);
        }
      } else {
        debug(
          `cant find ${assetModule.id}'s dependent(${dependent}) in modulesMap`,
        );
      }
    }
  }
};

export const onFileChange = (server: ESMServer, filename: string) => {
  const { appDirectory, wsServer } = server;

  // have no connection yet
  if (!wsServer.clients.size) {
    debug(`no ws connection hmr flush return`);
    return;
  }

  const fullPath = path.resolve(appDirectory, filename);

  // config/html change, should reload page
  if (/\.(html?|ejs|hbs)$/.test(filename)) {
    wsServer.send({ type: 'reload' });
    logger.info(`Page reloading...`);
  }

  debug(`file change: ${filename}`);

  const assetModule = fileToModules.get(fullPath);

  if (!assetModule) {
    debug(`ignore unused file change: ${fullPath}`);
    return;
  }

  historyLogger(`file ${path.relative(appDirectory, fullPath)} change...`);

  const timestamp = Date.now();

  const boundaries: Array<{ id: string; accepted: string }> = [];

  findUpdateBoundary(assetModule, boundaries, timestamp, []);

  for (const depChain of depChains) {
    depChain.forEach(dep => invalidateAssetModule(dep, timestamp));
  }

  debug(`update boundary: `, boundaries);

  if (boundaries.length) {
    wsServer.send({
      type: 'update',
      changes: boundaries,
      hmrTimestamp: timestamp,
    });
  } else {
    wsServer.send({ type: 'reload' });
    invalidateAssetModule(assetModule, timestamp);
    logger.info(`Page reloading...`);
  }

  depChains = [];
};

export const onPruneModules = (ids: string[], wsServer: WebSocketServer) => {
  for (const id of ids) {
    const assetModule = idToModules.get(id);
    assetModule!.hmrTimestamp = Date.now();
  }

  wsServer.send({
    type: 'prune',
    changes: ids,
  });
};
