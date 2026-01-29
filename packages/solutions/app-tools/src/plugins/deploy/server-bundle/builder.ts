import path from 'node:path';
import {
  type BuilderConfig,
  type BuilderInstance,
  SERVICE_WORKER_ENVIRONMENT_NAME,
  createBuilder,
} from '@modern-js/builder';
import type { CLIPluginAPI } from '@modern-js/plugin';
import { lodash as _, fs as fse } from '@modern-js/utils';
import { applyBuilderPlugins } from '../../../builder/generator';
import { createBuilderProviderConfig } from '../../../builder/generator/createBuilderProviderConfig';
import type { AppTools } from '../../../types';
import { ESM_RESOLVE_CONDITIONS } from './constant';

export const generateNodeExternals = (
  getExternal: (api: string) => string,
  list: string[] = [],
) => [
  ...list.map(api => [api, getExternal(api)]),
  ...list.map(api => [`node:${api}`, getExternal(api)]),
];

export interface BundleSSROptions {
  config?: BuilderConfig;
  modifyBuilder?: (builder: BuilderInstance) => Promise<void>;
  forceESM?: boolean;
}

export const bundleServer = async (
  handlerCode: string,
  api: CLIPluginAPI<AppTools>,
  options?: BundleSSROptions,
) => {
  const normalizedConfig = api.getNormalizedConfig();
  const appContext = api.getAppContext();

  const minify = normalizedConfig.output?.minify ?? true;

  const handlerPath = path.join(
    appContext.internalDirectory,
    'modern-server-bundle',
    'handler.mjs',
  );
  await fse.writeFile(handlerPath, handlerCode);

  // create provider
  const providerConfig = createBuilderProviderConfig(
    normalizedConfig,
    appContext,
  );

  const defaultConfig: BuilderConfig = {
    environments: {
      [SERVICE_WORKER_ENVIRONMENT_NAME]: {
        source: {
          entry: {
            bundle: {
              import: handlerPath,
              html: false,
            },
          },
          define: {
            'process.env.NODE_ENV': '"production"',
            'process.env.MODERN_SSR_ENV': '"edge"',
          },
        },
      },
    },
    resolve: {
      conditionNames: ESM_RESOLVE_CONDITIONS,
    },
    output: {
      target: 'web',
      emitAssets: false,
      cleanDistPath: true,
      polyfill: 'off',
      sourceMap: false,
      distPath: {
        js: '.',
        jsAsync: '.',
        worker: '.',
        server: '.',
      },
      filename: {
        js: '[name].js',
      },
      minify,
    },
    performance: {
      chunkSplit: {
        strategy: 'all-in-one',
      },
    },
    tools: {
      rspack: {
        target: 'es2020',
        output: {
          asyncChunks: false,
          library: {
            type: 'module',
          },
          pathinfo: !minify,
        },
        experiments: {
          outputModule: true,
        },
      },
    },
  };

  const finalConfig = _.merge(
    {},
    providerConfig,
    defaultConfig,
    options?.config,
  );

  const builder = await createBuilder({
    bundlerType: 'rspack',
    config: finalConfig,
  });

  await applyBuilderPlugins(builder, {
    normalizedConfig,
    appContext,
  });

  // remove bff server external
  builder.modifyRsbuildConfig(config => {
    const { output } = config;
    if (Array.isArray(output?.externals)) {
      output.externals = output.externals.filter(
        x => typeof x !== 'object' || !('@modern-js/plugin-bff/server' in x),
      );
    }
  });

  if (options?.modifyBuilder) {
    await options.modifyBuilder(builder);
  }

  await builder.build();
};
