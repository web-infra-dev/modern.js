import type {
  InternalContext,
  RuntimePluginConfig,
  ServerPluginConfig,
} from '@modern-js/plugin-v2';
import type {
  Entrypoint,
  HtmlPartials,
  NestedRouteForCli,
  PageRoute,
  ServerRoute,
} from '@modern-js/types';
import type { Command } from '@modern-js/utils';
import { getModifyHtmlPartials } from '../plugins/analyze/getHtmlTemplate';
import type { AppTools, AppToolsNormalizedConfig } from '../types';
import {
  transformHookParams,
  transformHookResult,
  transformHookRunner,
} from './utils';

/**
 * old plugin useHookRunners function result
 */
export function getHookRunners(
  context: InternalContext<AppTools<'shared'>>,
): Record<string, any> {
  const { hooks } = context;
  return {
    /**
     * app tools hooks
     */
    afterPrepare: async () => {
      return hooks.onAfterPrepare.call();
    },
    deploy: async () => {
      return hooks.deploy.call();
    },
    _internalRuntimePlugins: async (params: {
      entrypoint: Entrypoint;
      plugins: RuntimePluginConfig[];
    }) => {
      return hooks._internalRuntimePlugins.call(params);
    },
    _internalServerPlugins: async (params: {
      plugins: ServerPluginConfig[];
    }) => {
      return hooks._internalServerPlugins.call(params);
    },
    checkEntryPoint: async (params: {
      path: string;
      entry: false | string;
    }) => {
      return hooks.checkEntryPoint.call(params);
    },
    modifyEntrypoints: async (params: { entrypoints: Entrypoint[] }) => {
      return hooks.modifyEntrypoints.call(params);
    },
    modifyFileSystemRoutes: async (params: {
      entrypoint: Entrypoint;
      routes: (NestedRouteForCli | PageRoute)[];
    }) => {
      return hooks.modifyFileSystemRoutes.call(params);
    },
    modifyServerRoutes: async (params: { routes: ServerRoute[] }) => {
      return hooks.modifyServerRoutes.call(params);
    },
    generateEntryCode: async (params: { entrypoints: Entrypoint[] }) => {
      return hooks.generateEntryCode.call(params);
    },
    beforeGenerateRoutes: async (params: {
      entrypoint: Entrypoint;
      code: string;
    }) => {
      return hooks.onBeforeGenerateRoutes.call(params);
    },
    beforePrintInstructions: async (params: { instructions: string }) => {
      return hooks.onBeforePrintInstructions.call(params);
    },
    // garfish plugin hooks
    appendEntryCode: async (params: {
      entrypoint: Entrypoint;
      code: string;
    }) => {
      const result = await (hooks as any)?.appendEntryCode.call(params);
      return result;
    },
    // test plugin hooks
    jestConfig: async (utils: any) => {
      const result = await (hooks as any)?.jestConfig.call(
        utils,
        (utils: any) => utils,
      );
      return result;
    },
    afterTest: async () => {
      return (hooks as any).afterTest.call();
    },

    /**
     * common hooks
     */
    config: async () => {
      return hooks.config.call();
    },
    resolvedConfig: (params: AppToolsNormalizedConfig) => {
      return hooks.modifyResolvedConfig.call(params);
    },
    htmlPartials: async (params: {
      entrypoint: Entrypoint;
      partials: HtmlPartials;
    }) => {
      await hooks.modifyHtmlPartials.call({
        entrypoint: params.entrypoint,
        partials: getModifyHtmlPartials(params.partials),
      });
      return { partials: params.partials };
    },
    commands: async (params: { program: Command }) => {
      return hooks.addCommand.call(params);
    },
    watchFiles: async () => {
      return hooks.addWatchFiles.call();
    },
    prepare: async () => {
      return hooks.onPrepare.call();
    },
    fileChange: async (params: {
      filename: string;
      eventType: 'add' | 'change' | 'unlink';
      isPrivate: boolean;
    }) => {
      return hooks.onFileChanged.call(params);
    },
    beforeCreateCompiler: async (params: {
      bundlerConfigs?: any[];
    }) => {
      return hooks.onBeforeCreateCompiler.call(params as any);
    },
    afterCreateCompiler: async (params: {
      compiler?: any;
    }) => {
      return hooks.onAfterCreateCompiler.call(params as any);
    },
    beforeBuild: async (params: {
      bundlerConfigs?: any[];
    }) => {
      return hooks.onBeforeBuild.call(params as any);
    },
    afterBuild: async (params: {
      stats?: any;
    }) => {
      return hooks.onAfterBuild.call(params as any);
    },
    beforeDev: async () => {
      return hooks.onBeforeDev.call();
    },
    afterDev: async (params: { isFirstCompile: boolean }) => {
      return hooks.onDevCompileDone.call(params as any);
    },
    beforeDeploy: async (options: Record<string, any>) => {
      return hooks.onBeforeDeploy.call(options);
    },
    afterDeploy: async (options: Record<string, any>) => {
      return hooks.onAfterDeploy.call(options);
    },
    beforeExit: async () => {
      return hooks.onBeforeExit.call();
    },
    beforeRestart: async () => {
      return hooks.onBeforeRestart.call();
    },

    /**
     * @deprecated
     */
    registerDev: async () => {
      return hooks.registerDev.call();
    },
    /**
     * @deprecated
     */
    registerBuildPlatform: async () => {
      return hooks.registerBuildPlatform.call();
    },
    /**
     * @deprecated
     */
    addRuntimeExports: async () => {
      return hooks.addRuntimeExports.call();
    },
  };
}

export function handleSetupResult(
  setupResult: Record<string, (...args: any) => any>,
  api: Record<string, any>,
) {
  if (!setupResult) {
    return;
  }
  Object.keys(setupResult).forEach(key => {
    const fn = setupResult[key];
    if (typeof fn === 'function') {
      const newAPI = transformHookRunner(key);
      if (newAPI && api[newAPI]) {
        api[newAPI](async (...params: any) => {
          const { isMultiple, params: transformParams } = transformHookParams(
            key,
            params,
          );
          if (isMultiple) {
            return transformHookResult(key, await fn(...transformParams));
          } else {
            return transformHookResult(key, await fn(transformParams));
          }
        });
      }
    }
  });
}
