import { Server } from 'http';
import { EventEmitter } from 'events';
import {
  DevServerOptions,
  DevMiddlewareAPI,
  DevMiddleware as CustomDevMiddleware,
} from '../../types';
import SocketServer from './socket-server';

type Options = {
  dev: DevServerOptions;
  devMiddleware?: CustomDevMiddleware;
};

const noop = () => {
  // noop
};

function getHMRClientPath(client: DevServerOptions['client']) {
  const host = client?.host ? `&host=${client.host}` : '';
  const path = client?.path ? `&path=${client.path}` : '';
  const port = client?.port ? `&port=${client.port}` : '';

  const clientEntry = `${require.resolve(
    './hmr-client',
  )}?${host}${path}${port}`;

  return clientEntry;
}

export default class DevMiddleware extends EventEmitter {
  public middleware?: DevMiddlewareAPI;

  private devOptions: DevServerOptions;

  private socketServer: SocketServer;

  constructor({ dev, devMiddleware }: Options) {
    super();

    this.devOptions = dev;

    // init socket server
    this.socketServer = new SocketServer(dev);

    if (devMiddleware) {
      // start dev middleware
      this.middleware = this.setupDevMiddleware(devMiddleware);
    }
  }

  public init(app: Server) {
    app.on('listening', () => {
      this.socketServer.prepare(app);
    });

    app.on('close', async () => {
      this.middleware?.close(noop);
      this.socketServer.close();
    });
  }

  public sockWrite(
    type: string,
    data?: Record<string, any> | string | boolean,
  ) {
    this.socketServer.sockWrite(type, data);
  }

  private setupDevMiddleware(devMiddleware: CustomDevMiddleware) {
    const { devOptions } = this;

    const callbacks = {
      onInvalid: () => {
        this.socketServer.sockWrite('invalid');
      },
      onDone: (stats: any) => {
        this.socketServer.updateStats(stats);
        this.emit('change', stats);
      },
    };

    const enableHMR = this.devOptions.hot || this.devOptions.liveReload;

    const middleware = devMiddleware({
      headers: devOptions.headers,
      stats: false,
      callbacks,
      hmrClientPath: enableHMR
        ? getHMRClientPath(devOptions.client)
        : undefined,
      ...devOptions.devMiddleware,
    });

    return middleware;
  }
}
