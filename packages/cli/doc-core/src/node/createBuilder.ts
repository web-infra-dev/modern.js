import path from 'path';
import { createRequire } from 'module';
import { UserConfig } from 'shared/types';
import { BuilderInstance, mergeBuilderConfig } from '@modern-js/builder';
import type {
  BuilderConfig,
  BuilderRspackProvider,
} from '@modern-js/builder-rspack-provider';
import sirv from 'sirv';
import fs from '@modern-js/utils/fs-extra';
import { removeTrailingSlash } from '../shared/utils';
import {
  CLIENT_ENTRY,
  SSR_ENTRY,
  PACKAGE_ROOT,
  OUTPUT_DIR,
  isProduction,
  TEMP_DIR,
} from './constants';
import { createMDXOptions } from './mdx';
import { builderDocVMPlugin, runtimeModuleIDs } from './runtimeModule';
import createTailwindConfig from './tailwindOptions';
import { serveSearchIndexMiddleware } from './searchIndex';
import { checkLinks } from './mdx/remarkPlugins/checkDeadLink';

const require = createRequire(import.meta.url);

export interface MdxRsLoaderCallbackContext {
  resourcePath: string;
  links: string[];
  root: string;
  base: string;
}

async function createInternalBuildConfig(
  userRoot: string,
  config: UserConfig,
  isSSR: boolean,
  runtimeTempDir: string,
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
  const enableMdxRs = config.doc?.markdown?.experimentalMdxRs ?? false;

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
        '@mdx-js/react': require.resolve('@mdx-js/react'),
        'react/jsx-runtime': require.resolve('react/jsx-runtime'),
        'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
        react: require.resolve('react'),
        '@': path.join(PACKAGE_ROOT, 'src'),
        '@/runtime': path.join(PACKAGE_ROOT, 'src', 'runtime', 'index.ts'),
        '@theme': themeDir,
        '@modern-js/doc-core': PACKAGE_ROOT,
        'react-lazy-with-preload': require.resolve('react-lazy-with-preload'),
        ...runtimeModuleIDs.reduce((acc, cur) => {
          acc[cur] = path.join(runtimeTempDir, `${cur}.js`);
          return acc;
        }, {} as Record<string, string>),
      },
      include: [PACKAGE_ROOT],
      define: {
        __ASSET_PREFIX__: JSON.stringify(assetPrefix),
        'process.env.__SSR__': JSON.stringify(isSSR),
      },
    },
    tools: {
      postcss(options) {
        options.postcssOptions!.plugins!.push(
          require('tailwindcss')({
            config: createTailwindConfig(themeDir),
          }),
        );
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
          .when(
            enableMdxRs,
            c =>
              c.loader(require.resolve('../mdx-rs-loader.cjs')).options({
                callback: (context: MdxRsLoaderCallbackContext) => {
                  const { links, base, root, resourcePath } = context;
                  checkDeadLinks && checkLinks(links, resourcePath, root, base);
                },
                root: userRoot,
                base,
                defaultLang: config.doc?.lang || '',
              }),
            c =>
              c.loader(require.resolve('@mdx-js/loader')).options(mdxOptions),
          )
          .end();

        chain.resolve.extensions.prepend('.md').prepend('.mdx');
        // TODO: Rspack split chunks bug
        // The default splitChunks config will cause the main module not found
        chain.optimization.splitChunks(false);
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
  // We use a temp dir to store runtime files, so we can separate client and server build
  const runtimeTempDir = path.join(
    TEMP_DIR,
    isSSR ? 'ssr-runtime' : 'client-runtime',
  );

  await fs.ensureDir(runtimeTempDir);

  const { createBuilder } = await import('@modern-js/builder');
  const { builderRspackProvider } = await import(
    '@modern-js/builder-rspack-provider'
  );

  const internalBuilderConfig = await createInternalBuildConfig(
    userRoot,
    config,
    isSSR,
    runtimeTempDir,
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

  builder.addPlugins([
    builderDocVMPlugin(userRoot, config, isSSR, runtimeTempDir),
  ]);

  return builder;
}
