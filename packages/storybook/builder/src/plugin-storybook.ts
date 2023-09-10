/* eslint-disable max-lines */
import { isAbsolute, join, resolve } from 'path';
import { slash, watch } from '@modern-js/utils';
import {
  BuilderPlugin,
  SharedBuilderConfig,
  mergeBuilderConfig,
} from '@modern-js/builder-shared';
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
import { globals } from '@storybook/preview/globals';
import { promise as glob } from 'glob-promise';

import type {
  BuilderPluginAPI as WebpackAPI,
  WebpackConfig,
} from '@modern-js/builder-webpack-provider';
import type {
  BuilderPluginAPI as RspackAPI,
  RspackConfig,
} from '@modern-js/builder-rspack-provider';
import { unplugin as csfPlugin } from '@storybook/csf-plugin';
import minimatch from 'minimatch';
import { AllBuilderConfig, FrameworkOptions } from './types';
import { toImportFn, virtualModule, maybeGetAbsolutePath } from './utils';
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
) => BuilderPlugin<WebpackAPI | RspackAPI> = (cwd, options) => {
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

      api.modifyBuilderConfig(async builderConfig => {
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

        applyExternals(builderConfig);
      });

      const modifyConfig = async (config: WebpackConfig | RspackConfig) => {
        config.resolve ??= {};
        config.resolve.conditionNames = [
          'require',
          'node',
          ...(config.resolve.conditionNames || []),
        ];
        config.resolve.fullySpecified = false;
        await applyMdxLoader(config, options);
        await applyCsfPlugin(config, options);
      };

      if ('modifyWebpackConfig' in api) {
        api.modifyWebpackConfig(modifyConfig);
        api.modifyWebpackChain(async chain => {
          await applyDocgenWebpack(chain, options);
        });
      } else if ('modifyRspackConfig' in api) {
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
    options: FrameworkOptions;
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
  builderConfig: SharedBuilderConfig,
  storyPatterns: string[],
) {
  const mappings = await createStorybookModules(cwd, options, storyPatterns);

  const managerAPIPath = maybeGetAbsolutePath(`@storybook/manager-api`);
  const componentsPath = maybeGetAbsolutePath(`@storybook/components`);
  const routerPath = maybeGetAbsolutePath(`@storybook/router`);
  const themingPath = maybeGetAbsolutePath(`@storybook/theming`);

  const storybookPaths: Record<string, string> = {
    ...(managerAPIPath
      ? {
          // TODO: deprecated, remove in 8.0
          [`@storybook/api`]: managerAPIPath,
          [`@storybook/manager-api`]: managerAPIPath,
        }
      : {}),
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
  builderConfig.source.alias = {
    ...builderConfig.source.alias,
    ...storybookPaths,
    ...mappingsAlias,
  };

  const watcher = await watchStories(storyPatterns, cwd, write);
  onClose(async () => {
    await watcher.close();
  });
}

async function applyDefines(builderConfig: AllBuilderConfig, options: Options) {
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

async function applyHTML(builderConfig: AllBuilderConfig, options: Options) {
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
  builderConfig.tools.htmlPlugin = {
    ...builderConfig.tools.htmlPlugin,
    template,
    filename: 'iframe.html',
    templateParameters: {
      ...(builderConfig.tools.htmlPlugin
        ? // @ts-expect-error
          builderConfig.tools.htmlPlugin.templateParameters || {}
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

function applyExternals(builderConfig: AllBuilderConfig) {
  const config = mergeBuilderConfig(
    {
      output: {
        externals: builderConfig.output?.externals,
      },
    },
    {
      output: {
        externals: globals,
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
        return glob(slash(pattern), { follow: true });
      }),
    )
  ).reduce((carry, stories) => carry.concat(stories), []);

  return await toImportFn(cwd, stories);
}

async function applyReact(config: AllBuilderConfig, options: Options) {
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
    config.source.alias ??= {};
    // @ts-expect-error
    config.source.alias['@storybook/react-dom-shim'] =
      '@storybook/react-dom-shim/dist/react-18';
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

      if (
        patterns.some(entry => minimatch(join(cwd, changedFilePath), entry))
      ) {
        // recauculate stories
        const stories = (
          await Promise.all(
            patterns.map(pattern => {
              return glob(slash(pattern), { follow: true });
            }),
          )
        ).reduce((carry, stories) => carry.concat(stories), []);

        const newStories = await toImportFn(cwd, stories);
        writeModule(getStoriesEntryPath(cwd), newStories);
      }
    },
    ['node_modules'],
  );
  return watcher;
}
