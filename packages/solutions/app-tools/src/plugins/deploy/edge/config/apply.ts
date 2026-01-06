import path from 'node:path';
import { lodash as _ } from '@modern-js/utils';
import type { Rspack } from '@rsbuild/core';
import type { PluginAPI } from '../../types';
import { normalizePath } from '../../utils';
import { generateNodeExternals } from '../builder';
import { NODE_BUILTIN_MODULES } from '../constant';
import { appendTo } from '../utils';
import { generateChunkLoading } from './chunk-loader';

export interface ApplyConfigParams {
  rsbuild?: Parameters<PluginAPI['modifyRsbuildConfig']>[0];
  rspack?: Parameters<PluginAPI['modifyRspackConfig']>[0];
}

export const applyConfig = (api: PluginAPI, options?: ApplyConfigParams) => {
  let baseDistPath: string;

  api.modifyBundlerChain((_c, { environments }) => {
    // Use modifyBundlerChain API to ensure that the write priority of MODERN_SSR_ENV is higher than plugin-ssr
    if (environments.node) {
      _.set(
        environments.node,
        'config.source.define["process.env.MODERN_SSR_ENV"]',
        "'edge'",
      );
    }
  });

  api.modifyRsbuildConfig((config, utils) => {
    if (!config.environments?.node) {
      return;
    }
    const { appDirectory } = api.getAppContext();
    const userConfig = api.getConfig();
    baseDistPath = path.join(
      appDirectory,
      userConfig.output?.distPath?.root || 'dist',
    );
    options?.rsbuild?.(config, utils);
  });

  const nodeExternals = Object.fromEntries(
    generateNodeExternals(
      api => `module-import node:${api}`,
      NODE_BUILTIN_MODULES,
    ),
  );

  api.modifyRspackConfig((config, utils) => {
    const outputPath = config.output?.path;
    if (config.target !== 'node' || !baseDistPath || !outputPath) {
      return;
    }

    config.target = 'es2020';
    _.set(config, 'output.chunkFormat', 'module');
    _.set(config, 'output.chunkLoading', 'edgeChunkLoad');
    _.set(config, 'output.module', true);
    _.set(config, 'output.library.type', 'module');
    _.set(config, 'experiments.outputModule', true);

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
            // rspack declared a wrong type of RuntimeGlobals, they fixed in a newer version
            // @see https://github.com/web-infra-dev/rspack/blob/v1.6.8/packages/rspack/src/RuntimeGlobals.ts#L679
            return generateChunkLoading(
              chunk.id,
              chunkMap,
              RuntimeGlobals as any,
            );
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

    appendTo(config, 'externals', nodeExternals);
    appendTo(config, 'plugins', instance);

    try {
      options?.rspack?.(config, utils);
    } catch (e) {
      console.error(e);
    }
    // console.log('\n\n\n\n', 'config 222', config, '\n\n\n\n');
  });
};
