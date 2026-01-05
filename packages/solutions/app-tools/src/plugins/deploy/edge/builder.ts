import path from 'node:path';
import {
  type BuilderConfig,
  type BuilderInstance,
  createBuilder,
} from '@modern-js/builder';
import type { CLIPluginAPI } from '@modern-js/plugin';
import { lodash as _, fs as fse } from '@modern-js/utils';
import type { AppTools } from '../../../types';
import { ESM_RESOLVE_CONDITIONS } from './constant';

export const externalDebug = ({ request }: any, callback: any) => {
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

export const bundleSSR = async (
  handlerCode: string,
  api: CLIPluginAPI<AppTools>,
  config: BuilderConfig,
  modifyBuilder?: (builder: BuilderInstance) => Promise<void>,
) => {
  const handlerPath = path.join(
    api.getAppContext().internalDirectory,
    'edge-handler.mjs',
  );
  await fse.writeFile(handlerPath, handlerCode);
  const defaultConfig: BuilderConfig = {
    source: {
      entry: {
        handler: {
          import: handlerPath,
          html: false,
        },
      },
      define: {
        'process.env.NODE_ENV': '"production"',
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
  const finalConfig = _.merge({}, defaultConfig, config);
  console.log('finalConfig', finalConfig);
  const builder = await createBuilder({
    bundlerType: 'rspack',
    config: finalConfig,
  });
  if (modifyBuilder) {
    await modifyBuilder(builder);
  }
  await builder.build();
};
