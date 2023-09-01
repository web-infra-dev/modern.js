import { URL } from 'url';
import assert from 'assert';
import { join } from 'path';
import fs from '@modern-js/utils/fs-extra';
import type { CreateBuilderOptions } from '@modern-js/builder';
import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { BuilderConfig as RspackBuilderConfig } from '@modern-js/builder-rspack-provider';
import { StartDevServerOptions } from '@modern-js/builder-shared';

export const getHrefByEntryName = (entryName: string, port: number) => {
  const baseUrl = new URL(`http://localhost:${port}`);
  const htmlRoot = new URL('html/', baseUrl);
  const homeUrl = new URL(`${entryName}/index.html`, htmlRoot);

  return homeUrl.href;
};

async function getWebpackBuilderProvider(builderConfig: BuilderConfig) {
  const { builderWebpackProvider } = await import(
    '@modern-js/builder-webpack-provider'
  );

  const builderProvider = builderWebpackProvider({
    builderConfig,
  });

  return builderProvider;
}

async function getRspackBuilderProvider(builderConfig: RspackBuilderConfig) {
  const { builderRspackProvider } = await import(
    '@modern-js/builder-rspack-provider'
  );

  const builderProvider = builderRspackProvider({
    builderConfig,
  });

  return builderProvider;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export const createBuilder = async (
  builderOptions: CreateBuilderOptions,
  builderConfig: BuilderConfig | RspackBuilderConfig = {},
) => {
  const { createBuilder } = await import('@modern-js/builder');

  const builderProvider =
    process.env.PROVIDE_TYPE === 'rspack'
      ? await getRspackBuilderProvider(builderConfig as RspackBuilderConfig)
      : await getWebpackBuilderProvider(builderConfig as BuilderConfig);

  const builder = await createBuilder(builderProvider, builderOptions);

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

const updateConfigForTest = <BuilderType>(
  config: BuilderType extends 'webpack' ? BuilderConfig : RspackBuilderConfig,
) => {
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

export async function dev<BuilderType = 'webpack'>({
  serverOptions,
  builderConfig = {},
  ...options
}: CreateBuilderOptions & {
  builderConfig?: BuilderType extends 'webpack'
    ? BuilderConfig
    : RspackBuilderConfig;
  serverOptions?: StartDevServerOptions['serverOptions'];
}) {
  process.env.NODE_ENV = 'development';

  updateConfigForTest(builderConfig);

  const builder = await createBuilder(options, builderConfig);
  return builder.startDevServer({
    printURLs: false,
    serverOptions,
  });
}

export async function build<BuilderType = 'webpack'>({
  plugins,
  runServer = false,
  builderConfig = {},
  ...options
}: CreateBuilderOptions & {
  plugins?: any[];
  runServer?: boolean;
  builderConfig?: BuilderType extends 'webpack'
    ? BuilderConfig
    : RspackBuilderConfig;
}) {
  process.env.NODE_ENV = 'production';

  updateConfigForTest(builderConfig);

  // todo: support test swc (add swc plugin) use providerType 'webpack-swc'?
  const builder = await createBuilder(options, builderConfig);

  builder.removePlugins(['builder-plugin-file-size']);

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
