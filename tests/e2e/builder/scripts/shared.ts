import { URL } from 'url';
import assert from 'assert';
import { join } from 'path';
import fs from '@modern-js/utils/fs-extra';
import type {
  BuilderConfig as UniBuilderConfig,
  CreateUniBuilderOptions,
  StartDevServerOptions,
} from '@modern-js/uni-builder';

type CreateBuilderOptions = Omit<
  CreateUniBuilderOptions,
  'bundlerType' | 'config'
>;

export const getHrefByEntryName = (entryName: string, port: number) => {
  const baseUrl = new URL(`http://localhost:${port}`);
  const htmlRoot = new URL('html/', baseUrl);
  const homeUrl = new URL(`${entryName}/index.html`, htmlRoot);

  return homeUrl.href;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export const createUniBuilder = async (
  builderOptions: CreateBuilderOptions,
  builderConfig: UniBuilderConfig = {},
) => {
  const { createUniBuilder } = await import('@modern-js/uni-builder');

  const builder = await createUniBuilder({
    ...builderOptions,
    bundlerType: process.env.PROVIDE_TYPE === 'rspack' ? 'rspack' : 'webpack',
    config: builderConfig,
  });

  return builder;
};

const portMap = new Map();

function getRandomPort(defaultPort = Math.ceil(Math.random() * 10000) + 10000) {
  let port = defaultPort;
  while (true) {
    if (!portMap.get(port)) {
      portMap.set(port, 1);
      return port;
    } else {
      port++;
    }
  }
}

const updateConfigForTest = (config: UniBuilderConfig) => {
  // make devPort random to avoid port conflict
  config.dev = {
    ...(config.dev || {}),
    port: getRandomPort(config.dev?.port),
  };

  config.dev!.progressBar = config.dev!.progressBar || false;

  if (!config.performance?.buildCache) {
    config.performance = {
      ...(config.performance || {}),
      buildCache: false,
    };
  }

  config.performance.printFileSize = false;

  // disable ts checker to make the tests faster
  if (config.output?.disableTsChecker !== false) {
    config.output = {
      ...(config.output || {}),
      disableTsChecker: true,
    };
  }

  // disable polyfill to make the tests faster
  if (config.output?.polyfill === undefined) {
    config.output = {
      ...(config.output || {}),
      polyfill: 'off',
    };
  }
};

export async function dev({
  serverOptions,
  builderConfig = {},
  ...options
}: CreateBuilderOptions & {
  builderConfig?: UniBuilderConfig;
  serverOptions?: StartDevServerOptions['serverOptions'];
}) {
  process.env.NODE_ENV = 'development';

  updateConfigForTest(builderConfig);

  const builder = await createUniBuilder(options, builderConfig);

  return builder.startDevServer({
    serverOptions,
  });
}

export async function build({
  plugins,
  runServer = false,
  builderConfig = {},
  ...options
}: CreateBuilderOptions & {
  plugins?: any[];
  runServer?: boolean;
  builderConfig?: UniBuilderConfig;
}) {
  process.env.NODE_ENV = 'production';

  updateConfigForTest(builderConfig);

  const builder = await createUniBuilder(options, builderConfig);

  if (plugins) {
    builder.addPlugins(plugins);
  }

  const [{ runStaticServer, globContentJSON }] = await Promise.all([
    import('@modern-js/e2e'),
    builder.build(),
  ]);

  const { distPath } = builder.context;

  const { port, close } = runServer
    ? await runStaticServer(distPath, {
        port: builderConfig.dev!.port,
      })
    : { port: 0, close: noop };

  const clean = async () => await fs.remove(distPath);

  const unwrapOutputJSON = async (ignoreMap = true, maxSize = 4096) => {
    return globContentJSON(distPath, {
      absolute: true,
      maxSize,
      ignore: ignoreMap ? [join(distPath, '/**/*.map')] : [],
    });
  };

  const getIndexFile = async () => {
    const files = await unwrapOutputJSON();
    const [name, content] =
      Object.entries(files).find(
        ([file]) => file.includes('index') && file.endsWith('.js'),
      ) || [];

    assert(name);

    return {
      content: content!,
      size: content!.length / 1024,
    };
  };

  return {
    distPath,
    port,
    clean,
    close,
    unwrapOutputJSON,
    getIndexFile,
    providerType: process.env.PROVIDE_TYPE || 'webpack',
    instance: builder,
  };
}
