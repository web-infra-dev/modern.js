import type net from 'net';
import type { Server as HttpServer } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import { applyPlugins } from '@modern-js/prod-server';
import {
  type ApplyPlugins,
  type ModernDevServerOptions,
  createDevServer,
} from '@modern-js/server';

type AnyServer = HttpServer | Http2SecureServer;
type Socket = net.Socket;
let server: AnyServer | null = null;
let initialServerOptions: ModernDevServerOptions | null = null;
const activeSockets = new Set<Socket>();
let restartCallback: (() => Promise<void>) | null = null;

export const getServer = () => server;

export const setServer = (newServer: AnyServer) => {
  server = newServer;
};

export const closeServer = (timeout = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }

    const cleanupSockets = () => {
      for (const socket of activeSockets) {
        try {
          socket.destroy();
        } catch (e) {
          console.error('Error destroying socket:', e);
        }
      }
      activeSockets.clear();
    };

    let isClosed = false;
    cleanupSockets();

    const timer = setTimeout(() => {
      if (isClosed) return;
      isClosed = true;

      cleanupSockets();
      server?.removeAllListeners();
      reject(new Error(`Server close timed out after ${timeout}ms`));
    }, timeout);

    server.close(err => {
      if (isClosed) return;
      isClosed = true;

      clearTimeout(timer);
      cleanupSockets();
      server?.removeAllListeners();
      server = null;

      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const createServer = async (
  options: ModernDevServerOptions,
  applyPluginsFn?: ApplyPlugins,
) => {
  if (server) {
    try {
      await closeServer();
    } catch (error) {
      console.error('Error closing existing server:', error);
    }
  }

  const { server: newServer, afterListen } = await createDevServer(
    options,
    applyPluginsFn || applyPlugins,
  );

  server = newServer;

  server.on('connection', (socket: Socket) => {
    activeSockets.add(socket);

    socket.on('close', () => {
      activeSockets.delete(socket);
    });
  });

  setServerOptions(options);
  setServer(newServer);
  return { server, afterListen };
};

export const setServerOptions = (options: ModernDevServerOptions): void => {
  initialServerOptions = options;
};

export const restart = async (): Promise<AnyServer> => {
  if (!initialServerOptions) {
    throw new Error('Cannot restart server: Initial options not available');
  }

  try {
    await closeServer();
  } catch (error) {
    console.error('Error closing server during restart:', error);
  }

  const { server: newServer, afterListen } = await createDevServer(
    {
      ...initialServerOptions,
    },
    applyPlugins,
  );

  server = newServer;
  restartCallback = afterListen;

  server.on('connection', (socket: Socket) => {
    activeSockets.add(socket);

    socket.on('close', () => {
      activeSockets.delete(socket);
    });
  });

  return new Promise((resolve, reject) => {
    server!.listen(
      initialServerOptions?.dev.port,
      initialServerOptions?.dev.host,
      async (err?: Error) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          if (restartCallback) {
            await restartCallback();
          }
          resolve(server!);
        } catch (e) {
          reject(e);
        }
      },
    );
  });
};
