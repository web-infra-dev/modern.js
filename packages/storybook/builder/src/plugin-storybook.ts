/* eslint-disable max-lines */
import { isAbsolute, join, resolve } from 'path';
import {
  slash,
  watch,
  globby,
  applyOptionsChain,
  logger,
} from '@modern-js/utils';
import { CompileOptions } from '@storybook/mdx2-csf';
import type {
  CoreConfig,
  DocsOptions,
  Options,
  PreviewAnnotation,
  StoriesEntry,
} from '@storybook/types';
import {
  normalizeStories,
  stringifyProcessEnvs,
  handlebars,
  readTemplate,
  loadPreviewOrConfigFile,
} from '@storybook/core-common';
import { globalsNameReferenceMap } from '@storybook/preview/globals';
import type { PluginItem } from '@babel/core';
import {
  type RsbuildPlugin,
  type RsbuildPluginAPI,
  type RsbuildConfig,
  type WebpackConfig,
  type RspackConfig,
} from '@rsbuild/shared';
import { mergeRsbuildConfig } from '@rsbuild/core';

import { unplugin as csfPlugin } from '@storybook/csf-plugin';
import { minimatch } from 'minimatch';
import type { UniBuilderConfig } from '@modern-js/uni-builder';
import { BuilderConfig, BuilderOptions } from './types';
import {
  toImportFn,
  virtualModule,
  maybeGetAbsolutePath,
  isDev,
} from './utils';
import { applyDocgenRspack, applyDocgenWebpack } from './docgen';

const STORIES_FILENAME = 'storybook-stories.js';
const STORYBOOK_CONFIG_ENTRY = 'storybook-config-entry.js';

const closeFn: (() => void | Promise<void>)[] = [];
const onClose = (f: () => void | Promise<void>) => {
  closeFn.push(f);
};

export async function finalize() {
  await Promise.all([closeFn.map(close => close())]);
}

export const pluginStorybook: (
  cwd: string,
  options: Options,
) => RsbuildPlugin = (cwd, options) => {
  return {
    name: 'builder-plugin-storybook',

    remove: ['builder-plugin-inline'],

    async setup(api) {
      const matchers: StoriesEntry[] = await options.presets.apply(
        'stories',
        [],
        options,
      );

      const storyPatterns = normalizeStories(matchers, {
        configDir: options.configDir,
        workingDir: options.configDir,
      }).map(({ directory, files }) => {
        const pattern = join(directory, files);
        const absolutePattern = isAbsolute(pattern)
          ? pattern
          : join(options.configDir, pattern);

        return absolutePattern;
      });

      api.modifyRsbuildConfig(async builderConfig => {
        // storybook needs a virtual entry,
        // when new stories get created, the
        // entry needs to be recauculated
        await prepareStorybookModules(
          api.context.cachePath,
          cwd,
          options,
          builderConfig,
          storyPatterns,
        );

        // storybook predefined process.env
        await applyDefines(builderConfig, options);

        // render storybook entry template
        await applyHTML(builderConfig, options);

        // storybook dom shim
        await applyReact(builderConfig, options);

        applyOutput(builderConfig);

        applyServerConfig(builderConfig, options);
      });

      const modifyConfig = async (config: WebpackConfig | RspackConfig) => {
        config.resolve ??= {};
        config.resolve.fullySpecified = false;
        await applyMdxLoader(config, options);
        await applyCsfPlugin(config, options);
      };

      if (api.context.bundlerType === 'webpack') {
        addonAdapter(api, options);

        api.modifyWebpackConfig(modifyConfig);
        api.modifyWebpackChain(async chain => {
          await applyDocgenWebpack(chain, options);
        });
      } else {
        api.modifyRspackConfig(async config => {
          await modifyConfig(config);
          await applyDocgenRspack(config, options);
        });
      }
    },
  };
};

