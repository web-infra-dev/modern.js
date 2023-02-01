import path from 'path';
import { createRequire } from 'module';
import { DocPlugin, UserConfig } from 'shared/types';
import { BuilderInstance, mergeBuilderConfig } from '@modern-js/builder';
import type {
  BuilderConfig,
  BuilderWebpackProvider,
} from '@modern-js/builder-webpack-provider';
import sirv from 'sirv';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import WindiCSSWebpackPlugin from 'windicss-webpack-plugin';
import { removeTrailingSlash } from '../shared/utils';
import {
  CLIENT_ENTRY,
  SSR_ENTRY,
  PACKAGE_ROOT,
  OUTPUT_DIR,
  isProduction,
} from './constants';
import { createMDXOptions } from './mdx';
import { virtualModuleFactoryList } from './virtualModule';
import createWindiConfig from './windiOptions';
import { serveSearchIndexMiddleware } from './searchIndex';

const require = createRequire(import.meta.url);

async function createInternalBuildConfig(
  userRoot: string,
  config: UserConfig,
  isSSR: boolean,
  docPlugins: DocPlugin[],
): Promise<BuilderConfig> {
  const { default: fs } = await import('@modern-js/utils/fs-extra');
  const mdxOptions = await createMDXOptions(userRoot, config);
  const CUSTOM_THEME_DIR =
    config.doc?.themeDir ?? path.join(process.cwd(), 'theme');
  const themeDir = (await fs.pathExists(CUSTOM_THEME_DIR))
    ? CUSTOM_THEME_DIR
    : path.join(PACKAGE_ROOT, 'src', 'theme-default');
  const checkDeadLinks = config.doc?.markdown?.checkDeadLinks ?? false;
  // Process doc config by plugins
  for (const plugin of docPlugins) {
    if (typeof plugin.config === 'function') {
      config.doc = await plugin.config(config.doc || {});
    }
  }

  // The order should be sync
  const virtualModulePlugins: VirtualModulesPlugin[] = [];
  for (const factory of virtualModuleFactoryList) {
    virtualModulePlugins.push(await factory(userRoot, config, isSSR));
  }

  const publicDir = path.join(userRoot, 'public');
  const isPublicDirExist = await fs.pathExists(publicDir);
  const assetPrefix = config.doc?.builderConfig?.output?.assetPrefix || '';

  // Using latest browserslist in development to improve build performance
  const browserslist = {
    web: isProduction()
      ? [
          'chrome > 61',
          'edge > 16',
          'firefox > 60',
          'safari > 11',
          'ios_saf > 11',
        ]
      : [
          'last 1 chrome version',
          'last 1 firefox version',
          'last 1 safari version',
        ],
    node: ['node >= 14'],
  };

  return {
    html: {
      template: path.join(PACKAGE_ROOT, 'index.html'),
    },
    output: {
      distPath: {
        root: config.doc?.outDir ?? OUTPUT_DIR,
      },
      svgDefaultExport: 'component',
      disableTsChecker: true,
      // disable production source map, it is useless for doc site
      disableSourceMap: isProduction(),
      overrideBrowserslist: browserslist,
    },
    source: {
      alias: {
        'react/jsx-runtime': require.resolve('react/jsx-runtime'),
        'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
        react: require.resolve('react'),
        '@': path.join(PACKAGE_ROOT, 'src'),
        '@/runtime': path.join(PACKAGE_ROOT, 'src', 'runtime', 'index.ts'),
        '@theme': themeDir,
        '@modern-js/doc-core': PACKAGE_ROOT,
      },
      include: [PACKAGE_ROOT],
      define: {
        __ASSET_PREFIX__: JSON.stringify(
          isProduction() ? removeTrailingSlash(assetPrefix) : '',
        ),
      },
    },
    tools: {
      babel(options, { modifyPresetReactOptions }) {
        modifyPresetReactOptions({
          runtime: 'automatic',
        });
        return options;
      },
      devServer: {
        // Serve static files
        after: [
          ...(isPublicDirExist ? [sirv(publicDir)] : []),
          serveSearchIndexMiddleware(config),
        ],
        historyApiFallback: true,
      },
      cssExtract: {},
      webpackChain(chain, { CHAIN_ID, isProd }) {
        chain.module
          .rule('MDX')
          .test(/\.mdx?$/)
          .use('string-replace-loader')
          .loader(require.resolve('string-replace-loader'))
          .options({
            multiple: config.doc?.replaceRules || [],
          })
          .end()
          .use('mdx-loader')
          .loader(require.resolve('@mdx-js/loader'))
          .options(mdxOptions)
          .end();

        if (!isProd) {
          chain.plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH).tap(options => {
            options[0] = {
              ...options[0],
              // Avoid hmr client error in browser
              esModule: false,
            };
            return options;
          });
        }

        chain.resolve.extensions.merge(['.mdx', '.md', '.ts', '.tsx']);
      },
      webpack(config) {
        config.plugins!.push(...virtualModulePlugins);
        config.plugins!.push(
          new WindiCSSWebpackPlugin({
            config: createWindiConfig(themeDir),
          }),
        );

        if (checkDeadLinks) {
          config.cache = {
            // If checkDeadLinks is true, we should use memory cache to avoid skiping mdx-loader when starting dev server again
            type: 'memory',
          };
        }

        return config;
      },
    },
  };
}

export async function createModernBuilder(
  rootDir: string,
  config: UserConfig,
  isSSR = false,
  extraBuilderConfig?: BuilderConfig,
): Promise<BuilderInstance<BuilderWebpackProvider>> {
  const userRoot = path.resolve(rootDir || config.doc?.root || process.cwd());
  const { createBuilder } = await import('@modern-js/builder');
  const { builderWebpackProvider } = await import(
    '@modern-js/builder-webpack-provider'
  );

  const docPlugins = [];

  // Add plugins
  if (config.doc?.plugins) {
    docPlugins.push(...config.doc.plugins);
  }

  const internalBuilderConfig = await createInternalBuildConfig(
    userRoot,
    config,
    isSSR,
    docPlugins,
  );

  const builderProvider = builderWebpackProvider({
    builderConfig: mergeBuilderConfig(
      internalBuilderConfig,
      ...(config.doc?.plugins?.map(plugin => plugin.builderConfig ?? {}) || []),
      config.doc?.builderConfig || {},
      extraBuilderConfig || {},
    ),
  });

  const builder = await createBuilder(builderProvider, {
    target: isSSR ? 'node' : 'web',
    entry: {
      main: isSSR ? SSR_ENTRY : CLIENT_ENTRY,
    },
  });

  return builder;
}
