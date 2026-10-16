import { fileReader } from '@modern-js/runtime-utils/fileReader';
import path from 'node:path';
import type { Monitors, ServerRoute } from '@modern-js/types';
import { compatibleRequire, fs } from '@modern-js/utils';
import {
  getServerManifest,
  injectResourcePlugin,
} from '../../src/adapters/node/plugins/resource';
import type { ServerPluginAPI } from '../../src/types';

rstest.mock('@modern-js/utils', () => {
  const actualUtils =
    rstest.requireActual<typeof import('@modern-js/utils')>('@modern-js/utils');
  return {
    ...actualUtils,
    compatibleRequire: rstest.fn(),
    fs: { ...actualUtils.fs, pathExists: rstest.fn(), access: rstest.fn() },
  };
});

const pwd = path.resolve('resource-warmup-fixture');
const renderPath = path.join(pwd, 'bundles/main.js');
const loaderPath = path.join(pwd, 'bundles/main-server-loaders.js');
const route: ServerRoute = {
  urlPath: '/',
  entryPath: 'html/main/index.html',
  entryName: 'main',
  bundle: 'bundles/main.js',
  isSSR: true,
};
const renderBundle = { render: 'ready' };
const available = new Map<string, unknown>();
const errors = new Map<string, unknown>();
const accessErrors = new Map<string, unknown>();
const errorLogger = rstest.fn();
const monitors = { error: errorLogger } as unknown as Monitors;

function preparation(routes: ServerRoute[] = [route]) {
  let prepare!: () => unknown;
  const context = {
    fileReader,
    distDirectory: pwd,
    routes,
    middlewares: [] as Array<{ name: string }>,
  };
  injectResourcePlugin().setup?.({
    onPrepare: (callback: () => unknown) => {
      prepare = callback;
    },
    getServerContext: () => context,
  } as unknown as ServerPluginAPI);
  return { context, prepare: () => Promise.resolve(prepare()) };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => {
  rstest.stubEnv('NODE_ENV', 'production');
  rstest.clearAllMocks();
  available.clear();
  errors.clear();
  accessErrors.clear();
  available.set(renderPath, renderBundle);
  rstest
    .mocked(fs.pathExists)
    .mockImplementation(
      async filepath =>
        available.has(String(filepath)) || errors.has(String(filepath)),
    );
  rstest.mocked(fs.access).mockImplementation(async filepath => {
    const filename = String(filepath);
    if (accessErrors.has(filename)) {
      throw accessErrors.get(filename);
    }
    if (!available.has(filename) && !errors.has(filename)) {
      throw Object.assign(new Error(`Missing ${filename}`), { code: 'ENOENT' });
    }
  });
  rstest.mocked(compatibleRequire).mockImplementation(async filepath => {
    if (errors.has(filepath)) {
      throw errors.get(filepath);
    }
    if (available.has(filepath)) {
      return available.get(filepath);
    }
    throw Object.assign(new Error(`Cannot find module '${filepath}'`), {
      code: 'MODULE_NOT_FOUND',
    });
  });
  rstest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  rstest.restoreAllMocks();
  rstest.unstubAllEnvs();
});

