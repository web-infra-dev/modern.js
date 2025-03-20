import path from 'path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { ApiRouter } from '@modern-js/bff-core';
import { compile } from '@modern-js/server-utils';
import type { ServerRoute } from '@modern-js/types';
import {
  fs,
  API_DIR,
  SHARED_DIR,
  isProd,
  normalizeOutputPath,
} from '@modern-js/utils';
import clientGenerator from './utils/clientGenerator';
import pluginGenerator from './utils/pluginGenerator';
import runtimeGenerator from './utils/runtimeGenerator';

const DEFAULT_API_PREFIX = '/api';
const TS_CONFIG_FILENAME = 'tsconfig.json';
const RUNTIME_CREATE_REQUEST = '@modern-js/plugin-bff/runtime/create-request';
const RUNTIME_HONO = '@modern-js/plugin-bff/hono';

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
      } = api.useAppContext();
      const modernConfig = api.useResolvedConfigContext();

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
      const { babel } = modernConfig.tools;

      if (sourceDirs.length > 0) {
        await compile(
          appDirectory,
          {
            server,
            alias,
            babelConfig: babel,
          },
          {
            sourceDirs,
            distDir,
            tsconfigPath,
            moduleType,
          },
        );
      }
    };

    const generator = async () => {
      const { appDirectory, apiDirectory, lambdaDirectory, port } =
        api.useAppContext();

      const modernConfig = api.useResolvedConfigContext();
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
      const { bff } = api.useResolvedConfigContext();
      if (bff?.crossProject) {
        if (!isBuild) {
          await compileApi();
        }
        await generator();
      }
    };

    const isHono = () => {
      const { bffRuntimeFramework } = api.useAppContext();
      return bffRuntimeFramework === 'hono';
    };

    return {
      config() {
        const honoRuntimePath = isHono()
          ? { [RUNTIME_HONO]: RUNTIME_HONO }
          : undefined;

        return {
          tools: {
            bundlerChain: (chain, { CHAIN_ID, isServer }) => {
              const { port, appDirectory, apiDirectory, lambdaDirectory } =
                api.useAppContext();
              const modernConfig = api.useResolvedConfigContext();
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
              chain.module.rule(CHAIN_ID.RULE.JS).exclude.add(apiRegexp);
              chain.module
                .rule('js-bff-api')
                .test(apiRegexp)
                .use('custom-loader')
                .loader(require.resolve('./loader').replace(/\\/g, '/'))
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

              chain.resolve.alias.set('@api', apiDirectory);

              chain.resolve.alias.set(
                '@modern-js/runtime/bff',
                RUNTIME_CREATE_REQUEST,
              );
            },
          },
          source: {
            moduleScopes: [`./${API_DIR}`, /create-request/],
          },
          output: {
            externals: honoRuntimePath,
          },
        };
      },
      modifyServerRoutes({ routes }) {
        const modernConfig = api.useResolvedConfigContext();

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
      },

      _internalServerPlugins({ plugins }) {
        plugins.push({
          name: '@modern-js/plugin-bff/server',
        });
        return { plugins };
      },
      async beforeDev() {
        await handleCrossProjectInvocation();
      },

      async afterBuild() {
        await compileApi();
        await handleCrossProjectInvocation(true);
      },
      async watchFiles() {
        const appContext = api.useAppContext();
        const config = api.useResolvedConfigContext();

        if (config?.bff?.crossProject) {
          return [appContext.apiDirectory];
        } else {
          return [];
        }
      },

      async fileChange(e: {
        filename: string;
        eventType: string;
        isPrivate: boolean;
      }) {
        const { filename, eventType, isPrivate } = e;
        const { appDirectory, apiDirectory } = api.useAppContext();
        const relativeApiPath = path.relative(appDirectory, apiDirectory);
        if (
          !isPrivate &&
          (eventType === 'change' || eventType === 'unlink') &&
          filename.startsWith(`${relativeApiPath}/`) &&
          (filename.endsWith('.ts') || filename.endsWith('.js'))
        ) {
          await handleCrossProjectInvocation();
        }
      },
    };
  },
});

export default bffPlugin;
