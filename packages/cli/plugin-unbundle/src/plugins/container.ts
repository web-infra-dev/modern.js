/**
 * modified from wmr and vite's rollup plugin container,
 * https://github.com/preactjs/wmr/blob/main/packages/wmr/src/lib/rollup-plugin-container.js
 * https://github.com/vitejs/vite/blob/main/packages/vite/src/node/server/pluginContainer.ts
 *
 */

/**
https://github.com/preactjs/wmr/blob/master/LICENSE

MIT License
Copyright (c) 2020 The Preact Authors
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/**
https://github.com/vitejs/vite/blob/main/LICENSE

MIT License

Copyright (c) 2019-present, Yuxi (Evan) You and Vite contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

import { VERSION as rollupVersion } from 'rollup';
import type {
  Plugin as RollupPlugin,
  InputOptions,
  ResolveIdResult,
  LoadResult,
  PluginContext,
  ResolvedId,
  RollupError,
  NormalizedInputOptions,
  ChangeEvent,
  PartialResolvedId,
  SourceDescription,
  SourceMap,
} from 'rollup';
import { Parser } from 'acorn';
import acornClassFields from 'acorn-class-fields';
import mergeSourceMap from 'merge-source-map';
import { chalk, createDebugger, signale as logger } from '@modern-js/utils';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';

const debug = createDebugger('esm:plugin-container');

function identifierPair(id: string, importer: string | undefined) {
  if (importer) {
    return `${id}\n${importer}`;
  }
  return id;
}

export interface PluginContainer {
  ctx: PluginContainerContext;
  options: InputOptions;
  buildStart: (options: InputOptions) => Promise<void>;
  watchChange: (id: string) => void;
  closeWatcher: () => void;
  // resolveImportMeta(property: string): string | null
  resolveId: (
    id: string,
    importer?: string,
    _skip?: RollupPlugin[],
  ) => Promise<ResolveIdResult>;
  transform: (code: string, id: string) => Promise<SourceDescription | null>;
  load: (id: string) => Promise<LoadResult>;
}

export type PluginContainerContext = Omit<
  PluginContext,
  | 'cache'
  // deprecated
  | 'emitAsset'
  | 'emitChunk'
  | 'getAssetFileName'
  | 'getChunkFileName'
  | 'isExternal'
  | 'moduleIds'
  | 'resolveId'
  | 'load'
>;

export const createPluginContainer = async (
  plugins: RollupPlugin[],
  _userConfig: NormalizedConfig,
  appContext: IAppContext,
) => {
  const { appDirectory } = appContext;

  const rollupOptions = {};

  const MODULES = new Map();

  let parser = Parser;

  let plugin: RollupPlugin;

  const watchFiles = new Set<string>();

  function warnIncompatibleMethod(method: string, plugin: string) {
    logger.warn(
      chalk.cyan(`[plugin:${plugin}] `) +
        chalk.yellow(
          `context method ${chalk.bold(
            `${method}()`,
          )} is not supported in serve mode. This plugin is likely not modern-js compatible.`,
        ),
    );
  }

  // Tracks recursive resolveId calls
  const resolveSkips = {
    skip: new Map(),
    has(plugin: RollupPlugin, key: string) {
      const skips = this.skip.get(plugin);
      return skips ? skips.includes(key) : false;
    },
    add(plugin: RollupPlugin, key: string) {
      const skips = this.skip.get(plugin);
      if (skips) {
        skips.push(key);
      } else {
        this.skip.set(plugin, [key]);
      }
    },
    delete(plugin: RollupPlugin, key: string) {
      const skips = this.skip.get(plugin);
      if (!skips) {
        return;
      }
      const i = skips.indexOf(key);
      if (i !== -1) {
        skips.splice(i, 1);
      }
    },
  };

  const ctx: PluginContainerContext = {
    meta: {
      rollupVersion,
      watchMode: true,
    },
    parse(code, opts) {
      return parser.parse(code, {
        sourceType: 'module',
        ecmaVersion: 2020,
        locations: true,
        onComment: [],
        ...opts,
      });
    },
    async resolve(
      id: string,
      importer?: string,
      options?: { skipSelf?: boolean },
    ) {
      const skip = [];
      if (options?.skipSelf && plugin) {
        skip.push(plugin);
      }
      let out = await container.resolveId(id, importer, skip);

      if (typeof out === 'string') {
        out = { id: out };
      }
      if (!out || !out.id) {
        out = { id };
      }

      return (out as ResolvedId) || null;
    },
    getModuleInfo(id) {
      let mod = MODULES.get(id);
      if (mod) {
        return mod.info;
      }
      mod = { info: {} };
      MODULES.set(id, mod);
      return mod.info;
    },
    emitFile() {
      warnIncompatibleMethod(`emitFile`, '');
      return '';
    },
    setAssetSource() {
      warnIncompatibleMethod(`emitFile`, '');
    },
    getFileName() {
      warnIncompatibleMethod(`emitFile`, '');
      return '';
    },
    addWatchFile(id) {
      watchFiles.add(id);
    },
    warn(...args) {
      logger.warn(`[${plugin.name}]`, ...args);
    },
    error(err: string | RollupError): never {
      if (typeof err === 'string') {
        err = { message: err };
      }
      if (err.code && err.code !== `PLUGIN_ERROR`) {
        err.pluginCode = err.code;
      }
      err.code = `PLUGIN_ERROR`;
      err.plugin = plugin.name;

      // TODO: err
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw err;
    },
    getModuleIds() {
      return MODULES.keys();
    },
    getWatchFiles() {
      return [...Array.from(watchFiles)];
    },
  };

  const container: PluginContainer = {
    ctx,
    options: await (async () => {
      let options = rollupOptions;
      for (const plugin of plugins) {
        if (!plugin.options) {
          continue;
        }
        options = (await plugin.options.call(ctx, options)) || options;
      }

      if ((options as any).acornInjectPlugins) {
        parser = Parser.extend(
          ...[acornClassFields].concat((options as any).acornInjectPlugins),
        );
      }
      return options;
    })(),

    async buildStart() {
      await Promise.all(
        // eslint-disable-next-line array-callback-return
        plugins.map(plugin => {
          if (plugin.buildStart) {
            plugin.buildStart.call(
              ctx as any,
              container.options as NormalizedInputOptions,
            );
          }
        }),
      );
    },

    watchChange(id: string, event = 'update') {
      if (watchFiles.has(id)) {
        for (plugin of plugins) {
          if (!plugin.watchChange) {
            continue;
          }
          plugin.watchChange.call(ctx as any, id, {
            event: event as ChangeEvent,
          });
        }
      }
    },

    closeWatcher() {
      for (plugin of plugins) {
        if (!plugin.closeWatcher) {
          continue;
        }
        plugin.closeWatcher.call(ctx as any);
      }
    },

    async resolveId(
      id: string,
      importer: string = appDirectory,
      _skip?: RollupPlugin[],
    ) {
      const key = identifierPair(id, importer);

      const opts: Partial<PartialResolvedId> = {};
      for (const p of plugins) {
        if (!p.resolveId) {
          continue;
        }

        if (_skip) {
          if (_skip.includes(p)) {
            continue;
          }
          // if (resolveSkips.has(p, key)) {
          //   continue;
          // }
          // resolveSkips.add(p, key);
        }
        plugin = p;
        let result;
        try {
          result = await p.resolveId.call(ctx as any, id, importer, {} as any);
        } finally {
          if (_skip) {
            resolveSkips.delete(p, key);
          }
        }
        if (!result) {
          continue;
        }
        if (typeof result === 'string') {
          id = result;
        } else {
          id = result.id;
          Object.assign(opts, result);
        }

        debug(
          `  ${
            chalk.dim('plugin:') + chalk.bold(chalk.yellow(p.name))
          }  ${JSON.stringify(id)}`,
        );

        // resolveId() is hookFirst - first non-null result is returned.
        break;
      }

      opts.id = id;

      return Object.keys(opts).length > 1 ? (opts as PartialResolvedId) : id;
    },

    async transform(code: string, id: string) {
      const maps = [];
      for (plugin of plugins) {
        if (!plugin.transform) {
          continue;
        }
        const result = await plugin.transform.call(ctx as any, code, id);
        if (!result) {
          continue;
        }
        if (typeof result === 'object') {
          code = result.code || '';
          if (result.map) {
            maps.push(result.map);
          }
        } else {
          code = result;
        }
      }

      return {
        code,
        map: maps.reduce((prevMap, nextMap) => {
          if (typeof nextMap === 'string') {
            nextMap = JSON.parse(nextMap);
          }

          return mergeSourceMap(
            prevMap,
            prevMap
              ? {
                  ...(nextMap as SourceMap),
                  sourcesContent: (prevMap as SourceMap).sourcesContent,
                }
              : nextMap,
          );
        }, undefined),
      };
    },

    async load(id) {
      for (plugin of plugins) {
        if (!plugin.load) {
          continue;
        }
        const result = await plugin.load.call(ctx as any, id);
        if (result) {
          return result;
        }
      }
      return null;
    },
  };

  return container;
};
