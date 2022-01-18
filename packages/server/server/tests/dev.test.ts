import http from 'http';
import SocketServer from '../src/dev-tools/socket-server';

describe('test dev tools', () => {
  test('should socket server work correctly', () => {
    const socketServer: any = new SocketServer({
      client: {
        port: '8080',
        overlay: false,
        logging: 'error',
        path: '/',
        host: '127.0.0.1',
      },
      dev: {
        writeToDisk: false,
      },
      watch: true,
      hot: true,
      liveReload: true,
    });
    const app = http
      .createServer((req, res) => {
        res.end();
      })
      .listen(8080);

    socketServer.prepare(app);
    expect(socketServer.app).toBe(app);
    expect(socketServer.stats).toBeUndefined();

    const mockStats = {
      toJson: () => ({}),
    };
    socketServer.updateStats(mockStats);
    expect(socketServer.stats).toBe(mockStats);

    app.close();
  });
});
