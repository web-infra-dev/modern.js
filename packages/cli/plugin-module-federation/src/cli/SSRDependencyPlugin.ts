import path from 'node:path';
import type { Rspack } from '@rsbuild/core';

const pluginName = 'ModernSSRDependencyPlugin';

/** Modern-specific entry ownership; Rspack supplies only module/chunk graph APIs. */
export class SSRDependencyPlugin {
  constructor(private readonly options: { name: string; remotes: string[] }) {}

  apply(compiler: Rspack.Compiler) {
    const { name, remotes } = this.options;
    const { RuntimeModule, RuntimeGlobals } = compiler.webpack;
    const appRoot = path.join(path.resolve(compiler.context), path.sep);
    // Keep this macro free while building the plugin library. Resolving Rspack's
    // special __webpack_require__ in that build would capture the library runtime
    // instead of the application runtime that owns the SSR entries.
    new compiler.webpack.DefinePlugin({
      MODERN_SSR_FEDERATION_REQUIRE: '__webpack_require__',
    }).apply(compiler);
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
                  const resource = (module as Rspack.NormalModule).resource;
                  // Build/runtime packages may resolve outside node_modules in a workspace.
                  // The source heuristic applies to application files. The runtime
                  // tracker detects dynamic consumption through other modules.
                  if (
                    resource?.startsWith(appRoot) &&
                    !resource
                      .slice(appRoot.length)
                      .split(path.sep)
                      .includes('node_modules') &&
                    /\b(loadRemote|registerRemotes|importRemote|eval)\s*\(/.test(
                      module.originalSource()?.source().toString() || '',
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
              return `var ownership = globalThis[Symbol.for('modern-js.mf.ssr.owners')];
${JSON.stringify(records)}.forEach(function(record) {
  record.runtime = __webpack_require__;
  record.load = function() {
    return __webpack_require__(record.rootIds[0]);
  };
  if (ownership) ownership.registerEntry(record);
});`;
            }
          }
          compilation.addRuntimeModule(chunk, new EntryOwnership());
        },
      );
    });
  }
}
