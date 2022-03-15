import path from 'path';
import fs from 'fs';
import { build } from 'esbuild';
import { scanImports } from '../src/install/scan-imports';
import { DEFAULT_PDN_HOST } from '../src/constants';
import { optimizeDeps, modulesCache } from '../src/install/local-optimize';

jest.mock('esbuild');
jest.mock('@modern-js/esmpack', () => ({
  __esModule: true,
  ...jest.requireActual('@modern-js/esmpack'),
  esmpack: jest.fn().mockResolvedValue({
    run: () =>
      Promise.resolve({
        rollupOutput: {
          output: [
            {
              fileName: 'test',
            },
          ],
        },
      }),
  } as any),
}));
jest.mock('../src/install/scan-imports');
jest.mock('../src/install/modules-cache');

describe('unbundle local optimize test', () => {
  const appDirectory = path.join(
    __dirname,
    './fixtures/local-optimize/packages/module-importer',
  );
  const nodeModulesFolderPath = path.join(appDirectory, './node_modules');
  const webModulesFolderPath = path.join(
    nodeModulesFolderPath,
    './.modern_js_web_modules',
  );
  const metadataFilePath = path.join(webModulesFolderPath, './metadata.json');

  const userConfig: any = {};
  const appContext: any = { appDirectory };

  beforeAll(() => {
    jest.mocked(build).mockResolvedValue({
      outputFiles: [],
      errors: [],
      warnings: [],
      metafile: { outputs: {} } as any,
    });
    jest.mocked(scanImports).mockResolvedValue({
      deps: [],
      enableBabelMacros: false,
    });
    jest.mocked(modulesCache.requestRemoteCache).mockResolvedValue(false);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    if (fs.existsSync(nodeModulesFolderPath)) {
      fs.rmdirSync(nodeModulesFolderPath, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(nodeModulesFolderPath)) {
      fs.rmdirSync(nodeModulesFolderPath, { recursive: true });
    }
  });

  it('optimizeDeps ', async () => {
    await optimizeDeps({
      userConfig,
      appContext,
      dependencies: {
        defaultDeps: [],
        internalPackages: {},
        virtualDeps: {},
        defaultPdnHost: DEFAULT_PDN_HOST,
      },
    });
    expect(fs.existsSync(metadataFilePath)).toBeTruthy();
    const outputMetadata = fs.readFileSync(metadataFilePath, 'utf-8');
    expect(outputMetadata).toBeTruthy();
    const metadataJson = JSON.parse(outputMetadata);
    expect(metadataJson?.enableBabelMacros).toBeFalsy();
    expect(build).toHaveBeenCalled();

    // should not rebuild since no files changed
    jest.mocked(build).mockClear();
    await optimizeDeps({
      userConfig,
      appContext,
      dependencies: {
        defaultDeps: [],
        internalPackages: {},
        virtualDeps: {},
        defaultPdnHost: DEFAULT_PDN_HOST,
      },
    });
    expect(build).not.toHaveBeenCalled();
    expect(modulesCache.clean).not.toHaveBeenCalled();

    // should clear pdn cache and recompile if unbundle options are true
    await optimizeDeps({
      userConfig: {
        ...userConfig,
        dev: { unbundle: { ignoreModuleCache: true, clearPdnCache: true } },
      },
      appContext,
      dependencies: {
        defaultDeps: [],
        internalPackages: {},
        virtualDeps: {},
        defaultPdnHost: DEFAULT_PDN_HOST,
      },
    });
    expect(build).toHaveBeenCalled();
    expect(modulesCache.clean).toHaveBeenCalled();
  });
});
