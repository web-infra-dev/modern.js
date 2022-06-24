import path from 'path';
import { compiler } from '@modern-js/babel-compiler';
import {
  fs,
  API_DIR,
  PLUGIN_SCHEMAS,
  normalizeOutputPath,
  SHARED_DIR,
  isProd,
} from '@modern-js/utils';
import { resolveBabelConfig } from '@modern-js/server-utils';

import type { ServerRoute } from '@modern-js/types';
import type { CliPlugin, NormalizedConfig, UserConfig } from '@modern-js/core';
import { registerModernRuntimePath } from './helper';

interface Pattern {
  from: string;
  to: string;
  tsconfigPath?: string;
}

interface CompileOptions {
  patterns: Pattern[];
}

const DEFAULT_API_PREFIX = '/api';
const TS_CONFIG_FILENAME = 'tsconfig.json';
const FILE_EXTENSIONS = ['.js', '.ts', '.mjs', '.ejs'];

// TODO: 封装服务端编译函数
const compile = async (
  appDirectory: string,
  modernConfig: NormalizedConfig,
  compileOptions: CompileOptions,
) => {
  const { patterns } = compileOptions;
  const results = await Promise.all(
    patterns.map(async pattern => {
      const { from, to, tsconfigPath } = pattern;
      const babelConfig = resolveBabelConfig(appDirectory, modernConfig, {
        tsconfigPath: tsconfigPath ? tsconfigPath : '',
        syntax: 'es6+',
        type: 'commonjs',
      });
      if (await fs.pathExists(from)) {
        const basename = path.basename(from);
        const targetDir = path.join(to, basename);
        await fs.copy(from, targetDir, {
          filter: src =>
            !['.ts', '.js'].includes(path.extname(src)) && src !== tsconfigPath,
        });
      }
      return compiler(
        {
          rootDir: appDirectory,
          distDir: to,
          sourceDir: from,
          extensions: FILE_EXTENSIONS,
        },
        babelConfig,
      );
    }),
  );
  results.forEach(result => {
    if (result.code === 1) {
      throw new Error(result.message);
    }
  });
};

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

              const apiRegexp = new RegExp(
                normalizeOutputPath(
                  `${appDirectory}${path.sep}api${path.sep}.*(.[tj]s)$`,
                ),
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

        const patterns = [];
        if (fs.existsSync(apiDir)) {
          patterns.push({
            from: apiDir,
            to: distDir,
            tsconfigPath,
          });
        }

        if (fs.existsSync(sharedDir)) {
          patterns.push({
            from: sharedDir,
            to: distDir,
            tsconfigPath,
          });
        }

        if (patterns.length > 0) {
          await compile(appDirectory, modernConfig, { patterns });
        }
      },
    };
  },
});
