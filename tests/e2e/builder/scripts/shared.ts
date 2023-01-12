import { URL } from 'url';
import { join } from 'path';
import fs from '@modern-js/utils/fs-extra';
import type { CreateBuilderOptions } from '@modern-js/builder';
import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { BuilderConfig as RspackBuilderConfig } from '@modern-js/builder-rspack-provider';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';

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
      : await getWebpackBuilderProvider(builderConfig);

  const builder = await createBuilder(builderProvider, builderOptions);

  return builder;
};

export async function dev(
  builderOptions: CreateBuilderOptions,
  config: BuilderConfig = {},
) {
  const builder = await createBuilder(builderOptions, config);
  return builder.startDevServer();
}

export async function build(
  builderOptions: CreateBuilderOptions,
  config: BuilderConfig = {},
  runServer = true,
) {
  const builder = await createBuilder(builderOptions, config);

  builder.removePlugins(['builder-plugin-file-size']);

  const [{ runStaticServer }] = await Promise.all([
    import('@modern-js/e2e'),
    builder.build(),
  ]);

  const { distPath } = builder.context;

  const { port, close } = runServer
    ? await runStaticServer(distPath)
    : { port: 0, close: noop };

  const clean = async () => await fs.remove(distPath);

  return { distPath, port, clean, close };
}

export async function stubBuild(
  builderOptions: CreateBuilderOptions,
  config: BuilderConfig = {},
) {
  const tsConfigPath = join(builderOptions.cwd!, 'tsconfig.json');

  // todo: not yet support switch to rspack-builder
  const builder = await createStubBuilder({
    cwd: builderOptions.cwd,
    webpack: true,
    plugins: 'default',
    target: ['web'],
    builderConfig: config,
    entry: builderOptions.entry,
    context: {
      tsconfigPath: fs.existsSync(tsConfigPath) ? tsConfigPath : undefined,
    } as any,
  });

  builder.removePlugins(['builder-plugin-file-size']);

  return builder;
}
