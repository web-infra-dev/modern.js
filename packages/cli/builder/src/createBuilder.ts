import { createRsbuild } from '@rsbuild/core';
import type {
  RsbuildConfig,
  RsbuildInstance,
  RsbuildPlugin,
} from '@rsbuild/core';
import type { PluginBabelOptions } from '@rsbuild/plugin-babel';
import { RSC_LAYERS_NAMES, pluginRSC } from 'rsbuild-plugin-rsc';
import { parseCommonConfig } from './shared/parseCommonConfig';
import { castArray } from './shared/utils';
import type {
  BuilderConfig,
  CreateBuilderCommonOptions,
  CreateBuilderOptions,
} from './types';

const createVirtualModule = (content: string) =>
  `data:text/javascript,${encodeURIComponent(content)}`;

/**
 * Unified plugin for RSC (React Server Components) configuration
 * Handles:
 * 1. Adding layer configuration to server-side entries
 * 2. Excluding /universal[/\\]async_storage/ from react-server-components layer
 * 3. Adding rsc-common layer for /universal[/\\]async_storage/
 * 4. Adding entry name virtual module for client-side entries
 */
const pluginRscConfig = (): RsbuildPlugin => ({
  name: 'builder:rsc-config',
  setup(api) {
    api.modifyRspackConfig((config, utils) => {
      // Check if this is a server build by checking target or environment name
      const isServer =
        config.target === 'node' ||
        (utils as any).isServer ||
        (utils as any).environment === 'server';

      if (!isServer) {
        return;
      }

      // 1. Add layer configuration to server-side entries
      if (config.entry) {
        const entries = config.entry;
        const newEntries: Record<
          string,
          string | string[] | { import: string | string[]; layer: string }
        > = {};

        for (const [entryName, entryValue] of Object.entries(entries)) {
          if (typeof entryValue === 'string') {
            newEntries[entryName] = {
              import: entryValue,
              layer: RSC_LAYERS_NAMES.SERVER_SIDE_RENDERING,
            };
          } else if (Array.isArray(entryValue)) {
            newEntries[entryName] = {
              import: entryValue,
              layer: RSC_LAYERS_NAMES.SERVER_SIDE_RENDERING,
            };
          } else if (typeof entryValue === 'object' && entryValue !== null) {
            // If already an object, add or update layer
            newEntries[entryName] = {
              ...entryValue,
              layer: RSC_LAYERS_NAMES.SERVER_SIDE_RENDERING,
            };
          } else {
            newEntries[entryName] = entryValue;
          }
        }

        config.entry = newEntries;
      }

      // 2. Exclude /universal[/\\]async_storage/ from react-server-components layer
      // 3. Add rsc-common layer for /universal[/\\]async_storage/
      if (config.module?.rules) {
        const asyncStoragePattern = /universal[/\\]async_storage/;
        const rules = config.module.rules as any[];

        // Find and modify rules that have layer: 'react-server-components'
        for (const rule of rules) {
          // Check if this rule has layer: 'react-server-components'
          if (rule.layer === RSC_LAYERS_NAMES.REACT_SERVER_COMPONENTS) {
            // Add exclude to the rule
            if (!rule.exclude) {
              rule.exclude = [];
            } else if (!Array.isArray(rule.exclude)) {
              rule.exclude = [rule.exclude];
            }

            // Check if the exclude pattern already exists
            const hasExclude = rule.exclude.some(
              (exclude: any) =>
                (typeof exclude === 'string' &&
                  exclude.includes('universal') &&
                  exclude.includes('async_storage')) ||
                (exclude instanceof RegExp &&
                  exclude.source.includes('universal') &&
                  exclude.source.includes('async_storage')),
            );

            if (!hasExclude) {
              rule.exclude.push(asyncStoragePattern);
            }
          }
        }

        // Ensure module.rules is an array
        if (!Array.isArray(config.module.rules)) {
          config.module.rules = [];
        }

        // Add rsc-common rule
        config.module.rules.push({
          resource: asyncStoragePattern,
          layer: 'rsc-common',
        });
      }
    });

    // 4. Add entry name virtual module for client-side entries
    api.modifyBundlerChain((chain, { isServer, isWebWorker }) => {
      if (!isServer && !isWebWorker) {
        const entries = chain.entryPoints.entries();
        for (const entryName of Object.keys(entries)) {
          const entryPoint = chain.entry(entryName);
          const code = `window.__MODERN_JS_ENTRY_NAME="${entryName}";`;
          entryPoint.add(createVirtualModule(code));
        }
      }
    });
  },
});

