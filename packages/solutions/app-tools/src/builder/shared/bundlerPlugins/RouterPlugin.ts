import path from 'path';
import type Buffer from 'buffer';
import { mergeWith } from '@modern-js/utils/lodash';
import { ROUTE_MANIFEST_FILE } from '@modern-js/utils';
import { ROUTE_MANIFEST } from '@modern-js/utils/universal/constants';
import type { webpack } from '@modern-js/builder-webpack-provider';
import { Loader, transform } from 'esbuild';
import type { Rspack } from '@modern-js/builder-rspack-provider';

const PLUGIN_NAME = 'ModernjsRoutePlugin';

export interface RouteAssets {
  [routeId: string]: {
    chunkIds?: (string | number)[];
    assets?: string[];
    referenceCssAssets?: string[];
  };
}

type Compiler = webpack.Compiler | Rspack.Compiler;

export class RouterPlugin {
  private isTargetNodeOrWebWorker(target: Compiler['options']['target']) {
    if (
      target === 'node' ||
      (Array.isArray(target) && target.includes('node'))
    ) {
      return true;
    }

    if (
      target === 'webworker' ||
      (Array.isArray(target) && target.includes('webworker'))
    ) {
      return true;
    }
    return false;
  }

  apply(compiler: Compiler) {
    const { target } = compiler.options;
    if (this.isTargetNodeOrWebWorker(target)) {
      return;
    }

    const { webpack } = compiler;
    const { Compilation, sources } = webpack;
    const { RawSource, SourceMapSource } = sources;

    const normalizePath = (path: string): string => {
      if (!path.endsWith('/')) {
        return `${path}/`;
      }

      return path;
    };

    const chunkToSourceAndMap: Map<
      string | number,
      {
        source: string | Buffer;
        map: unknown;
      }
    > = new Map();

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, compilation => {
      /**
       * We need to get the source-map in PROCESS_ASSETS_STAGE_DEV_TOOLING hook,
       * because we cant get the source-map in PROCESS_ASSETS_STAGE_REPORT hook,
       * and we need to get the stable hash in PROCESS_ASSETS_STAGE_REPORT hook.
       */
      compilation.hooks.processAssets.tapPromise(
        {
          name: PLUGIN_NAME,
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_COMPATIBILITY,
        },
        async () => {
          const stats = compilation.getStats().toJson({
            all: false,
            chunkGroups: true,
            chunks: true,
            ids: true,
          });
          const { chunks = [], namedChunkGroups } = stats;

          if (!namedChunkGroups) {
            return;
          }

          const entrypointsArray = Array.from(
            compilation.entrypoints.entries() as IterableIterator<
              [string, unknown]
            >,
          );
          const entryChunkIds = entrypointsArray.map(
            entrypoint => entrypoint[0],
          );
          const entryChunks = [...chunks].filter(chunk => {
            return chunk.names?.some(name => entryChunkIds.includes(name));
          });
          const entryChunkFiles = entryChunks.map(
            chunk =>
              [...(chunk.files || [])].find(fname => fname.includes('.js'))!,
          );

          const entryChunkFileIds = entryChunks.map(chunk => chunk.id);
          for (let i = 0; i <= entryChunkFiles.length - 1; i++) {
            const file = entryChunkFiles[i];
            const chunkId = entryChunkFileIds[i];
            const asset = compilation.assets[file];
            if (!asset) {
              continue;
            }

            const { source, map } = asset.sourceAndMap();
            chunkToSourceAndMap.set(chunkId!, {
              source,
              map,
            });
          }
        },
      );

      compilation.hooks.processAssets.tapPromise(
        {
          name: PLUGIN_NAME,
          stage: Compilation.PROCESS_ASSETS_STAGE_REPORT,
        },
        async () => {
          const stats = compilation.getStats().toJson({
            all: false,
            publicPath: true,
            assets: true,
            chunkGroups: true,
            chunks: true,
            ids: true,
          });
          const { publicPath, chunks = [], namedChunkGroups } = stats;
          const routeAssets: RouteAssets = {};

          if (!namedChunkGroups) {
            return;
          }

          const prevManifestAsset = compilation.getAsset(ROUTE_MANIFEST_FILE);
          const prevManifestStr = prevManifestAsset
            ? prevManifestAsset.source.source().toString()
            : JSON.stringify({ routeAssets: {} });
          const prevManifest: { routeAssets: RouteAssets } =
            JSON.parse(prevManifestStr);

          for (const [name, chunkGroup] of Object.entries(namedChunkGroups)) {
            type ChunkGroupLike = {
              assets: { name: string; [prop: string]: any }[];
              [prop: string]: any;
            };

            const assets = (chunkGroup as ChunkGroupLike).assets.map(asset => {
              const filename = asset.name;
              return publicPath
                ? normalizePath(publicPath) + filename
                : filename;
            });
            const referenceCssAssets = assets.filter(asset =>
              /\.css$/.test(asset),
            );
            routeAssets[name] = {
              chunkIds: chunkGroup.chunks,
              assets,
              referenceCssAssets,
            };

            if (prevManifest.routeAssets[name]) {
              mergeWith(
                routeAssets[name],
                prevManifest.routeAssets[name],
                (obj, source) => {
                  if (Array.isArray(obj)) {
                    return obj.concat(source);
                  }
                  return Object.assign(source, obj);
                },
              );
            }
          }

          const manifest = {
            routeAssets,
          };

          const entrypointsArray = Array.from(
            compilation.entrypoints.entries() as IterableIterator<
              [string, unknown]
            >,
          );
          const entryChunkIds = entrypointsArray.map(
            entrypoint => entrypoint[0],
          );
          const entryChunks = [...chunks].filter(chunk => {
            return chunk.names?.some(name => entryChunkIds.includes(name));
          });
          const entryChunkFiles = entryChunks.map(
            chunk =>
              [...(chunk.files || [])].find(fname => fname.includes('.js'))!,
          );

          const entryChunkFileIds = entryChunks.map(chunk => chunk.id);
          for (let i = 0; i <= entryChunkFiles.length - 1; i++) {
            const file = entryChunkFiles[i];
            const chunkId = entryChunkFileIds[i];
            const asset = compilation.assets[file];
            // it may be removed by InlineChunkHtmlPlugin
            if (!asset || !chunkId) {
              continue;
            }

            const relatedAssets: typeof routeAssets = {};
            Object.keys(routeAssets).forEach(routeId => {
              if (routeId.startsWith(`${chunkId}_`)) {
                relatedAssets[routeId] = routeAssets[routeId];
              }
            });

            const manifest = { routeAssets: relatedAssets };

            const injectedContent = `
            ;(function(){
              window.${ROUTE_MANIFEST} = ${JSON.stringify(manifest, (k, v) => {
              if (
                (k === 'assets' || k === 'referenceCssAssets') &&
                Array.isArray(v)
              ) {
                // should hide publicPath in browser
                return v.map(item => {
                  return item.replace(publicPath, '');
                });
              }
              return v;
            })};
            })();
          `;

            const { source, map } = chunkToSourceAndMap.get(chunkId)!;
            const newContent = `${injectedContent}${source.toString()}`;

            const result = await transform(newContent, {
              loader: path.extname(file).slice(1) as Loader,
              format: 'esm',
              sourcemap: true,
            });

            const newSource = new SourceMapSource(
              result.code,
              file,
              result.map,
              source.toString(),
              map,
            );

            compilation.updateAsset(
              file,
              newSource,
              // FIXME: The arguments third of updatgeAsset is a optional function in webpack.
              undefined as any,
            );
          }

          if (prevManifestAsset) {
            compilation.updateAsset(
              ROUTE_MANIFEST_FILE,
              new RawSource(JSON.stringify(manifest, null, 2)),
              // FIXME: The arguments third of updatgeAsset is a optional function in webpack.
              undefined as any,
            );
          } else {
            compilation.emitAsset(
              ROUTE_MANIFEST_FILE,
              new RawSource(JSON.stringify(manifest, null, 2)),
            );
          }
        },
      );
    });
  }
}
