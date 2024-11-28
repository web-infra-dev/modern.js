import path from 'path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { generateWatchFiles } from '@modern-js/app-tools';
import { ApiRouter } from '@modern-js/bff-core';
import { compile } from '@modern-js/server-utils';
import type { ServerRoute } from '@modern-js/types';
import {
  fs,
  API_DIR,
  SHARED_DIR,
  logger,
  normalizeOutputPath,
} from '@modern-js/utils';
import clientGenerator from './utils/client-generator';
import pluginGenerator from './utils/plugin-generator';

const DEFAULT_API_PREFIX = '/api';
const TS_CONFIG_FILENAME = 'tsconfig.json';

export interface BffPluginOptions {
  projectType: 'web' | 'api';
  fetchDomain?: string;
}

export const bffPlugin = (options?: BffPluginOptions): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-bff',
  setup: api => {
    const isApiProject = options?.projectType === 'api';

    console.log('options:>>', options);
    const compileApi = async () => {
      const {
        appDirectory,
        distDirectory,
        apiDirectory,
        sharedDirectory,
        moduleType,
      } = api.useAppContext();
      const modernConfig = api.useResolvedConfigContext();
      console.log('compileApi: modernConfig', modernConfig);

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

      const ops = {
        prefix,
        appDir: appDirectory,
        apiDir: apiDirectory,
        lambdaDir,
        existLambda,
        port,
        requestCreator: (bff as any)?.requestCreator,
        target: 'client',
        httpMethodDecider,
        domain: options?.fetchDomain,
      };

      await clientGenerator(ops);
      await pluginGenerator(ops.prefix);
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
              } = api.useAppContext() as any;

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
                isServer
                  ? require.resolve('@modern-js/create-request/server')
                  : require.resolve('@modern-js/create-request/client'),
              );
            },
          },
          source: {
            moduleScopes: [`./${API_DIR}`, /create-request/],
          },
          dev: {
            hmr: isApiProject
              ? false
              : api.useResolvedConfigContext()?.dev?.hmr,
          },
        };
      },
      modifyServerRoutes({ routes }) {
        const modernConfig = api.useResolvedConfigContext();

        const { indepBffPrefix } = api.useAppContext() as any;

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
        if (isApiProject) {
          await compileApi();
          await generator();
        }
      },

      async afterBuild() {
        await compileApi();
        if (isApiProject) {
          await generator();
        }
      },
      async watchFiles() {
        const appContext = api.useAppContext();
        const config = api.useResolvedConfigContext();
        const files = await generateWatchFiles(
          appContext,
          config.source.configDir,
        );

        if (isApiProject) {
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
          isApiProject &&
          !isPrivate &&
          (eventType === 'change' || eventType === 'unlink') &&
          filename.startsWith('api/')
        ) {
          await compileApi();
          await generator();
        }
      },
    };
  },
});

export default bffPlugin;
