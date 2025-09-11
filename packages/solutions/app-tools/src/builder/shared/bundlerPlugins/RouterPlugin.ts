import { createHash } from 'crypto';
import type {
  HtmlWebpackPlugin,
  Rspack,
  webpack,
} from '@modern-js/uni-builder';
import { ROUTE_MANIFEST_FILE } from '@modern-js/utils';
import { merge, mergeWith } from '@modern-js/utils/lodash';
import { ROUTE_MANIFEST } from '@modern-js/utils/universal/constants';
import type { ScriptLoading } from '@rsbuild/core';

const PLUGIN_NAME = 'ModernjsRouterPlugin';
export const ROUTE_DEPS_COMPILATION_KEY = Symbol.for(
  `${PLUGIN_NAME}RouteSources`,
);

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
type StatsChunk = webpack.StatsChunk;
type StatsModule = webpack.StatsModule;

type Options = {
  HtmlBundlerPlugin: typeof HtmlWebpackPlugin;
  staticJsDir?: string;
  enableInlineRouteManifests: boolean;
  disableFilenameHash?: boolean;
  scriptLoading?: ScriptLoading;
  nonce?: string;
};

const generateContentHash = (content: string) => {
  return createHash('md5').update(content).digest('hex').slice(0, 8);
};

export class RouterPlugin {
  readonly name: string = 'RouterPlugin';

  private HtmlBundlerPlugin: typeof HtmlWebpackPlugin;

  private enableInlineRouteManifests: boolean;

  private staticJsDir: string;

  private disableFilenameHash?: boolean;

  private scriptLoading?: ScriptLoading;

  private nonce?: string;

