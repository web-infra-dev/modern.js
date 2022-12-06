import path from 'path';
<<<<<<< HEAD
import { createRequire } from 'module';
// import UnoCSSPlugin from '@unocss/webpack';
// import { presetUno, presetAttributify } from 'unocss';
import { UserConfig } from 'shared/types';
import { mergeBuilderConfig } from '@modern-js/builder';
import { BuilderConfig } from '@modern-js/builder-webpack-provider';
import { CLIENT_ENTRY, PACKAGE_ROOT } from './constants';
import { createMDXOptions } from './mdx';

const require = createRequire(import.meta.url);

async function createInternalBuildConfig(
  userRoot: string,
  config: UserConfig,
): Promise<BuilderConfig> {
  const mdxOptions = createMDXOptions();

  const { createRouteVirtualModulePlugin, createSiteDataVirtualModulePlugin } =
    await import('./virtualModule');

  const routeVirtualModulePlugin = await createRouteVirtualModulePlugin(
    userRoot,
  );
=======
import type { Options } from '@mdx-js/loader';
// Avoid transpiling to require calls in tsc build
// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
const dynamicImport = new Function('m', 'return import(m)');

export async function createMdxOptions(): Promise<Options> {
  const { default: remarkGFMPlugin } = (await dynamicImport(
    'remark-gfm',
  )) as typeof import('remark-gfm');

  const { default: rehypePluginAutolinkHeadings } = (await dynamicImport(
    'rehype-autolink-headings',
  )) as typeof import('rehype-autolink-headings');
>>>>>>> 48910dbf71 (feat: init doc tools and doc core)

  const siteDataVirtualModulePlugin = await createSiteDataVirtualModulePlugin(
    config,
  );
  return {
    html: {
      template: path.join(PACKAGE_ROOT, 'index.html'),
    },
    output: {
      distPath: {
        root: 'build',
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
      webpackChain(chain, { CHAIN_ID }) {
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
          .use('string-replace-loader')
          .loader(require.resolve('string-replace-loader'))
          .options({
            multiple: [
              {
                search: '\\$FRAMEWORK',
                replace: 'EDEN',
                flags: 'g',
              },
            ],
          })
          .end()
          .use('mdx-loader')
          .loader(require.resolve('@mdx-js/loader'))
          .options(mdxOptions)
          .end();

        chain.resolve.extensions.merge(['.ts', '.tsx', '.mdx', '.md']);
      },
      webpack(config) {
        config
          .plugins!.push
          // UnoCSSPlugin({
          //   presets: [presetUno(), presetAttributify()],
          // }),
          ();
        config.plugins!.push(
          routeVirtualModulePlugin,
          siteDataVirtualModulePlugin,
        );

        return config;
      },
    },
  };
}

<<<<<<< HEAD
export async function createModernBuilder(rootDir: string) {
<<<<<<< HEAD
  const PACKAGE_ROOT = path.join(__dirname, '..');
=======
  const PACKAGE_ROOT = path.join(__dirname, '..', '..', '..', '..');
>>>>>>> 48910dbf71 (feat: init doc tools and doc core)
=======
export async function createModernBuilder(rootDir: string, config: UserConfig) {
>>>>>>> f8c30423ea (feat: parse doc config & schema)
  const userRoot = path.resolve(rootDir || process.cwd());
  const { createBuilder } = await import('@modern-js/builder');
  const { builderWebpackProvider } = await import(
    '@modern-js/builder-webpack-provider'
  );
  const internalBuilderConfig = await createInternalBuildConfig(
    userRoot,
    config,
  );
  const builderProvider = builderWebpackProvider({
<<<<<<< HEAD
    builderConfig: {
      html: {
        template: path.join(PACKAGE_ROOT, 'index.html'),
      },
      output: {
        distPath: {
          root: 'build',
        },
      },
      source: {
        alias: {
          'react/jsx-runtime': require.resolve('react/jsx-runtime'),
        },
<<<<<<< HEAD
        include: [PACKAGE_ROOT],
      },
      tools: {
        cssExtract: {},
        babel(options, { modifyPresetReactOptions }) {
          modifyPresetReactOptions({
            runtime: 'automatic',
          });
          return options;
        },
=======
      },
      tools: {
        postcss(options) {
          options.postcssOptions!.plugins!.push(
            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
            require('tailwindcss')({
              content: ['dist/**/*.js'],
            }),
          );
        },
        cssExtract: {},
>>>>>>> 48910dbf71 (feat: init doc tools and doc core)
        webpackChain(chain, { CHAIN_ID }) {
          const [loader, options] = chain.module
            .rule(CHAIN_ID.RULE.JS)
            .use(CHAIN_ID.USE.BABEL)
            .values();
          chain.module
            .rule('MDX')
            .test(/\.mdx?$/)
            .use('mdx-loader')
            .loader(loader as unknown as string)
            .options(options)
            .loader(require.resolve('@mdx-js/loader'))
            .options(mdxOptions)
            .end();
<<<<<<< HEAD
          chain.resolve.extensions.merge(['.ts', '.tsx', '.mdx', '.md']);
        },
        webpack(config) {
          config.plugins!.push(routeVirtualModulePlugin);
=======
          chain.optimization.realContentHash(true);
        },
        webpack(config) {
          config.plugins!.push(routeVirtualModulePlugin);

>>>>>>> 48910dbf71 (feat: init doc tools and doc core)
          return config;
        },
      },
    },
  });
<<<<<<< HEAD
  const entry = path.join(PACKAGE_ROOT, 'src', 'runtime', 'clientEntry.tsx');
=======
  const entry = path.join(
    PACKAGE_ROOT,
    'dist',
    'js',
    'modern',
    'runtime',
    'clientEntry.js',
  );
>>>>>>> 48910dbf71 (feat: init doc tools and doc core)
=======
    builderConfig: mergeBuilderConfig(
      internalBuilderConfig,
      config.doc?.builderConfig || {},
    ),
  });
>>>>>>> f8c30423ea (feat: parse doc config & schema)
  const builder = await createBuilder(builderProvider, {
    target: ['web'],
    entry: {
      main: CLIENT_ENTRY,
    },
  });
  return builder;
}
