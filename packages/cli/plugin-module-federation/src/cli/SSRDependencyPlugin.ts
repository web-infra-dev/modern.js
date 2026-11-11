import type { Rspack } from '@rsbuild/core';

const pluginName = 'ModernSSRDependencyPlugin';

/** Modern-specific entry ownership; Rspack supplies only module/chunk graph APIs. */
export class SSRDependencyPlugin {
  constructor(private readonly options: { name: string; remotes: string[] }) {}

  apply(compiler: Rspack.Compiler) {
    const { name, remotes } = this.options;
    const { RuntimeModule, RuntimeGlobals } = compiler.webpack;
    const updateEntryExports = (
      RuntimeGlobals as typeof RuntimeGlobals & {
        updateEntryExports?: string;
      }
    ).updateEntryExports;
    if (!updateEntryExports)
      throw new Error(
        'moduleFederation.ssr.cacheUpdates requires a Rspack build with SSR cache update support (updateEntryExports)',
      );
    compiler.hooks.thisCompilation.tap(pluginName, compilation => {
      compilation.hooks.additionalTreeRuntimeRequirements.tap(
        pluginName,
        (chunk, requirements) => {
          const entrypoints = [...compilation.entrypoints].filter(
            ([, point]) => point.getRuntimeChunk() === chunk,
          );
          if (!entrypoints.length) return;
          requirements.add(RuntimeGlobals.require);
          requirements.add(RuntimeGlobals.moduleCache);
          requirements.add(updateEntryExports);
          class EntryOwnership extends RuntimeModule {
            constructor() {
              super('modern SSR entry ownership', RuntimeModule.STAGE_ATTACH);
            }
            generate() {
              const records = entrypoints.map(([entry, point]) => {
                const roots = [
                  ...compilation.chunkGraph.getChunkEntryModulesIterable(
                    point.getEntrypointChunk(),
                  ),
                ];
                const seen = new Set<Rspack.Module>();
                const queue = [...roots];
                const remoteNames = new Set<string>();
                const reasons = new Set<string>();
                for (let i = 0; i < queue.length; i++) {
                  const module = queue[i];
                  if (seen.has(module)) continue;
                  seen.add(module);
                  const source = module.originalSource()?.source().toString();
                  const resource = (module as Rspack.NormalModule).resource;
                  // Runtime consumption cannot be proven from a request history.
                  // Generated MF internals implement static imports with loadRemote;
                  // business use of those APIs invalidates the static-only contract.
                  if (
                    resource &&
                    !resource.includes('node_modules') &&
                    source &&
                    /\b(loadRemote|registerRemotes|importRemote|eval)\s*\(/.test(
                      source,
                    )
                  )
                    reasons.add('runtime-consumption');
                  if (module.type === 'remote-module') {
                    const requests = compilation.moduleGraph
                      .getIncomingConnections(module)
                      .map(edge => edge.dependency?.request)
                      .filter(Boolean) as string[];
                    const matched = remotes.filter(remote =>
                      requests.some(
                        request =>
                          request === remote ||
                          request.startsWith(`${remote}/`),
                      ),
                    );
                    if (!matched.length) reasons.add('unmapped-remote');
                    matched.forEach(remote => remoteNames.add(remote));
                  }
                  for (const edge of compilation.moduleGraph.getOutgoingConnections(
                    module,
                  )) {
                    if (edge.dependency?.critical)
                      reasons.add('critical-dependency');
                    if (edge.module) queue.push(edge.module);
                  }
                }
                const rootIds = roots.map(root =>
                  compilation.chunkGraph.getModuleId(root),
                );
                if (rootIds.length !== 1 || rootIds[0] === null)
                  reasons.add('unsupported-entry-roots');
                const chunks = new Set<string | number>();
                for (const module of seen)
                  for (const owned of compilation.chunkGraph.getModuleChunksIterable(
                    module,
                  ))
                    if (owned.id != null) chunks.add(owned.id);
                return {
                  application: name,
                  entry,
                  owner: entry.replace(/-server-loaders$/, ''),
                  rootIds,
                  remoteNames: [...remoteNames],
                  chunks: [...chunks],
                  reasons: [...reasons],
                };
              });
              return `var key = Symbol.for('modern-js.mf.ssr.entries');
var registry = globalThis[key] || (globalThis[key] = new Map());
${JSON.stringify(records)}.forEach(function(record) {
  record.runtime = __webpack_require__;
  record.load = async function() {
    var exports = await __webpack_require__(record.rootIds[0]);
    try {
      if (typeof __webpack_require__.updateEntryExports !== 'function' ||
          !__webpack_require__.updateEntryExports(record.rootIds[0], exports)) {
        throw new Error('Cannot synchronize SSR entry startup exports: ' + record.entry);
      }
    } catch (error) {
      // Modern's render root starts an async import immediately. Settle it before
      // recovery disposes MF; otherwise its late provider can cross generations.
      await Promise.allSettled([exports && exports.requestHandler]);
      throw error;
    }
    return exports;
  };
  registry.set(JSON.stringify([${JSON.stringify(name)}, record.entry]), record);
});`;
            }
          }
          compilation.addRuntimeModule(chunk, new EntryOwnership());
        },
      );
    });
  }
}