describe('production SSR manifest warmup', () => {
  it('rejects a missing required bundle with the module loader error', async () => {
    available.delete(renderPath);
    await expect(
      getServerManifest(pwd, [route], monitors, { failOnError: true }),
    ).rejects.toMatchObject({
      code: 'MODULE_NOT_FOUND',
      message: expect.stringContaining(renderPath),
    });
    expect(compatibleRequire).toHaveBeenCalledWith(renderPath, false);
    expect(errorLogger).toHaveBeenCalledWith(
      expect.stringContaining(renderPath),
      expect.stringContaining(renderPath),
    );
  });

  it.each([
    Object.assign(new Error('missing dependency'), {
      code: 'MODULE_NOT_FOUND',
    }),
    Object.assign(new Error('top-level initialization failed'), {
      name: 'StartupModuleError',
    }),
    'non-Error rejection',
  ])('preserves the exact entry rejection: %s', async error => {
    errors.set(renderPath, error);
    await expect(
      getServerManifest(pwd, [route], monitors, { failOnError: true }),
    ).rejects.toBe(error);
    expect(errorLogger).toHaveBeenCalledWith(
      expect.stringContaining(renderPath),
      error instanceof Error ? error.stack : error,
    );
  });

  it('allows absent optional loader bundles and manifests', async () => {
    const manifest = await getServerManifest(pwd, [route], monitors, {
      failOnError: true,
    });
    expect(manifest.renderBundles?.main).toBe(renderBundle);
    expect(manifest.loaderBundles).toEqual({});
    expect(manifest.loadableStats).toEqual({});
    expect(manifest.routeManifest).toEqual({});
    expect(manifest.nestedRoutesJson).toEqual({});
    expect(compatibleRequire).not.toHaveBeenCalledWith(loaderPath, false);
    expect(errorLogger).not.toHaveBeenCalled();
  });

  it('does not treat optional bundle access errors as absent files', async () => {
    const error = Object.assign(new Error('loader access denied'), {
      code: 'EACCES',
    });
    accessErrors.set(loaderPath, error);
    await expect(
      getServerManifest(pwd, [route], monitors, { failOnError: true }),
    ).rejects.toBe(error);
    expect(errorLogger).toHaveBeenCalledWith(
      expect.stringContaining(loaderPath),
      error.stack,
    );
  });

  it('rejects when any required entry in a multi-entry app is missing', async () => {
    const secondRoute = {
      ...route,
      entryName: 'other',
      bundle: 'bundles/other.js',
    };
    await expect(
      getServerManifest(pwd, [route, secondRoute], monitors, {
        failOnError: true,
      }),
    ).rejects.toMatchObject({ code: 'MODULE_NOT_FOUND' });
    expect(errorLogger).toHaveBeenCalledWith(
      expect.stringContaining(path.join(pwd, secondRoute.bundle)),
      expect.any(String),
    );
  });

  it('does not require synthetic SSG bundles for non-SSR static-file routes', async () => {
    const staticRoute: ServerRoute = {
      urlPath: '/text.txt',
      entryPath: 'public/text.txt',
      isSSR: false,
      bundle: 'bundles/undefined.js',
    };
    const manifest = await getServerManifest(
      pwd,
      [route, staticRoute],
      monitors,
      {
        failOnError: true,
      },
    );
    expect(manifest.renderBundles?.main).toBe(renderBundle);
    expect(compatibleRequire).not.toHaveBeenCalledWith(
      path.join(pwd, staticRoute.bundle!),
      false,
    );
    expect(errorLogger).not.toHaveBeenCalled();
  });

  it('rejects a present loader bundle that fails to initialize', async () => {
    const error = new Error('loader bundle initialization failed');
    errors.set(loaderPath, error);
    await expect(
      getServerManifest(pwd, [route], monitors, { failOnError: true }),
    ).rejects.toBe(error);
    expect(errorLogger).toHaveBeenCalledWith(
      expect.stringContaining(loaderPath),
      error.stack,
    );
  });

  it('logs the loader path and preserves loadModules errors', async () => {
    const error = new Error('loadModules failed');
    available.set(loaderPath, {
      loadModules: async () => {
        throw error;
      },
    });
    await expect(
      getServerManifest(pwd, [route], monitors, { failOnError: true }),
    ).rejects.toBe(error);
    expect(errorLogger).toHaveBeenCalledWith(
      expect.stringContaining(loaderPath),
      error.stack,
    );
  });

  it('still tolerates entry loading failures without strict warmup', async () => {
    errors.set(renderPath, new Error('development compilation incomplete'));
    const manifest = await getServerManifest(pwd, [route], monitors);
    expect(manifest.renderBundles).toEqual({});
    expect(errorLogger).toHaveBeenCalledTimes(1);
  });

  it('does not swallow existing request-time loadModules errors', async () => {
    const error = new Error('loader failed');
    available.set(loaderPath, { loadModules: () => Promise.reject(error) });
    await expect(getServerManifest(pwd, [route], monitors)).rejects.toBe(error);
  });
});

describe('resource preparation', () => {
  it('waits for entry warmup before completing production preparation', async () => {
    const entry = deferred<unknown>();
    available.set(renderPath, entry.promise);
    const { prepare, context } = preparation();
    let prepared = false;
    const pending = prepare().then(() => {
      prepared = true;
    });
    try {
      await expect
        .poll(() => compatibleRequire)
        .toHaveBeenCalledWith(renderPath, false);
      expect(prepared).toBe(false);
      entry.resolve(renderBundle);
      await pending;
      expect(prepared).toBe(true);
      expect(context.middlewares.map(item => item.name)).toEqual([
        'inject-server-manifest',
        'inject-html',
      ]);
    } finally {
      entry.resolve(renderBundle);
      await pending;
    }
  });

  it('also waits for loader loadModules, without calling route lazy imports', async () => {
    const loaded = deferred<unknown>();
    const lazyImport = rstest.fn();
    const loadModules = rstest.fn(() => loaded.promise);
    available.set(renderPath, { lazyImport });
    available.set(loaderPath, { loadModules });
    const { prepare } = preparation();
    let prepared = false;
    const pending = prepare().then(() => {
      prepared = true;
    });
    try {
      await expect.poll(() => loadModules).toHaveBeenCalledTimes(1);
      expect(prepared).toBe(false);
      loaded.resolve({ main: { loader: 'ready' } });
      await pending;
      expect(lazyImport).not.toHaveBeenCalled();
    } finally {
      loaded.resolve({});
      await pending;
    }
  });

  it('rejects preparation when entry warmup fails', async () => {
    const error = new Error('startup failed');
    errors.set(renderPath, error);
    const { prepare, context } = preparation();
    await expect(prepare()).rejects.toBe(error);
    expect(context.middlewares).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(renderPath),
    );
  });

  it('does not warm up bundles during development', async () => {
    rstest.stubEnv('NODE_ENV', 'development');
    await preparation().prepare();
    expect(compatibleRequire).not.toHaveBeenCalled();
  });

  it('does not load render bundles for CSR-only routes', async () => {
    const { bundle: _bundle, ...csrRoute } = route;
    await preparation([{ ...csrRoute, isSSR: false }]).prepare();
    expect(compatibleRequire).not.toHaveBeenCalledWith(renderPath, false);
  });

  it('does not make a non-SSR route with a bundle block startup', async () => {
    const entry = deferred<unknown>();
    available.set(renderPath, entry.promise);
    const { prepare } = preparation([{ ...route, isSSR: false }]);
    let prepared = false;
    const pending = prepare().then(() => {
      prepared = true;
    });
    try {
      await expect.poll(() => prepared).toBe(true);
    } finally {
      entry.resolve(renderBundle);
      await pending;
    }
  });

  it('keeps RSC warmup non-blocking', async () => {
    const entry = deferred<unknown>();
    available.set(renderPath, entry.promise);
    try {
      await preparation([{ ...route, isRSC: true }]).prepare();
      expect(compatibleRequire).toHaveBeenCalledWith(renderPath, false);
    } finally {
      entry.resolve(renderBundle);
    }
  });
});
