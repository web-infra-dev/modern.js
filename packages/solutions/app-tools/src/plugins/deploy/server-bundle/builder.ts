import path from 'node:path';
import {
  type BuilderConfig,
  type BuilderInstance,
  createBuilder,
} from '@modern-js/builder';
import type { CLIPluginAPI } from '@modern-js/plugin';
import { lodash as _, fs as fse } from '@modern-js/utils';
import { SERVER_BUNDLE_NAME } from '@modern-js/utils/universal/constants';
import { createBuilderProviderConfig } from '../../../builder/generator/createBuilderProviderConfig';
import type { AppTools } from '../../../types';
import { ESM_RESOLVE_CONDITIONS, NODE_BUILTIN_MODULES } from './constant';

export const generateNodeExternals = (
  getExternal: (api: string) => string,
  list: string[] = [],
) => [
  ...list.map(api => [api, getExternal(api)]),
  ...list.map(api => [`node:${api}`, getExternal(api)]),
];

export interface BundleServerOptions {
  config?: BuilderConfig;
  modifyBuilder?: (builder: BuilderInstance) => Promise<void>;
  nodeExternal?: string[];
}

export const bundleServer = async (
  handlerCode: string,
  api: CLIPluginAPI<AppTools>,
  options?: BundleServerOptions,
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

  const nodeExternal = options?.nodeExternal
    ? Object.fromEntries(
        generateNodeExternals(
          api => `module-import node:${api}`,
          NODE_BUILTIN_MODULES,
        ),
      )
    : undefined;

  const defaultConfig: BuilderConfig = {
    environments: {
      [SERVER_BUNDLE_NAME]: {
        source: {
          entry: {
            bundle: {
              import: handlerPath,
              html: false,
            },
          },
          define: {
            'process.env.MODERN_SERVER_BUNDLE': 'true',
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
      /**
       * web: worked, but should use SERVER_BUNDLE_NAME in plugins to mark this as a server-side build
       * node: generally worked, but can not polyfill node builtin modules
       * web-worker: node externals not take effect
       */
      target: 'web',
      module: true,
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
        js: '[name].mjs',
      },
      minify,
      externals: nodeExternal ? [nodeExternal] : undefined,
    },
    performance: {
      chunkSplit: {
        strategy: 'all-in-one',
      },
    },
    tools: {
      rspack: [
        {
          name: SERVER_BUNDLE_NAME,
          target: 'es2021',
          output: {
            chunkFormat: 'module',
            asyncChunks: false,
            pathinfo: !minify,
            library: {
              type: 'module',
            },
          },
          experiments: {
            outputModule: true,
          },
          ignoreWarnings: [/__dirname/, /dependency is an expression/],
        },
      ],
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

  const plugins = api.getAppContext().builder?.getPlugins();
  const hasPlugins = builder.getPlugins().map(x => x.name);
  if (plugins) {
    builder.addPlugins(plugins.filter(x => !hasPlugins.includes(x.name)));
  }

  builder.modifyRsbuildConfig(config => {
    // remove bff server external
    const { output } = config;
    if (Array.isArray(output?.externals)) {
      output!.externals = output!.externals.filter(
        x => typeof x !== 'object' || !('@modern-js/plugin-bff/server' in x),
      );
    }
  });

  // output stats to debug tree shaking
  // builder.onAfterBuild(async ({ stats }) => {
  //   await fse.writeFile(
  //     path.join(finalConfig.output.distPath!.root!, 'stats.json'),
  //     JSON.stringify(
  //       stats?.toJson({
  //         preset: 'verbose',
  //       }),
  //       null,
  //       2,
  //     ),
  //   );
  // });

  if (options?.modifyBuilder) {
    await options.modifyBuilder(builder);
  }

  await builder.build();
};
