import type { IncomingMessage } from 'http';
import path from 'path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { ApiRouter } from '@modern-js/bff-core';
import type { ToolsDevServerConfig } from '@modern-js/builder';
import { compile } from '@modern-js/server-utils';
import type { ServerRoute } from '@modern-js/types';
import {
  fs,
  API_DIR,
  type Alias,
  DEFAULT_API_PREFIX,
  SHARED_DIR,
  normalizeOutputPath,
} from '@modern-js/utils';
import type { ConfigChain } from '@rsbuild/core';
import clientGenerator from './utils/clientGenerator';
import pluginGenerator from './utils/pluginGenerator';
import runtimeGenerator from './utils/runtimeGenerator';

const TS_CONFIG_FILENAME = 'tsconfig.json';
const RUNTIME_CREATE_REQUEST = '@modern-js/plugin-bff/client';
const RUNTIME_HONO = '@modern-js/plugin-bff/server';

export const bffPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-bff',
  setup: api => {
    const compileApi = async () => {
      const {
        appDirectory,
        distDirectory,
        apiDirectory,
        sharedDirectory,
        moduleType,
      } = api.getAppContext();
      const modernConfig = api.getNormalizedConfig();

      const distDir = path.resolve(distDirectory);
      const apiDir = apiDirectory || path.resolve(appDirectory, API_DIR);
      const sharedDir =
        sharedDirectory || path.resolve(appDirectory, SHARED_DIR);
      const tsconfigPath = path.resolve(appDirectory, TS_CONFIG_FILENAME);

      const sourceDirs = [];
      if (await fs.pathExists(apiDir)) {
        sourceDirs.push(apiDir);
      }

      if (await fs.pathExists(sharedDir)) {
        sourceDirs.push(sharedDir);
      }

      const { server } = modernConfig;
      const { alias } = modernConfig.source;
      const { alias: resolveAlias } = modernConfig.resolve;

      if (sourceDirs.length > 0) {
        const combinedAlias = ([] as unknown[])
          .concat(alias ?? [])
          .concat(resolveAlias ?? []) as ConfigChain<Alias>;
        await compile(
          appDirectory,
          {
            server,
            alias: combinedAlias,
          },
          {
            sourceDirs,
            distDir,
            tsconfigPath,
            moduleType,
            throwErrorInsteadOfExit: true,
          },
        );
      }
    };

    const generator = async () => {
      const { appDirectory, apiDirectory, lambdaDirectory, port } =
        api.getAppContext();

      const modernConfig = api.getNormalizedConfig();
      const relativeDistPath = modernConfig?.output?.distPath?.root || 'dist';
      const { bff } = modernConfig || {};
      const prefix = bff?.prefix || DEFAULT_API_PREFIX;
      const httpMethodDecider = bff?.httpMethodDecider;

      const apiRouter = new ApiRouter({
        apiDir: apiDirectory,
        appDir: appDirectory,
        lambdaDir: lambdaDirectory,
        prefix,
        httpMethodDecider,
        isBuild: true,
      });

      const lambdaDir = apiRouter.getLambdaDir();
      const existLambda = apiRouter.isExistLambda();

      const runtime =
        (bff as any)?.runtimeCreateRequest || RUNTIME_CREATE_REQUEST;
      const relativeApiPath = path.relative(appDirectory, apiDirectory);
      const relativeLambdaPath = path.relative(appDirectory, lambdaDir);

      await pluginGenerator({
        prefix,
        appDirectory,
        relativeDistPath,
        relativeApiPath,
        relativeLambdaPath,
      });
      await clientGenerator({
        prefix,
        appDir: appDirectory,
        apiDir: apiDirectory,
        lambdaDir,
        existLambda,
        port,
        requestCreator: (bff as any)?.requestCreator,
        httpMethodDecider,
        relativeDistPath,
        relativeApiPath,
      });
      await runtimeGenerator({
        runtime,
        appDirectory,
        relativeDistPath,
      });
    };

    const handleCrossProjectInvocation = async (isBuild = false) => {
      const { bff } = api.getNormalizedConfig();
      if (bff?.crossProject) {
        if (!isBuild) {
          await compileApi();
        }
        await generator();
      }
    };

    const isHono = () => {
      const { bffRuntimeFramework } = api.getAppContext();
      return bffRuntimeFramework === 'hono';
    };

    const createCompressConfig = (
      devServer: ToolsDevServerConfig | undefined,
      prefix: string,
    ) => {
      if (
        !devServer ||
        typeof devServer !== 'object' ||
        Array.isArray(devServer)
      ) {
        return undefined;
      }

      const { compress } = devServer;

      if (compress === undefined || compress === true) {
        return {
          filter: (req: IncomingMessage) => !req.url?.includes(prefix),
        };
      }

      if (compress === false) {
        return false;
      }

      return compress;
    };

    api.config(async () => {
      const honoRuntimePath = isHono()
        ? { [RUNTIME_HONO]: RUNTIME_HONO }
        : undefined;

      const devServer = api.getConfig()?.tools?.devServer;
      const prefix = api.getConfig()?.bff?.prefix || DEFAULT_API_PREFIX;

      const compress = createCompressConfig(devServer, prefix);

      return {
        tools: {
          devServer: {
            compress,
          },
          bundlerChain: (chain, { CHAIN_ID, isServer }) => {
            const { port, appDirectory, apiDirectory, lambdaDirectory } =
              api.getAppContext();
            const modernConfig = api.getNormalizedConfig();
            const { bff } = modernConfig || {};
            const prefix = bff?.prefix || DEFAULT_API_PREFIX;
            const httpMethodDecider = bff?.httpMethodDecider;

            const apiRouter = new ApiRouter({
              apiDir: apiDirectory,
              appDir: appDirectory,
              lambdaDir: lambdaDirectory,
              prefix,
              httpMethodDecider,
              isBuild: true,
            });

            const lambdaDir = apiRouter.getLambdaDir();
            const existLambda = apiRouter.isExistLambda();

            const apiRegexp = new RegExp(
              normalizeOutputPath(`${apiDirectory}${path.sep}.*(.[tj]s)$`),
            );

            const name = isServer ? 'server' : 'client';
            const sourceExt =
              process.env.MODERN_LIB_FORMAT === 'esm' ? 'mjs' : 'js';
            const loaderPath = path.join(__dirname, `loader.${sourceExt}`);
            chain.module.rule(CHAIN_ID.RULE.JS).exclude.add(apiRegexp);
            chain.module
              .rule('js-bff-api')
              .test(apiRegexp)
              .use('custom-loader')
              .loader(loaderPath.replace(/\\/g, '/'))
              .options({
                prefix,
                appDir: appDirectory,
                apiDir: apiDirectory,
                lambdaDir,
                existLambda,
                port,
                target: name,
                // Internal field
                requestCreator: (bff as any)?.requestCreator,
                httpMethodDecider,
              });
          },
        },
        output: {
          externals: honoRuntimePath,
        },
      };
    });

    api.modifyServerRoutes(({ routes }) => {
      const modernConfig = api.getNormalizedConfig();

      const { bff } = modernConfig || {};
      const prefix = bff?.prefix || '/api';

      const prefixList: string[] = [];

      if (Array.isArray(prefix)) {
        prefixList.push(...prefix);
      } else {
        prefixList.push(prefix);
      }
      const apiServerRoutes = prefixList.map(pre => ({
        urlPath: pre,
        isApi: true,
        entryPath: '',
        isSPA: false,
        isSSR: false,
      })) as ServerRoute[];

      if (!isHono() && bff?.enableHandleWeb) {
        return {
          routes: (
            routes.map(route => {
              return {
                ...route,
                isApi: true,
              };
            }) as ServerRoute[]
          ).concat(apiServerRoutes),
        };
      }

      return { routes: routes.concat(apiServerRoutes) };
    });

    api._internalServerPlugins(({ plugins }) => {
      plugins.push({
        name: '@modern-js/plugin-bff/server-plugin',
      });
      return { plugins };
    });

    api.onBeforeDev(async () => {
      await handleCrossProjectInvocation();
    });

    api.onAfterBuild(async () => {
      await compileApi();
      await handleCrossProjectInvocation(true);
    });

    api.addWatchFiles(async () => {
      const appContext = api.getAppContext();
      const config = api.getNormalizedConfig();

      if (config?.bff?.crossProject) {
        return [appContext.apiDirectory];
      } else {
        return [];
      }
    });

    api.onFileChanged(async e => {
      const { filename, eventType, isPrivate } = e;
      const { appDirectory, apiDirectory } = api.getAppContext();
      const relativeApiPath = path.relative(appDirectory, apiDirectory);
      if (
        !isPrivate &&
        (eventType === 'change' || eventType === 'unlink') &&
        filename.startsWith(`${relativeApiPath}/`) &&
        (filename.endsWith('.ts') || filename.endsWith('.js'))
      ) {
        await handleCrossProjectInvocation();
      }
    });
  },
});

export default bffPlugin;
