/**
 * The following code is modified based on
 * https://github.com/gregberge/loadable-components
 *
 * MIT Licensed
 * Author Greg Bergé
 * Copyright 2019 Greg Bergé
 * https://github.com/gregberge/loadable-components/blob/main/LICENSE
 */

// The Rspack stas & compilation lacks some fields, so `loadable-webpack-plugin` can not run normally in Rspack.
// So that we write a `loadable-bundler-plugin` based on it.

import path from 'path';
import type { Rspack } from '@modern-js/app-tools';
import { fs } from '@modern-js/utils';

interface LoadablePluginOptions {
  filename: string;
  path?: string;
  writeToDisk?: any;
  outputAsset?: boolean;
  chunkLoadingGlobal?: string;
}

type Compiler = Rspack.Compiler;

type Compilation = Rspack.Compilation;

const normalizeChunkId = (id: string | number | null | undefined) =>
  typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : id;

const normalizeChunkGroup = (
  group: Record<string, any>,
): Record<string, any> => ({
  ...group,
  chunks: (group.chunks || []).map(normalizeChunkId),
});

class LoadablePlugin {
  opts: LoadablePluginOptions;

  compiler: Compiler | null;

  constructor(
    {
      filename = 'loadable-stats.json',
      path,
      writeToDisk,
      outputAsset = true,
      chunkLoadingGlobal = '__LOADABLE_LOADED_CHUNKS__',
    }: LoadablePluginOptions = {
      filename: 'loadable-stats.json',
      outputAsset: true,
      chunkLoadingGlobal: '__LOADABLE_LOADED_CHUNKS__',
    },
  ) {
    this.opts = {
      filename,
      path,
      writeToDisk,
      outputAsset,
      chunkLoadingGlobal,
    };

    this.compiler = null;
  }

  apply(compiler: Compiler) {
    this.compiler = compiler;

    compiler.options.output.chunkLoadingGlobal = this.opts.chunkLoadingGlobal;

    if (this.opts.outputAsset || this.opts.writeToDisk) {
      compiler.hooks.make.tap(
        LoadablePlugin.name,
        (compilation: Compilation) => {
          compilation.hooks.processAssets.tap(
            {
              name: LoadablePlugin.name,
              stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
            },
            () => {
              const asset = this.handleEmit(compilation);
              if (asset) {
                compilation.emitAsset(this.opts.filename, asset as any);
              }
            },
          );
        },
      );
    }
  }

  handleEmit(compilation: Compilation) {
    const stats = compilation.getStats().toJson({
      all: false,
      assets: true,
      // rspack not support cachedAssets,
      cachedAssets: true,
      chunks: true,
      chunkGroups: true,
      entrypoints: true,
      // rspack not support chunkGroupChildren.
      chunkGroupChildren: true,
      hash: true,
      ids: true,
      outputPath: true,
      publicPath: true,
    } as any);

    const namedChunkGroups: Record<string, any> = {};
    for (const [name, group] of Object.entries(
      (stats as any).namedChunkGroups || {},
    )) {
      namedChunkGroups[name] = normalizeChunkGroup(group as any);
    }

    const entrypoints: Record<string, any> = {};
    for (const [name, ep] of Object.entries((stats as any).entrypoints || {})) {
      entrypoints[name] = normalizeChunkGroup(ep as any);
    }

    const output = {
      ...stats,
      namedChunkGroups,
      entrypoints,
      generator: 'loadable-components',
      chunks: [...(stats.chunks || [])].map(chunk => {
        return {
          id: normalizeChunkId(chunk.id),
          files: [...(chunk.files || [])],
        };
      }),
    };

    const result = JSON.stringify(output, null, 2);

    if (this.opts.writeToDisk) {
      this.writeAssetsFile(result);
    }
    if (this.opts.outputAsset) {
      return {
        source() {
          return result;
        },
        size() {
          return result.length;
        },
      };
    }

    return null;
  }

  writeAssetsFile(manifest: string) {
    const outputFolder = this.compiler?.options.output.path;
    const outputFile = path.resolve(outputFolder || '', this.opts.filename);

    fs.outputFileSync(outputFile, manifest);
  }
}

export default LoadablePlugin;
