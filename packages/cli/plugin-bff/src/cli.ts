import path from 'path';
import { fs, API_DIR, normalizeOutputPath, SHARED_DIR } from '@modern-js/utils';
import { compile } from '@modern-js/server-utils';
import type { ServerRoute } from '@modern-js/types';
import { ApiRouter } from '@modern-js/bff-core';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';

const DEFAULT_API_PREFIX = '/api';
const TS_CONFIG_FILENAME = 'tsconfig.json';

export const bffPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-bff',
  setup: api => {
    return {
      config() {
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
                isServer
                  ? require.resolve('@modern-js/create-request/server')
                  : require.resolve('@modern-js/create-request/client'),
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

      async afterBuild() {
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
      },
    };
  },
});

export default bffPlugin;
