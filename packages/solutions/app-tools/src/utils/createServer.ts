import type { Server } from 'node:http';
import type { Http2SecureServer } from 'node:http2';

let server: Server | Http2SecureServer | null = null;

export const getServer = () => server;

export const setServer = (newServer: Server | Http2SecureServer) => {
  server = newServer;
};

export const closeServer = async () => {
  if (server) {
    server.close();
    server = null;
  }
};
