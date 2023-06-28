import { mergeWith } from '@modern-js/utils/lodash';
import { ROUTE_MANIFEST_FILE } from '@modern-js/utils';
import { ROUTE_MANIFEST } from '@modern-js/utils/universal/constants';
import type { webpack } from '@modern-js/builder-webpack-provider';
import type { Rspack } from '@modern-js/builder-rspack-provider';

const PLUGIN_NAME = 'ModernjsRoutePlugin';

export interface RouteAssets {
  [routeId: string]: {
    chunkIds?: (string | number)[];
    assets?: string[];
    referenceCssAssets?: string[];
  };
}

export class RouterPlugin {
  apply(compiler: Rspack.Compiler | webpack.Compiler) {
    const { target } = compiler.options;
    if (
      target === 'node' ||
      (Array.isArray(target) && target.includes('node'))
    ) {
      return;
    }

    if (
      target === 'webworker' ||
      (Array.isArray(target) && target.includes('webworker'))
    ) {
      return;
    }

    const { webpack } = compiler;
    const { Compilation, sources } = webpack;
    const { RawSource, SourceMapSource } = sources;
    const { PROCESS_ASSETS_STAGE_ADDITIONS } = Compilation;

    const normalizePath = (path: string): string => {
      if (!path.endsWith('/')) {
        return `${path}/`;
      }

      return path;
    };

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, compilation => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: PLUGIN_NAME,
          stage: PROCESS_ASSETS_STAGE_ADDITIONS,
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

          for (const file of entryChunkFiles) {
            const asset = compilation.assets[file];
            // it may be removed by InlineChunkHtmlPlugin
            if (!asset) {
              continue;
            }
            if (asset.sourceAndMap) {
              const { source, map } = asset.sourceAndMap();
              const newContent = `${injectedContent}${source.toString()}`;
              const newSource = new SourceMapSource(
                newContent,
                file,
                map,
                source.toString(),
                map,
              );

              compilation.updateAsset(
                file,
                newSource,
                // FIXME: The arguments third of updatgeAsset is a optional function in webpack.
                undefined as any,
              );
            } else {
              const newContent = `${injectedContent}${asset
                .source()
                .toString()}`;

              compilation.updateAsset(
                file,
                new RawSource(newContent),
                // FIXME: The arguments third of updatgeAsset is a optional function in webpack.
                undefined as any,
              );
            }
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
