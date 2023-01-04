import path from 'path';
import { createRequire } from 'module';
import { UserConfig } from 'shared/types';
import { BuilderInstance, mergeBuilderConfig } from '@modern-js/builder';
import type {
  BuilderConfig,
  BuilderWebpackProvider,
} from '@modern-js/builder-webpack-provider';
import sirv from 'sirv';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import WindiCSSWebpackPlugin from 'windicss-webpack-plugin';
import { CLIENT_ENTRY, SSR_ENTRY, PACKAGE_ROOT, OUTPUT_DIR } from './constants';
import { createMDXOptions } from './mdx';
import { virtualModuleFactoryList } from './virtualModule';
import { replacePlugin } from './plugins/replace';
import windiConfig from './windiOptions';

const require = createRequire(import.meta.url);

async function createInternalBuildConfig(
  userRoot: string,
  config: UserConfig,
  isSSR: boolean,
): Promise<BuilderConfig> {
  const { default: fs } = await import('@modern-js/utils/fs-extra');
  const mdxOptions = await createMDXOptions(userRoot, config);
  const CUSTOM_THEME_DIR = path.join(process.cwd(), 'theme');
  const themeDir = (await fs.pathExists(CUSTOM_THEME_DIR))
    ? CUSTOM_THEME_DIR
    : path.join(PACKAGE_ROOT, 'src', 'theme-default');
  // The order should be sync
  const virtualModulePlugins: VirtualModulesPlugin[] = [];
  for (const factory of virtualModuleFactoryList) {
    virtualModulePlugins.push(await factory(userRoot, config, isSSR));
  }

  const publicDir = path.join(userRoot, 'public');
  const isPublicDirExist = await fs.pathExists(publicDir);
  return {
    html: {
      template: path.join(PACKAGE_ROOT, 'index.html'),
    },
    output: {
      distPath: {
        root: config.doc?.outDir ?? OUTPUT_DIR,
      },
      assetPrefix: config.doc?.base || '',
      svgDefaultExport: 'component',
      disableTsChecker: true,
    },
    source: {
      alias: {
        'react/jsx-runtime': require.resolve('react/jsx-runtime'),
        'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
        react: require.resolve('react'),
        '@': path.join(PACKAGE_ROOT, 'src'),
        '@/runtime': path.join(PACKAGE_ROOT, 'src', 'runtime', 'index.ts'),
        '@theme': themeDir,
      },
      include: [PACKAGE_ROOT],
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
        after: [...(isPublicDirExist ? [sirv(publicDir)] : [])],
        historyApiFallback: true,
      },
      cssExtract: {},
      webpackChain(chain, { CHAIN_ID, isProd }) {
        const [loader, options] = chain.module
          .rule(CHAIN_ID.RULE.JS)
          .use(CHAIN_ID.USE.BABEL)
          .values();
        chain.module
          .rule('MDX')
          .test(/\.mdx?$/)
          .use('string-replace-loader')
          .loader(require.resolve('string-replace-loader'))
          .options({
            multiple: config.doc?.replaceRules || [],
          })
          .end()
          .use('babel-loader')
          .loader(loader as unknown as string)
          .options(options)
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

        chain.resolve.extensions.merge(['.ts', '.tsx', '.mdx', '.md']);
      },
      webpack(config) {
        config.plugins!.push(...virtualModulePlugins);
        config.plugins!.push(
          new WindiCSSWebpackPlugin({
            config: windiConfig,
          }),
        );
        config.cache = {
          type: 'filesystem',
        };
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

  // Add normal plugins
  if (config.doc?.plugins) {
    docPlugins.push(...config.doc.plugins);
  }
  // Add post plugin
  docPlugins.push(replacePlugin());

  // Process doc config by plugins
  for (const plugin of docPlugins) {
    if (typeof plugin.config === 'function') {
      config.doc = await plugin.config(config.doc || {});
    }
  }

  const internalBuilderConfig = await createInternalBuildConfig(
    userRoot,
    config,
    isSSR,
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
