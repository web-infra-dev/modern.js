import path from 'path';
import {
  fs,
  API_DIR,
  PLUGIN_SCHEMAS,
  normalizeOutputPath,
  SHARED_DIR,
  isProd,
} from '@modern-js/utils';
import { compile } from '@modern-js/server-utils';
import type { ServerRoute } from '@modern-js/types';
import { ApiRouter } from '@modern-js/bff-core';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { registerModernRuntimePath } from './helper';

const DEFAULT_API_PREFIX = '/api';
const TS_CONFIG_FILENAME = 'tsconfig.json';

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-bff',
  setup: api => {
    let unRegisterResolveRuntimePath: (() => void) | null = null;
    return {
      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/plugin-bff'];
      },
      config() {
        return {
          tools: {
            webpackChain: (chain, { name, CHAIN_ID }) => {
              const { appDirectory, port } = api.useAppContext();
              const modernConfig = api.useResolvedConfigContext();
              const { bff } = modernConfig || {};
              const prefix = bff?.prefix || DEFAULT_API_PREFIX;

              const rootDir = path.resolve(appDirectory, API_DIR);

              chain.resolve.alias.set('@api', rootDir);

              const apiRouter = new ApiRouter({
                apiDir: rootDir,
                prefix,
              });

              const lambdaDir = apiRouter.getLambdaDir();
              const existLambda = apiRouter.isExistLambda();

              const apiRegexp = new RegExp(
                normalizeOutputPath(`${rootDir}${path.sep}.*(.[tj]s)$`),
              );

              chain.module.rule(CHAIN_ID.RULE.JS).exclude.add(apiRegexp);
              chain.module
                .rule(CHAIN_ID.RULE.JS_BFF_API)
                .test(apiRegexp)
                .use('custom-loader')
                .loader(require.resolve('./loader').replace(/\\/g, '/'))
                .options({
                  prefix,
                  apiDir: rootDir,
                  lambdaDir,
                  existLambda,
                  port,
                  target: name,
                });
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
          // FIXME: })) as IAppContext[`serverRoutes`];
        })) as ServerRoute[];

        return { routes: routes.concat(apiServerRoutes) };
      },

      collectServerPlugins({ plugins }) {
        plugins.push({
          '@modern-js/plugin-bff': '@modern-js/plugin-bff/server',
        });
        return { plugins };
      },

      async beforeBuild() {
        // help esbuild-register resolve @modern-js/server/runtime
        if (isProd()) {
          const { internalDirectory } = api.useAppContext();
          unRegisterResolveRuntimePath =
            registerModernRuntimePath(internalDirectory);
        }
      },

      async afterBuild() {
        if (unRegisterResolveRuntimePath) {
          unRegisterResolveRuntimePath();
        }
        const { appDirectory, distDirectory } = api.useAppContext();
        const modernConfig = api.useResolvedConfigContext();

        const distDir = path.resolve(distDirectory);
        const apiDir = path.resolve(appDirectory, API_DIR);
        const sharedDir = path.resolve(appDirectory, SHARED_DIR);
        const tsconfigPath = path.resolve(appDirectory, TS_CONFIG_FILENAME);

        const sourceDirs = [];
        if (fs.existsSync(apiDir)) {
          sourceDirs.push(apiDir);
        }

        if (fs.existsSync(sharedDir)) {
          sourceDirs.push(sharedDir);
        }

        const { server } = modernConfig;
        const { alias, define, globalVars } = modernConfig.source;
        const { babel } = modernConfig.tools;

        if (sourceDirs.length > 0) {
          await compile(
            appDirectory,
            {
              server,
              alias,
              define,
              globalVars,
              babelConfig: babel,
            },
            {
              sourceDirs,
              distDir,
              tsconfigPath,
            },
          );
        }
      },
    };
  },
});
