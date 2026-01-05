import path from 'node:path';
import type { Rspack } from '@rsbuild/core';
import type { PluginAPI } from '../platforms/platform';
import { normalizePath } from '../utils';

const generateChunkLoading = (
  chunkId: string,
  chunkMap: Record<string, string>,
) => {
  return `var installedChunks = {"${chunkId}": 1};
var loadingChunks = {};
var chunkMap = ${JSON.stringify(chunkMap)};
var installChunk = (chunk) => {
	var moreModules = chunk.modules, chunkIds = chunk.ids, runtime = chunk.runtime;
	for (var moduleId in moreModules) {
		if (__webpack_require__.o(moreModules, moduleId)) {
		 __webpack_require__.m[moduleId] = moreModules[moduleId];
		}
	}
	if (runtime) runtime(__webpack_require__);
	for (var i = 0; i < chunkIds.length; i++) installedChunks[chunkIds[i]] = 1;
};
__webpack_require__.f.edgeChunkLoad = (chunkId, promises) => {
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
        resole();
      }).catch(reject)
    });
  }
  promises.push(loadingChunks[chunkId]);
};`;
};

export const applyRspackPlugin = (api: PluginAPI) => {
  let baseDistPath: string;

  api.modifyRsbuildConfig(config => {
    if (!config.environments?.node) {
      return;
    }
    const { appDirectory } = api.getAppContext();
    const userConfig = api.getConfig();
    baseDistPath = path.join(
      appDirectory,
      userConfig.output?.distPath?.root || 'dist',
    );
  });

  api.modifyRspackConfig(config => {
    const outputPath = config.output?.path;
    if (config.target !== 'node' || !baseDistPath || !outputPath) {
      return;
    }

    if (config.output) {
      config.output.chunkLoading = 'edgeChunkLoad';
    }

    const instance: Rspack.RspackPluginInstance = {
      apply(compiler) {
        const { RuntimeModule, RuntimeGlobals } = compiler.rspack;

        compiler.rspack.javascript.EnableChunkLoadingPlugin.setEnabled(
          compiler,
          'edgeChunkLoad',
        );

        class EdgeChunkLoad extends RuntimeModule {
          constructor() {
            super('edge chunk load', RuntimeModule.STAGE_ATTACH);
          }

          generate() {
            const { chunk, compilation } = this;
            if (!chunk || !compilation || !outputPath || !chunk.id) {
              return '';
            }
            const chunkFilename = compilation.options.output
              .chunkFilename as string;
            const chunkMap: Record<string, string> = {};
            chunk.getAllReferencedChunks().map(refChunk => {
              if (!refChunk.id) {
                return;
              }
              const p = compilation.getPath(chunkFilename, {
                chunk: refChunk,
              });
              const fullPath = path.join(outputPath, p);
              const relativePath = normalizePath(
                path.relative(baseDistPath, fullPath),
              );
              chunkMap[refChunk.id] = relativePath;
            });
            return generateChunkLoading(chunk.id, chunkMap);
          }
        }

        compiler.hooks.thisCompilation.tap(
          'EdgeChunkLoadPlugin',
          compilation => {
            compilation.hooks.runtimeRequirementInTree
              .for(RuntimeGlobals.ensureChunkHandlers)
              .tap('EdgeChunkLoad', (chunk, set) => {
                compilation.addRuntimeModule(chunk, new EdgeChunkLoad());
              });
          },
        );
      },
    };

    if (config.plugins) {
      config.plugins.push(instance);
    } else {
      config.plugins = [instance];
    }
  });
};
