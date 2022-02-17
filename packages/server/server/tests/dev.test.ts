import http from 'http';
import path from 'path';
import { webpack } from 'webpack';
import { fs, LAUNCH_EDITOR_ENDPOINT } from '@modern-js/utils';
import SocketServer from '../src/dev-tools/socket-server';
import DevServerPlugin from '../src/dev-tools/dev-server-plugin';
import Watcher, { getWatchedFiles } from '../src/dev-tools/watcher';
import { StatsCache } from '../src/dev-tools/watcher/stats-cache';
import { createMockHandler } from '../src/dev-tools/mock';
import getMockData, { getMatched } from '../src/dev-tools/mock/getMockData';
import { createLaunchEditorHandler } from '../src/dev-tools/launch-editor';
import { genHttpsOptions } from '../src/dev-tools/https';

const noop = () => {
  // empty
};

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
        // empty
      },
      send(data: string) {
        socket.data = data;
      },
    };
    socketServer.sockets = [socket];
    socketServer.sockWrite('test');
    expect(socket.data).toBe(JSON.stringify({ type: 'test' }));

    socketServer.singleWrite(socket, 'single');
    expect(socket.data).toBe(JSON.stringify({ type: 'single' }));

    socketServer.close();
    expect(socket.state).toBe(0);
    app.close();
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

  describe('test watcher', () => {
    let watcher: any;
    const baseDir = path.join(__dirname, 'fixtures');
    const watchDir = path.join(baseDir, 'watch/**');
    const filepath = path.join(baseDir, 'watch', 'index.ts');
    const filepatha = path.join(baseDir, 'watch', 'a.ts');
    const txt = path.join(baseDir, 'watch', 'stats.txt');

    afterEach(() => {
      if (watcher) {
        watcher.close();
      }
      fs.writeFileSync(txt, '1');
    });

    it('should create watcher instance correctly', resolve => {
      watcher = new Watcher();
      expect(watcher.dependencyTree).toBeNull();
      watcher.createDepTree();
      expect(watcher.dependencyTree).not.toBeNull();

      expect(watcher.watcher).toBeUndefined();
      watcher.listen([watchDir], {}, () => {
        // empty
      });

      expect(watcher.watcher).toBeDefined();
      require(filepath);
      expect(watcher.dependencyTree.getNode(filepath)).toBeUndefined();
      watcher.updateDepTree();
      expect(watcher.dependencyTree.getNode(filepath)).toBeDefined();
      watcher.cleanDepCache(filepath);
      expect(watcher.dependencyTree.getNode(filepath)).toBeDefined();

      jest.resetModules();
      watcher.updateDepTree();
      expect(watcher.dependencyTree.getNode(filepath)).toBeUndefined();

      setTimeout(() => {
        const fl = getWatchedFiles(watcher.watcher);
        expect(fl.includes(filepatha)).toBeTruthy();
        expect(fl.includes(filepath)).toBeTruthy();
        expect(fl.includes(txt)).toBeTruthy();
        resolve();
      }, 1000);
    });

    it('should stats cache instance work correctly', () => {
      const statsCache = new StatsCache();

      // should not exist false before add
      expect(statsCache.has(txt)).toBeFalsy();

      // should exist true after add
      statsCache.add([txt]);
      expect(statsCache.has(txt)).toBeTruthy();

      // should diff correctly
      fs.writeFileSync(txt, 'foo');
      expect(statsCache.isDiff(txt)).toBeTruthy();

      // should not diff if not refresh
      fs.writeFileSync(txt, '1');
      expect(statsCache.isDiff(txt)).toBeFalsy();

      // should diff after refresh
      fs.writeFileSync(txt, 'foo');
      statsCache.refresh(txt);
      fs.writeFileSync(txt, '1');
      expect(statsCache.isDiff(txt)).toBeTruthy();

      // should diff when content change
      statsCache.refresh(txt);
      fs.writeFileSync(txt, '2');
      expect(statsCache.isDiff(txt)).toBeTruthy();

      // should not exist after del
      statsCache.del(txt);
      expect(statsCache.has(txt)).toBeFalsy();
    });
  });

  describe('should mock middleware work correctly', () => {
    const pwd = path.join(__dirname, './fixtures/mock');

    it('should return null if no config mock dir', () => {
      expect(createMockHandler({ pwd: path.join(pwd, 'empty') })).toBeNull();
    });

    it('should return null if no api dir', () => {
      expect(createMockHandler({ pwd: path.join(pwd, 'zero') })).toBeNull();
    });

    it('should return middleware if mock api exist', async () => {
      const middleware = createMockHandler({ pwd: path.join(pwd, 'exist') });

      expect(middleware).not.toBeNull();

      let response: any;
      const context: any = {
        path: '/api/getInfo',
        method: 'get',
        res: {
          setHeader: noop,
          end: (data: any) => {
            response = JSON.parse(data);
          },
        },
      };
      await middleware?.(context, noop);
      expect(response).toEqual({
        data: [1, 2, 3, 4],
      });
    });

    it('should get api list correctly', () => {
      const apiList = getMockData(path.join(pwd, 'exist/config/mock/index.ts'));
      expect(apiList.length).toBe(3);

      const pathList = apiList.map(api => api.path);
      expect(pathList).toEqual([
        '/api/getInfo',
        '/api/getExample',
        '/api/addInfo',
      ]);

      let response: any;
      const context: any = {
        res: {
          setHeader: noop,
          end: (data: any) => {
            response = JSON.parse(data);
          },
        },
      };

      apiList[0].handler(context, noop as any);
      expect(response).toEqual({
        data: [1, 2, 3, 4],
      });
      apiList[1].handler(context, noop as any);
      expect(response).toEqual({ id: 1 });
    });

    it('should match api correctly', () => {
      const apiList = [
        {
          method: 'get',
          path: '/api/getInfo',
          handler: noop,
        },
        {
          method: 'get',
          path: '/api/getExample',
          handler: noop,
        },
        {
          method: 'get',
          path: '/api/addInfo',
          handler: noop,
        },
      ];
      const matched = getMatched(
        { path: '/api/getInfo', method: 'get' } as any,
        apiList,
      );
      expect(matched).toBe(apiList[0]);

      const missMethod = getMatched(
        { path: '/api/getModern', method: 'post' } as any,
        apiList,
      );
      expect(missMethod).toBeUndefined();
    });
  });

  describe('should createLaunchEditorHandler work correctly', () => {
    const middleware = createLaunchEditorHandler();

    it('should return 200 if filename exist', () => {
      let response: any;
      const context: any = {
        url: LAUNCH_EDITOR_ENDPOINT,
        query: {
          filename: 'test.ts',
        },
        res: {
          end: (data: any) => {
            response = data;
          },
        },
      };
      middleware(context, noop);
      expect(context.status).toBe(200);
      expect(response).toBeUndefined();
    });

    it('should return 500 if filename not exist', () => {
      let response: any;
      const context: any = {
        url: LAUNCH_EDITOR_ENDPOINT,
        query: {
          filename: '',
        },
        res: {
          end: (data: any) => {
            response = data;
          },
        },
      };
      middleware(context, noop);
      expect(context.status).toBe(500);
      expect(typeof response === 'string').toBeTruthy();
    });

    it('should invoke next if not launch editor url', () => {
      let response: any;
      const context: any = {
        url: '',
        res: {
          end: (data: any) => {
            response = data;
          },
        },
      };
      middleware(context, noop);
      expect(context.status).toBeUndefined();
      expect(response).toBeUndefined();
    });
  });

  test('should get http cert correctly', async () => {
    // const options = await genHttpsOptions(true);
    // expect(options.key).toBeDefined();
    // expect(options.cert).toBeDefined();

    const useOpt = await genHttpsOptions({
      key: 'foo',
      cert: 'baz',
    });
    expect(useOpt.key).toBe('foo');
    expect(useOpt.cert).toBe('baz');
  });
});
