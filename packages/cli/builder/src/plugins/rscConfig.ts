import path from 'path';
import type { RsbuildPlugin, Rspack } from '@rsbuild/core';

// Constants for RSC configuration
const ASYNC_STORAGE_PATTERN = /universal[/\\]async_storage/;
const RSC_COMMON_LAYER = 'rsc-common';
const ENTRY_NAME_VAR = '__MODERN_JS_ENTRY_NAME';

const createVirtualModule = (content: string) =>
  `data:text/javascript,${encodeURIComponent(content)}`;

const isAsyncStorageExclude = (exclude: unknown) => {
  if (typeof exclude === 'string') {
    return ASYNC_STORAGE_PATTERN.test(exclude);
  }
  if (exclude instanceof RegExp) {
    // Check semantic equivalence instead of relying on `source` string matching
    return (
      exclude.test('universal/async_storage') ||
      exclude.test('universal\\async_storage')
    );
  }
  return false;
};

/**
 * Unified plugin for RSC (React Server Components) configuration
 * Handles:
 * 1. Adding layer configuration to server-side entries
 * 2. Excluding /universal[/\\]async_storage/ from react-server-components layer
 * 3. Adding rsc-common layer for /universal[/\\]async_storage/
 * 4. Adding entry name virtual module for client-side entries
 * 5. Adding 'use server-entry' directive to route components
 */
export function pluginRscConfig(): RsbuildPlugin {
  return {
    name: 'builder:rsc-config',
    setup(api) {
      // Cache for dynamically imported Layers to avoid multiple imports
      let layersCache: { ssr: string; rsc: string } | null = null;
      const getLayers = async () => {
        if (!layersCache) {
          // Dynamically import Layers to avoid CJS -> ESM require() issue
          // rsbuild-plugin-rsc is a pure ESM module (type: "module")
          // Static import in CJS code causes issues in e2e test environments
          const { Layers } = await import('rsbuild-plugin-rsc');
          layersCache = Layers;
        }
        return layersCache;
      };

      // Add 'use server-entry' directive to route components
      // Match:
      // 1. layout.[tj]sx, page.[tj]sx, and $.[tj]sx files in routes directory (conventional routing)
      // 2. App.[tj]sx files anywhere (self-controlled routing)
      api.modifyBundlerChain({
        handler: (chain, { isServer }) => {
          if (isServer) {
            // Pattern 1: Match route files in routes directory (conventional routing)
            // Matches: layout.tsx, layout.ts, layout.jsx, layout.js
            //         page.tsx, page.ts, page.jsx, page.js
            //         $.tsx, $.ts, $.jsx, $.js
            // Use [/\\] before filename so both Unix (/) and Windows (\) paths match
            const routeFilePattern =
              /[/\\]routes[/\\](?:.*[/\\])?(?:layout|page|\$)\.[tj]sx?$/;

            // Pattern 2: Match App.[tj]sx files anywhere (self-controlled routing)
            // Matches: App.tsx, App.ts, App.jsx, App.js in any directory
            // Note: node_modules is already excluded by the exclude rule
            const appFilePattern = /[/\\]App\.[tj]sx?$/;

            // Combine both patterns
            const combinedPattern = new RegExp(
              `(${routeFilePattern.source}|${appFilePattern.source})`,
            );

            // Use path.resolve to handle both TypeScript source and compiled JavaScript
            // Try require.resolve first, fallback to path.resolve if it fails
            let loaderPath: string;
            try {
              loaderPath = require.resolve(
                '../shared/rsc/rsc-server-entry-loader',
              );
            } catch {
              // Fallback for test environments where require.resolve may not work with TS files
              loaderPath = path.resolve(
                __dirname,
                '../shared/rsc/rsc-server-entry-loader',
              );
            }

            chain.module
              .rule('rsc-server-entry')
              .test(/\.(tsx?|jsx?)$/)
              .resource(combinedPattern)
              .exclude.add(/node_modules/)
              .end()
              .use('rsc-server-entry-loader')
              .loader(loaderPath)
              .end();
          }
        },
        // Use 'pre' order to ensure it runs before other loaders process the files
        order: 'pre',
      });

      api.modifyRspackConfig(async (config, utils) => {
        // Check if this is a server build by checking target or environment name
        const isServer =
          config.target === 'node' ||
          utils.target === 'node' ||
          utils.environment?.name === 'server';

        if (!isServer) {
          return;
        }

        // Dynamically import Layers to avoid CJS -> ESM require() issue
        const Layers = await getLayers();

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
                layer: Layers.ssr,
              };
            } else if (Array.isArray(entryValue)) {
              newEntries[entryName] = {
                import: entryValue,
                layer: Layers.ssr,
              };
            } else if (typeof entryValue === 'object' && entryValue !== null) {
              // If already an object, add or update layer
              newEntries[entryName] = {
                ...entryValue,
                layer: Layers.ssr,
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
          const rules = config.module.rules as Rspack.RuleSetRule[];

          // Find and modify rules that have layer: 'react-server-components'
          for (const rule of rules) {
            // Check if this rule has layer: 'react-server-components'
            if (rule.layer === Layers.rsc) {
              // Add exclude to the rule
              if (!rule.exclude) {
                rule.exclude = [];
              } else if (!Array.isArray(rule.exclude)) {
                rule.exclude = [rule.exclude];
              }

              // Check if the exclude pattern already exists
              const hasExclude = rule.exclude.some(isAsyncStorageExclude);

              if (!hasExclude) {
                rule.exclude.push(ASYNC_STORAGE_PATTERN);
              }
            }
          }

          // Ensure module.rules is an array
          if (!Array.isArray(config.module.rules)) {
            config.module.rules = [];
          }

          // Add rsc-common rule
          config.module.rules.push({
            resource: ASYNC_STORAGE_PATTERN,
            layer: RSC_COMMON_LAYER,
          });
        }
      });

      // 4. Add entry name virtual module for client-side entries
      api.modifyBundlerChain((chain, { isServer, isWebWorker }) => {
        if (!isServer && !isWebWorker) {
          const entries = chain.entryPoints.entries();
          if (entries && typeof entries === 'object') {
            for (const entryName of Object.keys(entries)) {
              const entryPoint = chain.entry(entryName);
              const code = `window.${ENTRY_NAME_VAR}="${entryName}";`;
              entryPoint.add(createVirtualModule(code));
            }
          }
        }
      });
    },
  };
}

/**
 * Get RSC plugins based on configuration
 * @param enableRsc - Whether RSC is enabled
 * @param internalDirectory - Internal directory path for route matching
 * @returns Array of RSC-related plugins
 */
export async function getRscPlugins(
  enableRsc: boolean,
  internalDirectory: string,
): Promise<RsbuildPlugin[]> {
  if (enableRsc) {
    const routesFileReg = new RegExp(
      `${internalDirectory.replace(/[/\\]/g, '[/\\\\]')}[/\\\\][^/\\\\]*[/\\\\]routes`,
    );
    // Dynamically import pluginRSC to avoid CJS -> ESM require() issue(e2e test cases in CI)
    // rsbuild-plugin-rsc is a pure ESM module (type: "module")
    // Static import in CJS code causes issues in e2e test environments
    const { pluginRSC } = await import('rsbuild-plugin-rsc');
    return [
      pluginRSC({
        layers: {
          rsc: [/render[/\\].*[/\\]server[/\\]rsc/, /AppProxy/, routesFileReg],
        },
      }),
      pluginRscConfig(),
    ];
  }
  return [];
}
