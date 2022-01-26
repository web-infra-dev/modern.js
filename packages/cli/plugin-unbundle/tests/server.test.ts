import { createServer } from 'http';
// eslint-disable-next-line node/no-unsupported-features/node-builtins
import { createSecureServer } from 'http2';
import { FSWatcher } from 'chokidar';
import { certificateFor } from 'devcert';
import { createDevServer } from '../src/server';
import { fsWatcher } from '../src/watcher';
import { proxyMiddleware } from '../src/middlewares/proxy';
import { onFileChange } from '../src/websocket-server';

jest.mock('koa');
jest.mock('http');
jest.mock('http2');
jest.mock('devcert');
jest.mock('chokidar');
jest.mock('../src/watcher');
jest.mock('../src/websocket-server');
jest.mock('../src/utils');
jest.mock('../src/dev');

// mock middlewares
jest.mock('../src/middlewares/history-api-fallback');
jest.mock('../src/middlewares/not-found');
jest.mock('../src/middlewares/proxy');
jest.mock('../src/plugins/fast-refresh');
jest.mock('../src/middlewares/error-overlay');

// mock plugins
jest.mock('../src/plugins/alias');
jest.mock('../src/plugins/esbuild');
jest.mock('../src/plugins/hmr');
jest.mock('../src/plugins/json');
jest.mock('../src/plugins/resolve');
jest.mock('../src/plugins/define');
jest.mock('../src/plugins/css');
jest.mock('../src/plugins/container');
jest.mock('../src/plugins/import-rewrite');
jest.mock('../src/plugins/fast-refresh');
jest.mock('../src/plugins/lazy-import');
jest.mock('../src/plugins/lambda-api');

describe('plugin-unbundle server', () => {
  let mockAppContext: any;
  let mockConfig: any;

  beforeAll(() => {
    (fsWatcher.init as jest.Mock).mockImplementation(() => new FSWatcher());
    (proxyMiddleware as jest.Mock).mockImplementation(() => []);
    (certificateFor as jest.Mock).mockImplementation(() => ({}));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppContext = {
      appDirectory: __dirname,
    };
    mockConfig = {
      dev: {
        https: false,
      },
      output: {
        disableAutoImportStyle: false,
      },
    };
  });

  it('create dev server', async () => {
    const server = await createDevServer(mockConfig, mockAppContext);
    expect(server).toBeTruthy();

    // default config uses http server
    expect(createServer).toHaveBeenCalled();
    expect(createSecureServer).not.toHaveBeenCalled();
    expect(server.https).toBeFalsy();
  });

  it('create https server', async () => {
    mockConfig.dev.https = true;
    const server = await createDevServer(mockConfig, mockAppContext);
    expect(server).toBeTruthy();

    // should now create https server
    expect(createServer).not.toHaveBeenCalled();
    expect(createSecureServer).toHaveBeenCalled();
    expect(server.https).toBeTruthy();
  });

  it('server listen to file changes', async () => {
    const mockFsWatcher = new FSWatcher();
    (fsWatcher.init as jest.Mock).mockReturnValue(mockFsWatcher);
    await createDevServer(mockConfig, mockAppContext);

    expect(mockFsWatcher.on).toHaveBeenCalledTimes(1);
    const [eventName, callback] = (mockFsWatcher.on as jest.Mock).mock.calls[0];
    expect(eventName).toEqual('change');
    expect(callback).toBeTruthy();

    expect(onFileChange).not.toHaveBeenCalled();
    callback('test');
    expect(onFileChange).toHaveBeenCalled();
  });
});