async function applyCsfPlugin(
  config: WebpackConfig | RspackConfig,
  options: Options,
) {
  const { presets } = options;

  const addons = await presets.apply('addons', []);
  const {
    options: { bundler },
  } = await presets.apply<{
    name: string;
    options: BuilderOptions;
  }>('frameworkOptions');

  const docsOptions =
    // @ts-expect-error - not sure what type to use here
    addons.find(a => [a, a.name].includes('@storybook/addon-docs'))?.options ??
    {};

  config.plugins ??= [];
  config.plugins.push(
    bundler === 'rspack'
      ? csfPlugin.rspack(docsOptions)
      : (csfPlugin.webpack(docsOptions) as any),
  );
}

async function prepareStorybookModules(
  tempDir: string,
  cwd: string,
  options: Options,
  builderConfig: RsbuildConfig,
  storyPatterns: string[],
) {
  const mappings = await createStorybookModules(cwd, options, storyPatterns);

  const componentsPath = maybeGetAbsolutePath(`@storybook/components`);
  const routerPath = maybeGetAbsolutePath(`@storybook/router`);
  const themingPath = maybeGetAbsolutePath(`@storybook/theming`);

  const storybookPaths: Record<string, string> = {
    ...(componentsPath
      ? {
          [`@storybook/components`]: componentsPath,
        }
      : {}),
    ...(routerPath ? { [`@storybook/router`]: routerPath } : {}),
    ...(themingPath ? { [`@storybook/theming`]: themingPath } : {}),
  };

  const [mappingsAlias, write] = await virtualModule(tempDir, cwd, mappings);

  builderConfig.source ??= {};
  builderConfig.source.alias = applyOptionsChain(
    {
      ...storybookPaths,
      ...mappingsAlias,
    },
    builderConfig.source.alias,
    { target: 'web' },
  );

  if (isDev()) {
    const watcher = await watchStories(storyPatterns, cwd, write);
    onClose(async () => {
      await watcher.close();
    });
  }
}

async function applyDefines(builderConfig: RsbuildConfig, options: Options) {
  const { presets } = options;
  const envs = await presets.apply<Record<string, string>>('env');

  builderConfig.source ??= {};
  builderConfig.source.define = {
    ...builderConfig.source.define,
    ...stringifyProcessEnvs(envs),
    'process.env': JSON.stringify(envs),
    NODE_ENV: JSON.stringify(process.env.NODE_ENV),
  };
}

async function applyHTML(builderConfig: RsbuildConfig, options: Options) {
  const {
    presets,
    packageJson,
    configType,
    features,
    previewUrl,
    serverChannelUrl,
  } = options;

  const [
    coreOptions,
    frameworkOptions,
    logLevel,
    headHtmlSnippet,
    bodyHtmlSnippet,
    template,
    docsOptions,
  ] = await Promise.all([
    presets.apply<CoreConfig>('core'),
    presets.apply('frameworkOptions'),
    presets.apply('logLevel', undefined),
    presets.apply('previewHead'),
    presets.apply('previewBody'),
    presets.apply<string>('previewMainTemplate'),
    presets.apply<DocsOptions>('docs'),
  ]);

  builderConfig.tools ??= {};

  const htmlPluginConfig =
    typeof builderConfig.tools.htmlPlugin === 'boolean'
      ? {}
      : builderConfig.tools.htmlPlugin;

  builderConfig.tools.htmlPlugin = {
    ...htmlPluginConfig,
    template,
    filename: 'iframe.html',
    templateParameters: {
      ...(htmlPluginConfig
        ? // @ts-expect-error
          htmlPluginConfig.templateParameters || {}
        : {}),
      version: packageJson.version || '',
      globals: {
        CONFIG_TYPE: configType,
        LOGLEVEL: logLevel,
        FRAMEWORK_OPTIONS: frameworkOptions,
        CHANNEL_OPTIONS: coreOptions.channelOptions,
        FEATURES: features,
        PREVIEW_URL: previewUrl,
        DOCS_OPTIONS: docsOptions,
        SERVER_CHANNEL_URL: serverChannelUrl,
      },
      headHtmlSnippet,
      bodyHtmlSnippet,
    },
    inject: false,
  };
}

