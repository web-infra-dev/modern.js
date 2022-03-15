import http from 'http';
import { webpack, HotModuleReplacementPlugin } from 'webpack';
import SocketServer from '../src/dev-tools/socket-server';
import DevServerPlugin from '../src/dev-tools/dev-server-plugin';

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

  test('should dev server plugin work correctly with hot plugin', () => {
    const compiler = webpack({
      plugins: [new HotModuleReplacementPlugin()],
    });
    new DevServerPlugin({
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
    }).apply(compiler);

    // expect(compiler.options.entry)
    const entryPluginHook = compiler.hooks.compilation.taps.filter(
      tap => tap.name === 'EntryPlugin',
    );
    const hotPluginHook = compiler.hooks.compilation.taps.filter(
      tap => tap.name === 'HotModuleReplacementPlugin',
    );
    expect(entryPluginHook.length).toBe(3);
    expect(hotPluginHook.length).toBe(1);
  });

  test('should dev server plugin work correctly', () => {
    const compiler = webpack({});
    new DevServerPlugin({
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
    }).apply(compiler);

    // expect(compiler.options.entry)
    const entryPluginHook = compiler.hooks.compilation.taps.filter(
      tap => tap.name === 'EntryPlugin',
    );
    const hotPluginHook = compiler.hooks.compilation.taps.filter(
      tap => tap.name === 'HotModuleReplacementPlugin',
    );
    expect(entryPluginHook.length).toBe(3);
    expect(hotPluginHook.length).toBe(1);
  });
});
