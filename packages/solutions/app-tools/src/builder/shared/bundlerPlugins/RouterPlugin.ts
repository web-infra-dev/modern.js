import { createHash } from 'crypto';
import { mergeWith } from '@modern-js/utils/lodash';
import { ROUTE_MANIFEST_FILE } from '@modern-js/utils';
import { ROUTE_MANIFEST } from '@modern-js/utils/universal/constants';
import type { webpack } from '@modern-js/builder-webpack-provider';
import type { Rspack } from '@modern-js/builder-rspack-provider';
import type HtmlWebpackPlugin from '@modern-js/builder-webpack-provider/html-webpack-plugin';
import type { ScriptLoading } from '@modern-js/builder-shared';

const PLUGIN_NAME = 'ModernjsRoutePlugin';

export interface RouteAssets {
  [routeId: string]: {
    chunkIds?: (string | number)[];
    assets?: string[];
    referenceCssAssets?: string[];
  };
}

type Compiler = webpack.Compiler | Rspack.Compiler;
type Compilation = webpack.Compilation | Rspack.Compilation;
type Chunks = webpack.StatsChunk[];

type Options = {
  HtmlBundlerPlugin: typeof HtmlWebpackPlugin;
  staticJsDir: string;
  enableInlineRouteManifests: boolean;
  disableFilenameHash?: boolean;
  scriptLoading?: ScriptLoading;
};

const generateContentHash = (content: string) => {
  return createHash('md5').update(content).digest('hex').slice(0, 8);
};

export class RouterPlugin {
  private HtmlBundlerPlugin: typeof HtmlWebpackPlugin;

  private enableInlineRouteManifests: boolean;

  private staticJsDir: string;

  private disableFilenameHash?: boolean;

  private scriptLoading?: ScriptLoading;

  constructor({
    staticJsDir = 'static/js',
    HtmlBundlerPlugin,
    enableInlineRouteManifests,
    disableFilenameHash = false,
    scriptLoading = 'defer',
  }: Options) {
    this.HtmlBundlerPlugin = HtmlBundlerPlugin;
    this.enableInlineRouteManifests = enableInlineRouteManifests;
    this.staticJsDir = staticJsDir;
    this.disableFilenameHash = disableFilenameHash;
    this.scriptLoading = scriptLoading;
  }

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

  private getEntryChunks(compilation: Compilation, chunks: Chunks) {
    const entrypointsArray = Array.from(
      compilation.entrypoints.entries() as IterableIterator<[string, unknown]>,
    );
    const entryChunkIds = entrypointsArray.map(entrypoint => entrypoint[0]);
    const entryChunks = [...chunks].filter(chunk => {
      return chunk.names?.some(name => entryChunkIds.includes(name));
    });
    return entryChunks;
  }

  private getEntryChunkFiles(entryChunks: Chunks) {
    return entryChunks.map(
      chunk => [...(chunk.files || [])].find(fname => fname.includes('.js'))!,
    );
  }

  apply(compiler: Compiler) {
    const { target } = compiler.options;
    if (this.isTargetNodeOrWebWorker(target)) {
      return;
    }

    const { webpack } = compiler;
    const { Compilation, sources } = webpack;
    const { RawSource } = sources;

    const normalizePath = (path: string): string => {
      if (!path.endsWith('/')) {
        return `${path}/`;
      }

      return path;
    };

    const chunksToHtmlName = new Map();
    const ROUTE_MANIFEST_HOLDER = `route-manifest`;
    const placeholder = `<!--<?- ${ROUTE_MANIFEST_HOLDER} ?>-->`;

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, compilation => {
      this.HtmlBundlerPlugin.getHooks(
        compilation as webpack.Compilation,
      ).beforeEmit.tapAsync('RouterManifestPlugin', (data, callback) => {
        const { outputName } = data;
        const { chunks } = data.plugin.options!;
        chunksToHtmlName.set(chunks, outputName);

        data.html = data.html.replace('</script>', `</script>${placeholder}`);
        callback(null, data);
      });

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
          const {
            publicPath,
            chunks = [],
            namedChunkGroups,
          } = stats as webpack.StatsCompilation;
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

          const entryNames = Array.from(compilation.entrypoints.keys());
          const entryChunks = this.getEntryChunks(compilation, chunks);
          const entryChunkFiles = this.getEntryChunkFiles(entryChunks);

          const entryChunkFileIds = entryChunks.map(chunk => chunk.id);
          for (let i = 0; i < entryChunkFiles.length; i++) {
            const entryName = entryNames[i];
            const file = entryChunkFiles[i];
            const chunkNames = entryChunks[i].names;
            const chunkId = entryChunkFileIds[i];
            const asset = compilation.assets[file];
            // it may be removed by InlineChunkHtmlPlugin
            if (!asset || !chunkId) {
              continue;
            }

            let relatedAssets: typeof routeAssets = {};
            if (entryChunkFiles.length > 1) {
              Object.keys(routeAssets).forEach(routeId => {
                const segments = routeId.split('_');
                const chunkName = segments[0];
                if (chunkNames?.includes(chunkName)) {
                  relatedAssets[routeId] = routeAssets[routeId];
                }
              });
            } else {
              relatedAssets = routeAssets;
            }

            const manifest = { routeAssets: relatedAssets };

            const injectedContent = `
            ;(function(){
              window.${ROUTE_MANIFEST} = ${JSON.stringify(manifest, (k, v) => {
              if (
                (k === 'assets' || k === 'referenceCssAssets') &&
                Array.isArray(v)
              ) {
                return v.map(item => {
                  return item.replace(publicPath, '');
                });
              }
              return v;
            })};
            })();
          `;

            let htmlName;
            for (const [chunks, name] of chunksToHtmlName.entries()) {
              if (
                Array.isArray(chunkNames) &&
                Array.isArray(chunks) &&
                chunkNames.every((value, index) => value === chunks[index])
              ) {
                htmlName = name;
                break;
              }
            }

            const oldHtml = compilation.assets[htmlName];
            const {
              enableInlineRouteManifests,
              disableFilenameHash,
              staticJsDir,
              scriptLoading,
            } = this;
            if (enableInlineRouteManifests) {
              compilation.updateAsset(
                htmlName,
                new RawSource(
                  oldHtml
                    .source()
                    .toString()
                    .replace(
                      placeholder,
                      `<script>${injectedContent}</script>`,
                    ),
                ),
                // FIXME: The arguments third of updatgeAsset is a optional function in webpack.
                undefined as any,
              );
            } else {
              const scriptPath = `${staticJsDir}/${ROUTE_MANIFEST_HOLDER}-${entryName}${
                disableFilenameHash
                  ? '.js'
                  : `.${generateContentHash(injectedContent)}.js`
              }`;

              const scriptUrl = `${publicPath}${scriptPath}`;
              const script =
                scriptLoading === 'defer' || this.scriptLoading === 'module'
                  ? `<script ${scriptLoading} src="${scriptUrl}"></script>`
                  : `<script src="${scriptUrl}"></script>`;
              compilation.updateAsset(
                htmlName,
                new RawSource(
                  oldHtml.source().toString().replace(placeholder, script),
                ),
                // FIXME: The arguments third of updatgeAsset is a optional function in webpack.
                undefined as any,
              );
              compilation.emitAsset(scriptPath, new RawSource(injectedContent));
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
