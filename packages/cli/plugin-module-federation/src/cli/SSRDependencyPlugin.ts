import type { Rspack } from '@rsbuild/core';

const pluginName = 'ModernSSRDependencyPlugin';

/** Modern-specific entry root registration; Rspack supplies the reverse module graph. */
export class SSRDependencyPlugin {
  constructor(private readonly options: { name: string; remotes?: string[] }) {}

  apply(compiler: Rspack.Compiler) {
    const { name } = this.options;
    const { RuntimeModule, RuntimeGlobals } = compiler.webpack;
    if (!RuntimeModule || !RuntimeGlobals?.moduleCache) {
      throw new Error(
        'Modern SSR cache updates require a Rspack build with SSR cache update support',
      );
    }
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
                const entryChunk = point.getEntrypointChunk();
                const roots = [
                  ...compilation.chunkGraph.getChunkEntryModulesIterable(
                    entryChunk,
                  ),
                ];
                const reasons: string[] = [];
                const rootIds = roots.map(root =>
                  compilation.chunkGraph.getModuleId(root),
                );
                if (rootIds.length !== 1 || rootIds[0] === null) {
                  reasons.push('unsupported-entry-roots');
                }
                const chunks = entryChunk.id != null ? [entryChunk.id] : [];
                return {
                  application: name,
                  entry,
                  owner: entry.replace(/-server-loaders$/, ''),
                  rootIds,
                  chunks,
                  reasons,
                };
              });
              return `var ownership = globalThis[Symbol.for('modern-js.mf.ssr.owners')];
${JSON.stringify(records)}.forEach(function(record) {
  record.runtime = __webpack_require__;
  record.load = function() {
    var ensure = __webpack_require__.federation && __webpack_require__.federation.ensureRemoteChunks;
    var ready = ensure ? ensure(record.chunks) : undefined;
    return ready && ready.then
      ? ready.then(function() { return __webpack_require__(record.rootIds[0]); })
      : __webpack_require__(record.rootIds[0]);
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
