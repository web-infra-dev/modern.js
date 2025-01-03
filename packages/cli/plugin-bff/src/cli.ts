import path from 'path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { ApiRouter } from '@modern-js/bff-core';
import { compile } from '@modern-js/server-utils';
import type { ServerRoute } from '@modern-js/types';
import { fs, API_DIR, SHARED_DIR, normalizeOutputPath } from '@modern-js/utils';
import clientGenerator from './utils/clientGenerator';
import pluginGenerator from './utils/pluginGenerator';
import runtimeGenerator from './utils/runtimeGenerator';

const DEFAULT_API_PREFIX = '/api';
const TS_CONFIG_FILENAME = 'tsconfig.json';
const RUNTIME_CREATE_REQUEST = '@modern-js/plugin-bff/runtime/create-request';

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

      const options = {
        prefix,
        appDir: appDirectory,
        apiDir: apiDirectory,
        lambdaDir,
        existLambda,
        port,
        requestCreator: (bff as any)?.requestCreator,
        httpMethodDecider,
      };

      const runtime = (bff as any)?.runtime || RUNTIME_CREATE_REQUEST;
      await clientGenerator(options);
      await pluginGenerator(prefix);
      await runtimeGenerator(runtime);
    };

    const handleCrossProjectInvocation = async () => {
      const { bff } = api.useResolvedConfigContext();
      if (bff?.enableCrossProjectInvocation) {
        await compileApi();
        await generator();
      }
    };

    return {
      config() {
        return {
          tools: {
            bundlerChain: (chain, { CHAIN_ID, isServer }) => {
              const {
                port,
                appDirectory,
                apiDirectory,
                lambdaDirectory,
                indepBffPrefix,
              } = api.useAppContext();
              const modernConfig = api.useResolvedConfigContext();
              const { bff } = modernConfig || {};
              const prefix =
                indepBffPrefix || bff?.prefix || DEFAULT_API_PREFIX;
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
        };
      },
      modifyServerRoutes({ routes }) {
        const modernConfig = api.useResolvedConfigContext();

        const { indepBffPrefix } = api.useAppContext();

        const { bff } = modernConfig || {};
        const prefix = indepBffPrefix || bff?.prefix || '/api';

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

        if (bff?.enableHandleWeb) {
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
        const { bff } = api.useResolvedConfigContext();
        await compileApi();

        if (bff?.enableCrossProjectInvocation) {
          await generator();
        }
      },
      async watchFiles() {
        const appContext = api.useAppContext();
        const config = api.useResolvedConfigContext();
        const { generateWatchFiles } = require('@modern-js/app-tools');
        const files = await generateWatchFiles(
          appContext,
          config.source.configDir,
        );

        if (config?.bff?.enableCrossProjectInvocation) {
          files.push(appContext.apiDirectory);
        }

        return files;
      },

      async fileChange(e: {
        filename: string;
        eventType: string;
        isPrivate: boolean;
      }) {
        const { filename, eventType, isPrivate } = e;
        if (
          !isPrivate &&
          (eventType === 'change' || eventType === 'unlink') &&
          filename.startsWith('api/')
        ) {
          await handleCrossProjectInvocation();
        }
      },
    };
  },
});

export default bffPlugin;
