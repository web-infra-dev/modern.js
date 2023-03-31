import path from 'path';
import { fs, logger } from '@modern-js/utils';
import { ROUTE_MANIFEST_FILE } from '@modern-js/utils/constants';
import { ROUTE_MANIFEST } from '@modern-js/utils/universal/constants';
import type { webpack } from '@modern-js/builder-webpack-provider';
import type { Rspack } from '@modern-js/builder-rspack-provider';

const PLUGIN_NAME = 'ModernjsRoutePlugin';

interface RouteAssets {
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
    const { RawSource } = sources;
    const { PROCESS_ASSETS_STAGE_REPORT } = Compilation;

    const outputPath = compiler.options.output.path!;
    const newAssetsMap = new Map<string, string>();

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
          stage: PROCESS_ASSETS_STAGE_REPORT,
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
          const { publicPath, chunks = [], assetsByChunkName } = stats;
          const routeAssets: RouteAssets = {};
          const { namedChunkGroups } = stats;

          if (!namedChunkGroups || !assetsByChunkName) {
            logger.warn(
              'Route manifest does not exist, performance will be affected',
            );
            return;
          }

          for (const [name, chunkGroup] of Object.entries(namedChunkGroups)) {
            type ChunkGroupLike = {
              assets: { name: string; [prop: string]: any }[];
              [prop: string]: any;
            };

            const referenceCssAssets = (chunkGroup as ChunkGroupLike).assets
              .filter(asset => /\.css$/.test(asset.name))
              .map(asset => {
                const item = asset.name;
                return publicPath ? normalizePath(publicPath) + item : item;
              });

            routeAssets[name] = {
              chunkIds: chunkGroup.chunks,
              assets: assetsByChunkName[name]?.map(item =>
                publicPath ? normalizePath(publicPath) + item : item,
              ),
              referenceCssAssets,
            };
          }

          const manifest = {
            routeAssets,
          };

          const injectedContent = `
            ;(function(){
              window.${ROUTE_MANIFEST} = ${JSON.stringify(manifest, (k, v) => {
            if (k === 'assets' && Array.isArray(v)) {
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
            const newContent = `${injectedContent}${asset.source().toString()}`;
            newAssetsMap.set(path.join(outputPath, file), newContent);
            compilation.updateAsset(
              file,
              new RawSource(newContent),
              // FIXME: The arguments third of updatgeAsset is a optional function in webpack.
              undefined as any,
            );
          }

          const filename = path.join(outputPath, ROUTE_MANIFEST_FILE);
          await fs.ensureFile(filename);
          await fs.writeFile(filename, JSON.stringify(manifest, null, 2));
        },
      );
    });
  }
}
