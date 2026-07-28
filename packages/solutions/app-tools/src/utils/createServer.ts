import type { Server } from 'node:http';
import type { Http2SecureServer } from 'node:http2';

let server: Server | Http2SecureServer | null = null;
let closePromise: Promise<void> | null = null;

export const getServer = () => server;

export const setServer = (newServer: Server | Http2SecureServer) => {
  server = newServer;
  closePromise = null;
};

export const closeServer = async () => {
  if (closePromise) {
    return closePromise;
  }

  const currentServer = server;
  server = null;

  if (!currentServer) {
    return;
  }

  closePromise = new Promise<void>((resolve, reject) => {
    currentServer.close(error => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  try {
    await closePromise;
  } finally {
    closePromise = null;
  }
};