export async function parseConfig(
  builderConfig: BuilderConfig,
  options: CreateBuilderCommonOptions,
): Promise<{
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
}> {
  builderConfig.performance ??= {};
  builderConfig.performance.buildCache ??= true;

  const { rsbuildConfig, rsbuildPlugins } = await parseCommonConfig(
    builderConfig,
    options,
  );

  const { sri } = builderConfig.security || {};
  if (sri) {
    if (sri === true) {
      rsbuildConfig.security!.sri = {
        enable: 'auto',
      };
    } else {
      const algorithm = Array.isArray(sri.hashFuncNames)
        ? (sri.hashFuncNames[0] as 'sha256' | 'sha384' | 'sha512')
        : undefined;

      rsbuildConfig.security!.sri = {
        enable: sri.enabled,
        algorithm,
      };
    }
  }

  if (Boolean(rsbuildConfig.tools!.lightningcssLoader) === false) {
    const { pluginPostcss } = await import('./plugins/postcss');
    rsbuildPlugins.push(
      pluginPostcss({ autoprefixer: builderConfig.tools?.autoprefixer }),
    );
  }

  const hasEnvironmentBabelConfig = Object.values(
    builderConfig.environments || {},
  ).some(c => c.tools?.babel !== undefined);

  if (hasEnvironmentBabelConfig) {
    const mergeSharedBabelConfig = (
      config: PluginBabelOptions['babelLoaderOptions'],
    ) => {
      if (builderConfig.tools?.babel) {
        return castArray(config).concat(
          ...castArray(builderConfig.tools?.babel),
        );
      }
      return config;
    };

    const { pluginBabel } = await import('@rsbuild/plugin-babel');
    const { pluginBabelPost } = await import('./plugins/babel-post');
    Object.entries(builderConfig.environments!).forEach(([name, config]) => {
      const environmentConfig = rsbuildConfig.environments?.[name];
      if (!environmentConfig) {
        return;
      }
      if (config.tools?.babel) {
        environmentConfig.plugins ??= [];
        environmentConfig.plugins.push(
          pluginBabel({
            babelLoaderOptions: mergeSharedBabelConfig(config.tools?.babel),
          }),
          pluginBabelPost(),
        );
      } else if (builderConfig.tools?.babel) {
        environmentConfig.plugins ??= [];
        environmentConfig.plugins.push(
          pluginBabel({
            babelLoaderOptions: builderConfig.tools?.babel,
          }),
          pluginBabelPost(),
        );
      }
    });
  } else if (builderConfig.tools?.babel) {
    const { pluginBabel } = await import('@rsbuild/plugin-babel');
    const { pluginBabelPost } = await import('./plugins/babel-post');
    rsbuildPlugins.push(
      pluginBabel({
        babelLoaderOptions: builderConfig.tools?.babel,
      }),
      pluginBabelPost(),
    );
  }

  const enableRsc = builderConfig.server?.rsc ?? false;
  if (enableRsc) {
    rsbuildPlugins.push(
      pluginRSC({
        layers: {
          rsc: [
            '/Users/bytedance/Desktop/workspace/modern.js/tests/integration/rsc-ssr-app/node_modules/.modern-js/server-component-root/AppProxy.jsx',
            '/Users/bytedance/Desktop/workspace/modern.js/tests/integration/rsc-ssr-app/node_modules/.modern-js/client-component-root/AppProxy.jsx',
            /render[/\\].*[/\\]server[/\\]rsc/,
            /AppProxy/,
          ],
        },
      }),
    );
  }

  // Add unified RSC configuration plugin
  rsbuildPlugins.push(pluginRscConfig());

  return {
    rsbuildConfig,
    rsbuildPlugins,
  };
}

export type BuilderInstance = RsbuildInstance;

export async function createRspackBuilder(
  options: CreateBuilderOptions,
): Promise<BuilderInstance> {
  const { cwd = process.cwd(), config, ...rest } = options;

  const { rsbuildConfig, rsbuildPlugins } = await parseConfig(config, {
    ...rest,
    cwd,
  });

  // builder plugins should be registered earlier than user plugins
  rsbuildConfig.plugins = [...rsbuildPlugins, ...(rsbuildConfig.plugins || [])];

  const rsbuild = await createRsbuild({
    cwd,
    rsbuildConfig,
  });

  return {
    ...rsbuild,
  };
}
