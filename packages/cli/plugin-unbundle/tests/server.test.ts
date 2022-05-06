import { createServer } from 'http';
// eslint-disable-next-line node/no-unsupported-features/node-builtins
import { createSecureServer } from 'http2';
import { chokidar } from '@modern-js/utils';
import { certificateFor } from 'devcert';
import { mountHook } from '@modern-js/core';
import * as ServerModule from '../src/server';
import { fsWatcher } from '../src/watcher';
import { proxyMiddleware } from '../src/middlewares/proxy';
import { onFileChange } from '../src/websocket-server';
import {
  DEFAULT_DEPS,
  DEFAULT_PDN_HOST,
  MODERN_JS_INTERNAL_PACKAGES,
  VIRTUAL_DEPS_MAP,
} from '../src/constants';
import { createPluginContainer } from '../src/plugins/container';

const { createDevServer, startDevServer } = ServerModule;

jest.mock('koa');
jest.mock('http');
jest.mock('http2');
jest.mock('devcert');
jest.mock('chokidar');
jest.mock('../src/watcher');
jest.mock('../src/websocket-server');
jest.mock('../src/utils');
jest.mock('../src/dev');
jest.mock('@modern-js/core');

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

// mock install
jest.mock('../src/install/local-optimize');

describe('plugin-unbundle server', () => {
  let mockAppContext: any;
  let mockConfig: any;

  const defaultDependencies = {
    defaultDeps: DEFAULT_DEPS,
    internalPackages: MODERN_JS_INTERNAL_PACKAGES,
    virtualDeps: VIRTUAL_DEPS_MAP,
    defaultPdnHost: DEFAULT_PDN_HOST,
  };

  beforeAll(() => {
    (fsWatcher.init as jest.Mock).mockImplementation(
      () => new chokidar.FSWatcher(),
    );
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
    const server = await createDevServer(
      mockConfig,
      mockAppContext,
      defaultDependencies,
    );
    expect(server).toBeTruthy();

    // default config uses http server
    expect(createServer).toHaveBeenCalled();
    expect(createSecureServer).not.toHaveBeenCalled();
    expect(server.https).toBeFalsy();
  });

  it('create https server', async () => {
    mockConfig.dev.https = true;
    const server = await createDevServer(
      mockConfig,
      mockAppContext,
      defaultDependencies,
    );
    expect(server).toBeTruthy();

    // should now create https server
    expect(createServer).not.toHaveBeenCalled();
    expect(createSecureServer).toHaveBeenCalled();
    expect(server.https).toBeTruthy();
  });

  it('server listen to file changes', async () => {
    const mockFsWatcher = new chokidar.FSWatcher();
    (fsWatcher.init as jest.Mock).mockReturnValue(mockFsWatcher);
    await createDevServer(mockConfig, mockAppContext, defaultDependencies);

    expect(mockFsWatcher.on).toHaveBeenCalledTimes(1);
    const [eventName, callback] = (mockFsWatcher.on as jest.Mock).mock.calls[0];
    expect(eventName).toEqual('change');
    expect(callback).toBeTruthy();

    expect(onFileChange).not.toHaveBeenCalled();
    callback('test');
    expect(onFileChange).toHaveBeenCalled();
  });

  it('start dev server', async () => {
    jest
      .mocked(mountHook)
      .mockImplementation(
        () => ({ unbundleDependencies: (param: any) => param } as any),
      );
    jest
      .mocked(createPluginContainer)
      .mockResolvedValue({ buildStart: jest.fn() } as any);
    jest.mocked(createServer).mockImplementation(
      () =>
        ({
          listen: jest.fn(),
        } as any),
    );
    mockConfig.server = {
      port: 8080,
    };

    const mockUnbundleDependencies = jest.fn();
    const mockAPI: any = {
      useHookRunners: () => ({
        unbundleDependencies() {
          mockUnbundleDependencies();
          return {};
        },
      }),
    };

    await startDevServer(mockAPI, mockConfig, mockAppContext);
    expect(mockUnbundleDependencies).toHaveBeenCalled();
  });
});
