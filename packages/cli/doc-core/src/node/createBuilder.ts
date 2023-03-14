import path from 'path';
import { createRequire } from 'module';
import { UserConfig } from 'shared/types';
import { BuilderInstance, mergeBuilderConfig } from '@modern-js/builder';
import type {
  BuilderConfig,
  BuilderRspackProvider,
} from '@modern-js/builder-rspack-provider';
import sirv from 'sirv';
import { removeTrailingSlash } from '../shared/utils';
import {
  CLIENT_ENTRY,
  SSR_ENTRY,
  PACKAGE_ROOT,
  OUTPUT_DIR,
  isProduction,
} from './constants';
import { createMDXOptions } from './mdx';
import { builderDocVMPlugin, runtimeModuleIDs } from './runtimeModule';
import createTailwindConfig from './tailwindOptions';
import { serveSearchIndexMiddleware } from './searchIndex';

const require = createRequire(import.meta.url);

async function createInternalBuildConfig(
  userRoot: string,
  config: UserConfig,
  isSSR: boolean,
): Promise<BuilderConfig> {
  const cwd = process.cwd();
  const { default: fs } = await import('@modern-js/utils/fs-extra');
  const CUSTOM_THEME_DIR =
    config.doc?.themeDir ?? path.join(process.cwd(), 'theme');
  const outDir = config.doc?.outDir ?? OUTPUT_DIR;
  const themeDir = (await fs.pathExists(CUSTOM_THEME_DIR))
    ? CUSTOM_THEME_DIR
    : path.join(PACKAGE_ROOT, 'src', 'theme-default');
  const checkDeadLinks =
    (config.doc?.markdown?.checkDeadLinks && !isSSR) ?? false;
  const mdxOptions = await createMDXOptions(userRoot, config, checkDeadLinks);
  const base = config.doc?.base ?? '';

  const publicDir = path.join(userRoot, 'public');
  const isPublicDirExist = await fs.pathExists(publicDir);
  // In production, we need to add assetPrefix in asset path
  const assetPrefix = isProduction()
    ? removeTrailingSlash(
        config.doc?.builderConfig?.output?.assetPrefix ?? base,
      )
    : '';

  // Using latest browserslist in development to improve build performance
  const browserslist = {
    web: isProduction()
      ? [
          'chrome >= 61',
          'edge >= 16',
          'firefox >= 60',
          'safari >= 11',
          'ios_saf >= 11',
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
      favicon: config.doc?.icon,
      template: path.join(PACKAGE_ROOT, 'index.html'),
    },
    output: {
      distPath: {
        // `root` must be a relative path in Builder
        root: path.isAbsolute(outDir) ? path.relative(cwd, outDir) : outDir,
      },
      polyfill: 'usage',
      svgDefaultExport: 'component',
      disableTsChecker: true,
      // disable production source map, it is useless for doc site
      disableSourceMap: isProduction(),
      overrideBrowserslist: browserslist,
      assetPrefix,
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
        'react-lazy-with-preload': require.resolve('react-lazy-with-preload'),
        ...runtimeModuleIDs.reduce((acc, cur) => {
          acc[cur] = path.join(cwd, 'node_modules', `${cur}.js`);
          return acc;
        }, {} as Record<string, string>),
      },
      include: [PACKAGE_ROOT],
      define: {
        __ASSET_PREFIX__: JSON.stringify(assetPrefix),
      },
    },
    tools: {
      postcss: {
        postcssOptions: {
          plugins: [
            require('tailwindcss')({
              config: createTailwindConfig(themeDir),
            }),
          ],
        },
      },
      devServer: {
        // Serve static files
        after: [
          ...(isPublicDirExist ? [sirv(publicDir)] : []),
          serveSearchIndexMiddleware(config),
        ],
        historyApiFallback: true,
      },
      bundlerChain(chain) {
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

        chain.resolve.extensions.prepend('.md').prepend('.mdx');
      },
    },
  };
}

export async function createModernBuilder(
  rootDir: string,
  config: UserConfig,
  isSSR = false,
  extraBuilderConfig?: BuilderConfig,
): Promise<BuilderInstance<BuilderRspackProvider>> {
  const cwd = process.cwd();
  const userRoot = path.resolve(rootDir || config.doc?.root || cwd);

  const { createBuilder } = await import('@modern-js/builder');
  const { builderRspackProvider } = await import(
    '@modern-js/builder-rspack-provider'
  );

  const internalBuilderConfig = await createInternalBuildConfig(
    userRoot,
    config,
    isSSR,
  );

  const builderProvider = builderRspackProvider({
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

  builder.addPlugins([builderDocVMPlugin(userRoot, config, isSSR)]);

  return builder;
}
