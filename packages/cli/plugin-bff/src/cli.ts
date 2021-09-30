import path from 'path';
import {
  createPlugin,
  useAppContext,
  useResolvedConfigContext,
} from '@modern-js/core';
import { compiler } from '@modern-js/babel-compiler';
import { PLUGIN_SCHEMAS, fs } from '@modern-js/utils';

import type { Configuration } from 'webpack';
import type Chain from 'webpack-chain';
import type { ServerRoute } from '@modern-js/types';
import { resolveBabelConfig } from '@modern-js/server-utils';
import { API_DIR } from './constants';

declare module '@modern-js/core' {
  interface UserConfig {
    bff: {
      prefix?: string;
      requestCreater?: string;
      fetcher?: string;
      proxy: Record<string, any>;
    };
  }
}

const DEFAULT_API_PREFIX = '/api';
const TS_CONFIG_FILENAME = 'tsconfig.json';
const FILE_EXTENSIONS = ['.js', '.ts', '.mjs', '.ejs'];

export default createPlugin(
  () => ({
    validateSchema() {
      return PLUGIN_SCHEMAS['@modern-js/plugin-bff'];
    },
    config() {
      return {
        tools: {
          webpack: (_config: Configuration, { chain }: { chain: Chain }) => {
            const {
              value: { appDirectory, port },
              // eslint-disable-next-line react-hooks/rules-of-hooks
            } = useAppContext();
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const { value: modernConfig } = useResolvedConfigContext();

            const { bff } = modernConfig || {};
            const { fetcher } = bff || {};
            const prefix = bff?.prefix || DEFAULT_API_PREFIX;

            const rootDir = path.resolve(appDirectory, API_DIR);

            const apiRegexp = new RegExp(`${appDirectory}/api/.*(.[tj]s)$`);
            chain.module
              .rule('loaders')
              .oneOf('bff-client')
              .before('fallback')
              .test(apiRegexp)
              .use('custom-loader')
              .loader(require.resolve('./loader'))
              .options({
                prefix,
                apiDir: rootDir,
                port,
                fetcher,
                target: _config.name,
              });
          },
        },
        source: {
          moduleScopes: (scopes: any) => {
            scopes.push('./api');
          },
        },
      };
    },
    modifyServerRoutes({ routes }: any) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { value: modernConfig } = useResolvedConfigContext();

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
    async afterBuild() {
      const {
        value: { appDirectory, distDirectory },
        // eslint-disable-next-line react-hooks/rules-of-hooks
      } = useAppContext();
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { value: modernConfig } = useResolvedConfigContext();

      const rootDir = path.resolve(appDirectory, API_DIR);
      const distDir = path.resolve(distDirectory, API_DIR);

      const sourceAbsDir = path.resolve(appDirectory, API_DIR);
      const tsconfigPath = path.resolve(appDirectory, TS_CONFIG_FILENAME);
      const babelConfig = resolveBabelConfig(appDirectory, modernConfig, {
        tsconfigPath,
        syntax: 'es6+',
        type: 'commonjs',
      });

      const result = await compiler(
        {
          rootDir,
          distDir,
          sourceDir: sourceAbsDir,
          extensions: FILE_EXTENSIONS,
          ignore: [`**/__tests__/**`, '**/typings/**', '*.d.ts'],
        },
        babelConfig,
      );

      await fs.copy(rootDir, distDir, {
        filter: src =>
          !['.ts', '.js'].includes(path.extname(src)) && src !== tsconfigPath,
      });

      if (result.code === 1) {
        throw new Error(result.message);
      }
    },
  }),
  { name: '@modern-js/plugin-bff' },
) as any;
