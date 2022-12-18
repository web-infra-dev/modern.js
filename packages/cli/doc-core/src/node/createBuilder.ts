import path from 'path';
import { createRequire } from 'module';
import UnoCSSPlugin from '@unocss/webpack';
import { presetUno, presetAttributify } from 'unocss';
import { UserConfig } from 'shared/types';
import { BuilderInstance, mergeBuilderConfig } from '@modern-js/builder';
import type {
  BuilderConfig,
  BuilderWebpackProvider,
} from '@modern-js/builder-webpack-provider';
import { CLIENT_ENTRY, SSR_ENTRY, PACKAGE_ROOT, OUTPUT_DIR } from './constants';
import { createMDXOptions } from './mdx';
import { virtualModuleFactoryList } from './virtualModule';

const require = createRequire(import.meta.url);

async function createInternalBuildConfig(
  userRoot: string,
  config: UserConfig,
  isSSR: boolean,
): Promise<BuilderConfig> {
  const mdxOptions = createMDXOptions(config);

  const virtualModulePlugins = await Promise.all(
    virtualModuleFactoryList.map(factory => factory(userRoot, config, isSSR)),
  );

  return {
    html: {
      template: path.join(PACKAGE_ROOT, 'index.html'),
    },
    output: {
      distPath: {
        root: OUTPUT_DIR,
      },
    },
    source: {
      alias: {
        'react/jsx-runtime': require.resolve('react/jsx-runtime'),
        '@': path.join(PACKAGE_ROOT, 'src'),
        '@runtime': path.join(PACKAGE_ROOT, 'src', 'runtime', 'index.ts'),
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
      webpackChain(chain, { CHAIN_ID, isProd }) {
        const [loader, options] = chain.module
          .rule(CHAIN_ID.RULE.JS)
          .use(CHAIN_ID.USE.BABEL)
          .values();
        chain.module
          .rule('MDX')
          .test(/\.mdx?$/)
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
        config.plugins!.push(
          UnoCSSPlugin({
            presets: [presetUno(), presetAttributify()],
          }),
        );
        config.plugins!.push(...virtualModulePlugins);

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
  const userRoot = path.resolve(rootDir || process.cwd());
  const { createBuilder } = await import('@modern-js/builder');
  const { builderWebpackProvider } = await import(
    '@modern-js/builder-webpack-provider'
  );
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
