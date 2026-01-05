import path from 'node:path';
import {
  type BuilderConfig,
  type BuilderInstance,
  createBuilder,
} from '@modern-js/builder';
import type { CLIPluginAPI } from '@modern-js/plugin';
import { lodash as _, fs as fse } from '@modern-js/utils';
import type { AppTools } from '../../../types';
import type { Setup } from '../platforms/platform';
import { applyRspackPlugin } from './apply-rspack-plugin';
import { ESM_RESOLVE_CONDITIONS } from './constant';

export const externalPkgs = ({ request }: any, callback: any) => {
  if (request) {
    if (request.includes('compiled/debug/index.js')) {
      return callback(undefined, 'var {debug:()=>{return () => {}}}');
    }
  }
  callback();
};

export const generateNodeExternals = (
  getExternal: (api: string) => string,
  list: string[] = [],
) => [
  ...list.map(api => [api, getExternal(api)]),
  ...list.map(api => [`node:${api}`, getExternal(api)]),
];

export const modifyCommonConfig: Setup = api => {
  applyRspackPlugin(api);
};

export const bundleSSR = async (
  entryCode: string,
  api: CLIPluginAPI<AppTools>,
  config: BuilderConfig,
  modifyBuilder?: (builder: BuilderInstance) => Promise<void>,
) => {
  const entry = path.join(
    api.getAppContext().internalDirectory,
    'edge-entry.mjs',
  );
  await fse.writeFile(entry, entryCode);
  const defaultConfig: BuilderConfig = {
    source: {
      entry: {
        index: {
          import: entry,
          html: false,
        },
      },
      define: {
        'process.env.NODE_ENV': '"production"',
        'process.env.MODERN_SSR_NODE_STREAM': 'true',
        'process.env.MODERN_SSR_ENV': '"edge"',
      },
    },
    resolve: {
      conditionNames: ESM_RESOLVE_CONDITIONS,
    },
    output: {
      target: 'node',
      module: true,
      cleanDistPath: true,
      polyfill: 'off',
      sourceMap: false,
      distPath: {
        js: '.',
      },
      filename: {
        js: '[name].js',
      },
      minify: false,
    },
    tools: {
      rspack: {
        target: 'es2020',
        output: {
          asyncChunks: false,
          library: {
            type: 'module',
          },
          pathinfo: true,
        },
        experiments: {
          outputModule: true,
        },
      },
    },
  };
  const builder = await createBuilder({
    bundlerType: 'rspack',
    config: _.merge({}, defaultConfig, config),
  });
  if (modifyBuilder) {
    await modifyBuilder(builder);
  }
  await builder.build();
};