async function applyMdxLoader(
  config: { module?: { rules?: any[] } },
  options: Options & {
    mdxPluginOptions?: CompileOptions;
  },
) {
  const { presets, mdxPluginOptions } = options;

  const remarkExternalLinks = await import('remark-external-links');
  const remarkSlug = await import('remark-slug');

  const mdxLoaderOptions = await presets.apply('mdxLoaderOptions', {
    skipCsf: true,
    mdxCompileOptions: {
      providerImportSource: '@storybook/addon-docs/mdx-react-shim',
      ...mdxPluginOptions?.mdxCompileOptions,
      remarkPlugins: [
        remarkSlug,
        remarkExternalLinks,
        ...(mdxPluginOptions?.mdxCompileOptions?.remarkPlugins ?? []),
      ],
    },
  });
  const mdxLoader = options.features?.legacyMdx1
    ? require.resolve('@storybook/mdx1-csf/loader')
    : require.resolve('@storybook/mdx2-csf/loader');

  config.module ??= {};
  config.module.rules ??= [];
  config.module.rules.push(
    {
      resourceQuery: /raw/,
      type: 'asset/source',
    },
    {
      test: /\.md$/,
      type: 'asset/source',
    },
    {
      test: /(stories|story)\.mdx$/,
      use: [
        {
          loader: mdxLoader,
          options: {
            ...mdxLoaderOptions,
            skipCsf: false,
          },
        },
      ],
    },
    {
      test: /\.mdx$/,
      exclude: /(stories|story)\.mdx$/,
      use: [
        {
          loader: mdxLoader,
          options: mdxLoaderOptions,
        },
      ],
    },
  );
}

function applyServerConfig(builderConfig: RsbuildConfig, options: Options) {
  builderConfig.server ??= {};

  builderConfig.server = {
    ...(builderConfig.server || {}),
    port: options.port,
    host: 'localhost',
    htmlFallback: false,
    strictPort: true,
    printUrls: false,
  };
}

function applyOutput(builderConfig: RsbuildConfig) {
  const config = mergeRsbuildConfig(
    {
      output: {
        ...builderConfig.output,
        externals: builderConfig.output?.externals,
      },
    },
    {
      output: {
        externals: globalsNameReferenceMap,
        // storybook will generator other files in other pipeline
        cleanDistPath: false,
      },
    },
  );

  builderConfig.output = config.output;
}

function getStoriesEntryPath(cwd: string) {
  return resolve(join(cwd, STORIES_FILENAME));
}

function getStoriesConfigPath(cwd: string) {
  return resolve(join(cwd, STORYBOOK_CONFIG_ENTRY));
}

async function createStorybookModules(
  cwd: string,
  options: Options,
  storyPatterns: string[],
) {
  const virtualModuleMappings: Record<string, string> = {};

  const { presets } = options;
  const storiesEntry = await createStoriesEntry(cwd, storyPatterns);
  virtualModuleMappings[getStoriesEntryPath(cwd)] = storiesEntry;

  const configEntryPath = getStoriesConfigPath(cwd);
  const previewAnnotations = [
    ...(
      await presets.apply<PreviewAnnotation[]>(
        'previewAnnotations',
        [],
        options,
      )
    ).map(entry => {
      // If entry is an object, use the absolute import specifier.
      // This is to maintain back-compat with community addons that bundle other addons
      // and package managers that "hide" sub dependencies (e.g. pnpm / yarn pnp)
      // The vite builder uses the bare import specifier.
      if (typeof entry === 'object') {
        return entry.absolute;
      }
      return resolve(cwd, slash(entry));
    }),
    loadPreviewOrConfigFile(options),
  ].filter(Boolean);
  virtualModuleMappings[configEntryPath] = handlebars(
    await readTemplate(
      require.resolve(
        '@modern-js/storybook-builder/templates/virtualModuleModernEntry.js.handlebars',
      ),
    ),
    {
      storiesFilename: STORIES_FILENAME,
      previewAnnotations,
    },
  ).replace(/\\/g, '\\\\');

  return virtualModuleMappings;
}

async function createStoriesEntry(cwd: string, storyPatterns: string[]) {
  const stories = (
    await Promise.all(
      storyPatterns.map(pattern => {
        return globby(slash(pattern), { followSymbolicLinks: true });
      }),
    )
  ).reduce((carry, stories) => carry.concat(stories), []);

  return await toImportFn(cwd, stories);
}

