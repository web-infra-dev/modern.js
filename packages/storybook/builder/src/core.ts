import path, { join, resolve } from 'path';
import { createBuilder } from '@modern-js/builder';
import { createLoadedConfig } from '@modern-js/core';
import { builderWebpackProvider } from '@modern-js/builder-webpack-provider';
import { lodash, slash, fs } from '@modern-js/utils';
import { SharedBuilderConfig, logger } from '@modern-js/builder-shared';
import { builderRspackProvider } from '@modern-js/builder-rspack-provider';
import type {
  Options,
  PreviewAnnotation,
  StoriesEntry,
} from '@storybook/types';
import {
  normalizeStories,
  handlebars,
  readTemplate,
  loadPreviewOrConfigFile,
} from '@storybook/core-common';
import { promise as glob } from 'glob-promise';
import {
  AllBuilderConfig,
  FrameworkOptions,
  RspackBuilderConfig,
  WebpackBuilderConfig,
} from './types';

const VIRTUAL_MODULE_BASE = '.MODERN_STORYBOOK';
const STORIES_ENTRY = 'STORIES_ENTRY';
const STORIES_FILENAME = 'storybook-stories.js';
const STORYBOOK_CONFIG_ENTRY = 'storybook-config-entry.js';

export const getCompiler = async (
  cwd: string,
  stories: StoriesEntry[],
  frameworkConfig: FrameworkOptions,
  options: Options,
  configPath?: string,
) => {
  const bundler = frameworkConfig.bundler || 'webpack';

  const { config: loadedConfig } = await createLoadedConfig(cwd, configPath);

  const userConfig = lodash.merge(
    {},
    loadedConfig,
    frameworkConfig.builderConfig,
  ) as SharedBuilderConfig;

  const builder = await createBuilder(getProvider(bundler, userConfig), {
    cwd,
    target: 'web',
  });

  builder.createCompiler();
};

function getProvider(
  bundler: 'webpack' | 'rspack',
  builderConfig: AllBuilderConfig,
) {
  if (bundler === 'webpack') {
    return builderWebpackProvider({
      builderConfig: builderConfig as WebpackBuilderConfig,
    });
  } else {
    return builderRspackProvider({
      builderConfig: builderConfig as RspackBuilderConfig,
    });
  }
}

async function createStorybookModules(cwd: string, options: Options) {
  const virtualModuleMappings: Record<string, string> = {};

  const { presets } = options;
  const storiesEntry = await createStoriesEntry(cwd, options);
  virtualModuleMappings[STORIES_ENTRY] = storiesEntry;

  const configEntryPath = resolve(join(cwd, STORYBOOK_CONFIG_ENTRY));
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
      return path.resolve(cwd, slash(entry));
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
  );

  return virtualModule(cwd, virtualModuleMappings);
}

async function createStoriesEntry(cwd: string, options: Options) {
  const matchers: StoriesEntry[] = await options.presets.apply(
    'stories',
    [],
    options,
  );

  const stories = (
    await Promise.all(
      normalizeStories(matchers, {
        configDir: options.configDir,
        workingDir: options.configDir,
      }).map(({ directory, files }) => {
        const pattern = path.join(directory, files);
        const absolutePattern = path.isAbsolute(pattern)
          ? pattern
          : path.join(options.configDir, pattern);

        return glob(slash(absolutePattern), { follow: true });
      }),
    )
  ).reduce((carry, stories) => carry.concat(stories), []);

  return await toImportFn(cwd, stories);
}

async function toImportFn(cwd: string, stories: string[]) {
  const objectEntries = stories.map(file => {
    const ext = path.extname(file);
    const relativePath = path.relative(cwd, file);
    if (!['.js', '.jsx', '.ts', '.tsx', '.mdx'].includes(ext)) {
      logger.warn(
        `Cannot process ${ext} file with storyStoreV7: ${relativePath}`,
      );
    }

    return `  '${toImportPath(relativePath)}': async () => import('${file}')`;
  });

  return `
    const importers = {
      ${objectEntries.join(',\n')}
    };

    export async function importFn(path) {
        return importers[path]();
    }
  `;
}

function toImportPath(relativePath: string) {
  return relativePath.startsWith('../') ? relativePath : `./${relativePath}`;
}

// use this instead of virtualModuleWebpackPlugin for rspack compatibility
async function virtualModule(
  cwd: string,
  virtualModuleMap: Record<string, string>,
): Promise<{
  alias: Record<string, string>;
  writeModule: (p: string, content: string) => void;
}> {
  const tempDir = path.join(cwd, 'node_modules', VIRTUAL_MODULE_BASE);
  fs.ensureDirSync(tempDir);
  const alias: Record<string, string> = {};

  await Promise.all(
    Reflect.ownKeys(virtualModuleMap).map(k => {
      const virtualPath = k as string;
      const relativePath = path.relative(cwd, virtualPath);
      const realPath = path.join(tempDir, relativePath);
      alias[virtualPath] = realPath;
      return fs.writeFile(realPath, virtualModuleMap[virtualPath]);
    }),
  );

  return {
    writeModule(virtualPath: string, content: string) {
      const relativePath = path.relative(cwd, virtualPath);
      const realPath = path.join(tempDir, relativePath);
      fs.writeFileSync(realPath, content);
    },
    alias,
  };
}