  constructor({
    staticJsDir = 'static/js',
    HtmlBundlerPlugin,
    enableInlineRouteManifests,
    disableFilenameHash = false,
    scriptLoading = 'defer',
    nonce,
  }: Options) {
    this.HtmlBundlerPlugin = HtmlBundlerPlugin;
    this.enableInlineRouteManifests = enableInlineRouteManifests;
    this.staticJsDir = staticJsDir;
    this.disableFilenameHash = disableFilenameHash;
    this.scriptLoading = scriptLoading;
    this.nonce = nonce;
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
    const isRspack = 'rspackVersion' in webpack;
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
            modules: true,
            chunkModules: true,
          });
          const {
            publicPath,
            chunks = [],
            namedChunkGroups,
          } = stats as webpack.StatsCompilation;
          const routeAssets: RouteAssets = {};
          const route2Sources: Record<string, string[]> = {};

          if (!namedChunkGroups) {
            return;
          }

          const prevManifestAsset = compilation.getAsset(ROUTE_MANIFEST_FILE);
          const prevManifestStr = prevManifestAsset
            ? prevManifestAsset.source.source().toString()
            : JSON.stringify({ routeAssets: {} });
          const prevManifest: { routeAssets: RouteAssets } =
            JSON.parse(prevManifestStr);

          const asyncEntryNames = [];
          for (const [name, chunkGroup] of Object.entries(namedChunkGroups)) {
            if (name.startsWith('async-')) {
              asyncEntryNames.push(name);
            }

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

          // Ensure that the corresponding sync resources have been processed, so wo merge here
          if (asyncEntryNames.length > 0) {
            for (const asyncEntryName of asyncEntryNames) {
              const syncEntryName = asyncEntryName.replace('async-', '');
              const syncEntry = routeAssets[syncEntryName];
              const asyncEntry = routeAssets[asyncEntryName];
              merge(syncEntry, asyncEntry);
            }
          }

          const manifest = {
            routeAssets,
          };

          // Build dependencies using compilation chunkGroups and modules for better coverage
          try {
            const getChunkModules = (chunk: StatsChunk): StatsModule[] => {
              if (!chunk) return [];
              if (typeof chunk.getModules === 'function') {
                return chunk.getModules() || [];
              }
              const cg = (compilation as any).chunkGraph;
              if (cg && typeof cg.getChunkModules === 'function') {
                return cg.getChunkModules(chunk) || [];
              }
              return [];
            };

            const addModuleResources = (
              mod: StatsModule,
              bucket: Set<string>,
            ) => {
              if (!mod) return;
              if (mod.resource) {
                if (!/[\\/]node_modules[\\/]/.test(mod.resource)) {
                  bucket.add(mod.resource);
                }
              }
              if (Array.isArray(mod.modules)) {
                mod.modules.forEach(m => addModuleResources(m, bucket));
              }
            };

            const depsByName = new Map<string, Set<string>>();

            const namedGroups = compilation.namedChunkGroups;
            const groupNames =
              namedGroups && typeof namedGroups.forEach === 'function'
                ? (() => {
                    const names: string[] = [];
                    namedGroups.forEach((_: any, key: string) =>
                      names.push(key),
                    );
                    return names;
                  })()
                : Object.keys(namedChunkGroups || {});

            groupNames.forEach((name: string) => {
              const resourceSet = new Set<string>();
              const group =
                namedGroups && typeof namedGroups.get === 'function'
                  ? namedGroups.get(name)
                  : undefined;

              if (group && Array.isArray(group.chunks)) {
                group.chunks.forEach((chunk: any) => {
                  const modules = getChunkModules(chunk);
                  modules.forEach(m => addModuleResources(m, resourceSet));
                });
              } else {
                const matched: Chunks = Array.from(
                  ((compilation as any).chunks as unknown as Iterable<any>) ||
                    [],
                ).filter(c => c?.name === name || c?.names?.includes?.(name));
                matched.forEach(chunk => {
                  const modules = getChunkModules(chunk);
                  modules.forEach(m => addModuleResources(m, resourceSet));
                });
              }

              depsByName.set(name, resourceSet);
            });

            // Map to routeIds (keys of routeAssets)
            Object.keys(routeAssets).forEach(routeId => {
              const set = depsByName.get(routeId);
              if (set && set.size > 0) {
                route2Sources[routeId] = Array.from(set);
              }
            });

            // Merge async-* into sync route names similar to assets merging
            if (asyncEntryNames.length > 0) {
              for (const asyncEntryName of asyncEntryNames) {
                const syncEntryName = asyncEntryName.replace('async-', '');
                const asyncSet = depsByName.get(asyncEntryName);
                if (asyncSet && asyncSet.size > 0) {
                  const base = new Set<string>(
                    route2Sources[syncEntryName] || [],
                  );
                  asyncSet.forEach(v => base.add(v));
                  route2Sources[syncEntryName] = Array.from(base);
                }
              }
            }

            (compilation as any)[ROUTE_DEPS_COMPILATION_KEY] = route2Sources;

            // Also emit to dist for external consumption
            const ROUTE_SOURCE_MANIFEST_FILE = 'routes-source-manifest.json';
            const routeSourceManifest = { route2Sources: route2Sources };
            const existed = compilation.getAsset(ROUTE_SOURCE_MANIFEST_FILE);
            if (existed) {
              compilation.updateAsset(
                ROUTE_SOURCE_MANIFEST_FILE,
                new RawSource(
                  JSON.stringify(routeSourceManifest, null, 2),
                ) as any,
                undefined as any,
              );
            } else {
              compilation.emitAsset(
                ROUTE_SOURCE_MANIFEST_FILE,
                new RawSource(
                  JSON.stringify(routeSourceManifest, null, 2),
                ) as any,
              );
            }
          } catch {
            // swallow silently; do not block build if compilation shape is unexpected
          }

          const entryNames = Array.from(compilation.entrypoints.keys());
          let entryChunks = [];
          if (isRspack) {
            entryChunks = this.getEntryChunks(compilation, chunks);
          } else {
            const orignalEntryIds = Object.keys(compilation.options.entry).map(
              entryName => {
                const chunk = compilation.namedChunks.get(
                  entryName,
                ) as webpack.Chunk;
                if (chunk) {
                  return chunk.id;
                }
                return entryName;
              },
            );

            entryChunks = this.getEntryChunks(compilation, chunks).filter(
              chunk => orignalEntryIds.includes(chunk.id as string),
            );
          }

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
              nonce,
            } = this;

            const nonceAttr = nonce ? `nonce="${nonce}"` : '';

            if (oldHtml) {
              if (enableInlineRouteManifests) {
                compilation.updateAsset(
                  htmlName,
                  new RawSource(
                    oldHtml
                      .source()
                      .toString()
                      .replace(
                        placeholder,
                        `<script ${nonceAttr}>${injectedContent}</script>`,
                      ),
                  ) as any,
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

                const scriptLoadingAttr =
                  scriptLoading === 'defer'
                    ? scriptLoading
                    : scriptLoading === 'module'
                      ? `type="module"`
                      : '';

                const script = `<script ${scriptLoadingAttr} ${nonceAttr} src="${scriptUrl}"></script>`;

                compilation.updateAsset(
                  htmlName,
                  new RawSource(
                    oldHtml.source().toString().replace(placeholder, script),
                  ) as any,
                  // FIXME: The arguments third of updatgeAsset is a optional function in webpack.
                  undefined as any,
                );
                compilation.emitAsset(
                  scriptPath,
                  new RawSource(injectedContent) as any,
                );
              }
            }
          }

          if (prevManifestAsset) {
            compilation.updateAsset(
              ROUTE_MANIFEST_FILE,
              new RawSource(JSON.stringify(manifest, null, 2)) as any,
              // FIXME: The arguments third of updatgeAsset is a optional function in webpack.
              undefined as any,
            );
          } else {
            compilation.emitAsset(
              ROUTE_MANIFEST_FILE,
              new RawSource(JSON.stringify(manifest, null, 2)) as any,
            );
          }
        },
      );
    });
  }
}
