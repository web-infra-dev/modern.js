// @see https://github.com/web-infra-dev/rspack/blob/v1.6.8/crates/rspack_plugin_esm_library/src/render.rs#L726
// @see https://github.com/web-infra-dev/rspack/blob/v1.6.8/crates/rspack_plugin_runtime/src/runtime_module/runtime/module_chunk_loading.ejs
const runtimeVariableModules = '__webpack_modules__';
const esmChunkInstaller = (globals: Record<string, string>) => `
${globals.moduleFactories} = ${globals.moduleFactories} || ${runtimeVariableModules};
var installChunk = (data) => {
  var __rspack_esm_ids = data.__rspack_esm_ids;
  var ${runtimeVariableModules} = data.${runtimeVariableModules};
  var __rspack_esm_runtime = data.__rspack_esm_runtime;
  // add "modules" to the modules object,
  // then flag all "ids" as loaded and fire callback
  var moduleId, chunkId, i = 0;
  for (moduleId in ${runtimeVariableModules}) {
    if (${globals.hasOwnProperty}(${runtimeVariableModules}, moduleId)) {
      ${globals.moduleFactories}[moduleId] = ${runtimeVariableModules}[moduleId];
    }
  }
  if (__rspack_esm_runtime) __rspack_esm_runtime(${globals.require});
  for (; i < __rspack_esm_ids.length; i++) {
    chunkId = __rspack_esm_ids[i];
    if (${globals.hasOwnProperty}(installedChunks, chunkId) && installedChunks[chunkId]) {
      installedChunks[chunkId][0]();
    }
    installedChunks[__rspack_esm_ids[i]] = 1;
  }
};`;

export const generateChunkLoading = (
  chunkId: string,
  chunkMap: Record<string, string>,
  runtimeGlobals: Record<string, string>,
) => {
  const installer = esmChunkInstaller(runtimeGlobals);
  return `var installedChunks = {"${chunkId}": 1};
var loadingChunks = {};
var chunkMap = ${JSON.stringify(chunkMap)};
${installer}
${runtimeGlobals.ensureChunkHandlers}.edgeChunkLoad = (chunkId, promises) => {
  if (installedChunks[chunkId]) {
    return;
  }
  if (!loadingChunks[chunkId]) {
    var g = global || globalThis;
    loadingChunks[chunkId] = new Promise((resolve, reject) => {
      var p = g.__MODERN_DEPS__[chunkMap[chunkId]];
      if (!p) {
        reject(new Error('chunk ' + chunkId + ' is not available'));
        return;
      }
      p().then(d => {
        installChunk(d.default || d);
        delete loadingChunks[chunkId];
        resolve();
      }).catch(reject)
    });
  }
  promises.push(loadingChunks[chunkId]);
};`;
};
