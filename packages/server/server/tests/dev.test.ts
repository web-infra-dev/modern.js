import http from 'http';
import SocketServer from '../src/dev-tools/dev-middleware/socket-server';

function getRandomPort() {
  return Math.floor(Math.random() * (8000 - 1024)) + 1024;
}

describe('test dev tools', () => {
  test('should socket server work correctly', () => {
    const port = getRandomPort();
    const socketServer: any = new SocketServer({
      client: {
        port: port.toString(),
        path: '/',
        host: '127.0.0.1',
      },
      devMiddleware: {
        writeToDisk: false,
      },
      watch: true,
      hot: true,
      liveReload: true,
    });
    const app = http.createServer((req, res) => {
      res.end();
    });

    socketServer.prepare(app);
    expect(socketServer.app).toBe(app);
    expect(socketServer.stats).toBeUndefined();

    const mockStats = {
      toJson: () => ({}),
    };
    socketServer.updateStats(mockStats);
    expect(socketServer.stats).toBe(mockStats);

    const socket = {
      state: 1,
      readyState: 1,
      data: '',
      close() {
        socket.state = 0;
      },
      send(data: string) {
        socket.data = data;
      },
      on() {
        // empty
      },
    };

    socketServer.onConnect(socket);

    socketServer.sockets = [socket];
    socketServer.sockWrite('test');
    expect(socket.data).toBe(JSON.stringify({ type: 'test' }));

    socketServer.singleWrite(socket, 'single');
    expect(socket.data).toBe(JSON.stringify({ type: 'single' }));

    socketServer.close();
    expect(socket.state).toBe(0);
    app.close();
  });
});
