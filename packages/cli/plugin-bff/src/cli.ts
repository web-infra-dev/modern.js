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
import type { CliPlugin, UserConfig } from '@modern-js/core';
import { ApiRouter } from '@modern-js/bff-core';
import { registerModernRuntimePath } from './helper';

const DEFAULT_API_PREFIX = '/api';
const TS_CONFIG_FILENAME = 'tsconfig.json';

export default (): CliPlugin => ({
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
              const modernConfig = api.useResolvedConfigContext() as UserConfig;
              const { bff } = modernConfig || {};
              const { fetcher } = bff || {};
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
              chain.module
                .rule(CHAIN_ID.RULE.LOADERS)
                .oneOf(CHAIN_ID.ONE_OF.BFF_CLIENT)
                .before(CHAIN_ID.ONE_OF.FALLBACK)
                .test(apiRegexp)
                .use('custom-loader')
                .loader(require.resolve('./loader').replace(/\\/g, '/'))
                .options({
                  prefix,
                  apiDir: rootDir,
                  lambdaDir,
                  existLambda,
                  port,
                  fetcher,
                  target: name,
                  requestCreator: bff?.requestCreator,
                });
            },
          },
          source: {
            moduleScopes: [`./${API_DIR}`, /create-request/],
          },
        };
      },
      modifyServerRoutes({ routes }: { routes: ServerRoute[] }) {
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
        const { alias, envVars, globalVars } = modernConfig.source;
        const { babel } = modernConfig.tools;

        if (sourceDirs.length > 0) {
          await compile(
            appDirectory,
            {
              server,
              alias,
              envVars,
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