async function applyReact(config: RsbuildConfig, options: Options) {
  let version = '18.0.0';
  try {
    // @ts-expect-error
    ({ version } = await import('react-dom/package.json'));
  } catch (_) {}

  const { legacyRootApi } =
    (await options.presets.apply<{ legacyRootApi?: boolean } | null>(
      'frameworkOptions',
    )) || {};

  const isReact18 = version.startsWith('18') || version.startsWith('0.0.0');
  const useReact17 = legacyRootApi ?? !isReact18;
  if (!useReact17) {
    config.source ??= {};
    config.source.alias = applyOptionsChain(
      {
        '@storybook/react-dom-shim': '@storybook/react-dom-shim/dist/react-18',
      },
      config.source.alias,
      { target: 'web' },
    );
  }
}

/**
 * Storybook scans all stories in the folder and place them in one module.
 * We need to detect new stories ourself, and regenerate new entry for that
 * story.
 *
 * When `require.context` is usable, we can use that instead.
 */
async function watchStories(
  patterns: string[],
  cwd: string,
  writeModule: (p: string, content: string) => void,
) {
  const watcher = watch(
    cwd,
    async ({ changeType, changedFilePath }) => {
      if (changeType !== 'add' && changeType !== 'unlink') {
        return;
      }

      if (patterns.some(entry => minimatch(changedFilePath, entry))) {
        // recalculate stories
        const stories = (
          await Promise.all(
            patterns.map(pattern => {
              return globby(slash(pattern), { followSymbolicLinks: true });
            }),
          )
        ).reduce((carry, stories) => carry.concat(stories), []);

        const newStories = await toImportFn(cwd, stories);
        writeModule(getStoriesEntryPath(cwd), newStories);
      }
    },
    [/node_modules/],
  );
  return watcher;
}

/**
 * Some addons expose babel plugins and presets, or modify webpack
 */
function addonAdapter(api: RsbuildPluginAPI, options: Options) {
  const { presets } = options;

  api.modifyWebpackConfig(async config => {
    const finalDefaultConfig = await presets.apply(
      'webpackFinal',
      config,
      options,
    );
    return finalDefaultConfig;
  });
}

export async function addonBabelAdapter(
  finalConfig: BuilderConfig,
  options: Options,
) {
  const { presets } = options;

  const babelOptions = await presets.apply('babel', {}, { ...options });
  finalConfig.tools ??= {};
  const userConfig = finalConfig.tools.babel;
  finalConfig.tools.babel = (config, utils) => {
    const getPluginName = (plugin: PluginItem) =>
      Array.isArray(plugin) ? plugin[0] : plugin;
    const getOptions = (plugin: PluginItem) =>
      Array.isArray(plugin) ? plugin[1] : null;

    const replaceOrInsert = (plugin: PluginItem, plugins: PluginItem[]) => {
      const pluginName = getPluginName(plugin);

      for (let i = 0; i < plugins.length; i++) {
        if (getPluginName(plugins[i]) === pluginName) {
          if (getOptions(plugin)) {
            logger.info(
              `Detected duplicated babel plugin or presets: ${pluginName}, overrides with the new one`,
            );
            plugins[i] = plugin;
          }
          return;
        }
      }

      plugins.push(plugin);
    };

    const currentPlugins = config.plugins || [];
    const currentPresets = config.presets || [];

    // O(n * n) but the number of plugins should be small
    for (const plugin of babelOptions.plugins || []) {
      replaceOrInsert(plugin, currentPlugins);
    }
    for (const preset of babelOptions.presets || []) {
      replaceOrInsert(preset, currentPresets);
    }

    const finalConfig: NonNullable<UniBuilderConfig['tools']>['babel'] = {
      ...babelOptions,
      plugins: currentPlugins,
      presets: currentPresets,
    };

    if (userConfig) {
      return applyOptionsChain(finalConfig, userConfig, utils);
    } else {
      return finalConfig;
    }
  };

  return finalConfig;
}
