import http from 'http';
import SocketServer from '../src/dev-tools/socket-server';

function getRandomPort() {
  return Math.floor(Math.random() * (8000 - 1024)) + 1024;
}

describe('test dev tools', () => {
  test('should socket server work correctly', () => {
    const port = getRandomPort();
    const socketServer: any = new SocketServer({
      client: {
        port: port.toString(),
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
      .listen(port);

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
