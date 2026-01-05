import path from 'node:path';
import { lodash as _, fs as fse } from '@modern-js/utils';
import type { RsbuildPlugin } from '@rsbuild/core';
import { builtinMappingResolved } from '@rsbuild/plugin-node-polyfill';
import {
  NODE_BUILTIN_MODULES,
  applyConfig,
  bundleSSR,
  copyEntriesHtml,
  externalDebug,
  generateHandler,
  generateNodeExternals,
  scanDeps,
} from '../edge';
import { injectProcessPlugin } from '../edge/config/inject-process';
import {
  type BuiltinModules,
  createNodePolyfill,
  createNodeSchemaPlugin,
} from '../edge/config/node-polyfill';
import type { Setup } from '../types';
import type { CreatePreset } from './platform';

const esaNodeModules = [
  'assert',
  'async_hooks',
  'buffer',
  'crypto',
  'diagnostics_channel',
  'events',
  'path',
  'process',
  'stream',
  'util',
  'string_decoder',
];

// those modules are builtin in ali-esa
// used in some modules like rslog, we need to polyfill them
const polyfillNodeBuiltin = ['os', 'tty'];
// other node builtin modules, we have confirmed that they has not been actually used, so ignore them
const otherBuiltin = NODE_BUILTIN_MODULES.filter(
  x => !esaNodeModules.includes(x) && !polyfillNodeBuiltin.includes(x),
);
const esaExternals = Object.fromEntries([
  ...generateNodeExternals(api => `module-import node:${api}`, esaNodeModules),
  ...generateNodeExternals(() => 'var {}', otherBuiltin),
]);

// make a rspack plugin to redirect "node:" prefix request to polyfill
const nodeSchemaPlugin = createNodeSchemaPlugin(
  polyfillNodeBuiltin as BuiltinModules[],
);

export const setupAliESA: Setup = async api => {
  applyConfig(api, {
    rsbuild: config => {
      [
        // remove __non_webpack_require__
        ['__non_webpack_require__', 'undefined'],
        // loadable use it
        ['__dirname', "''"],
        // Helmet use it, but global object is not exists in ali-esa
        ['global', 'globalThis'],
      ].forEach(([key, value]) =>
        _.set(config, `environments.node.source.define[${key}]`, value),
      );
      const plugins = _.get(config, 'environments.node.plugins');
      if (plugins) {
        plugins.push(injectProcessPlugin);
      } else {
        _.set(config, 'environments.node.plugins', [injectProcessPlugin]);
      }
    },
    rspack: options => {
      if (options.plugins) {
        options.plugins.push(nodeSchemaPlugin);
      } else {
        _.set(options, 'plugins', [nodeSchemaPlugin]);
      }
      const externals = _.get(options, 'externals');
      if (Array.isArray(externals)) {
        externals.push(esaExternals, externalDebug);
      } else {
        _.set(options, 'externals', [esaExternals, externalDebug]);
      }
    },
  });
};

export const createAliESAPreset: CreatePreset = ({
  appContext,
  modernConfig,
  api,
  needModernServer,
}) => {
  const { appDirectory, distDirectory, entrypoints } = appContext;

  const esaOutput = path.join(appDirectory, '.ali-esa');
  const funcsDirectory = path.join(esaOutput, 'functions');
  const esaDistOutput = path.join(esaOutput, 'dist');
  const staticDirectory = path.join(esaDistOutput, 'static');
  const distStaticDirectory = path.join(distDirectory, `static`);
  return {
    async prepare() {
      await fse.remove(esaOutput);
    },
    async writeOutput() {
      await fse.ensureDir(esaDistOutput);
      await fse.copy(distStaticDirectory, staticDirectory);

      if (!needModernServer) {
        await copyEntriesHtml(
          modernConfig,
          entrypoints,
          distDirectory,
          esaDistOutput,
        );
      }
    },
    async genEntry() {
      if (!needModernServer) {
        return;
      }
      const { code: depCode } = await scanDeps(
        distDirectory,
        appContext.internalDirectory,
        distStaticDirectory,
      );
      const handlerTemplate = (
        await fse.readFile(path.join(__dirname, './ali-esa-handler.mjs'))
      ).toString();
      const handlerCode = await generateHandler(
        handlerTemplate,
        appContext,
        modernConfig,
        depCode,
        'ali-esa',
      );
      await bundleSSR(handlerCode, api, {
        output: {
          externals: [esaExternals, externalDebug],
          distPath: {
            root: funcsDirectory,
            js: '.',
          },
        },
        plugins: [
          injectProcessPlugin,
          createNodePolyfill(polyfillNodeBuiltin as BuiltinModules[]),
        ],
        tools: {
          rspack: {
            plugins: [nodeSchemaPlugin],
          },
        },
      });
    },
  };
};
