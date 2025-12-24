import path from 'node:path';
import { RspackConfig } from '@modern-js/builder';
import { lodash as _, fs as fse } from '@modern-js/utils';
import { RsbuildConfig, type Rspack } from '@rsbuild/core';
import { builtinMappingResolved } from '@rsbuild/plugin-node-polyfill';
import {
  ESM_RESOLVE_CONDITIONS,
  NODE_BUILTIN_MODULES,
  copyDeps,
  copyEntriesHtml,
  externalPkgs,
  generateHandler,
  generateNodeExternals,
  resolveESMDependency,
} from '../edge-utils';
import type { CreatePreset, Setup } from './platform';

export const setupAliESA: Setup = async api => {
  const dep = await resolveESMDependency('@modern-js/prod-server/ali-esa');
  api.modifyRsbuildConfig(config => {
    if (_.get(config, 'environments.node')) {
      _.set(config, 'environments.node.source.entry.modern-server', [dep]);
      _.set(
        config,
        'environments.node.resolve.conditionNames',
        ESM_RESOLVE_CONDITIONS,
      );
      // remove __non_webpack_require__
      _.set(
        config,
        'environments.node.source.define.__non_webpack_require__',
        'undefined',
      );
      // loadable use it
      _.set(config, 'environments.node.source.define.__dirname', "''");
      // Helmet use it, but global object is not exists in ali-esa
      _.set(config, 'environments.node.source.define.global', 'globalThis');
    }
    return config;
  });
  // those modules are builtin in ali-esa
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
  // used in some modules like rslog, we need to polyfill them
  const polyfillNodeBuiltin = ['os', 'tty'];
  // other node builtin modules, we have confirmed that they has not been actually used, so ignore them
  const otherBuiltin = NODE_BUILTIN_MODULES.filter(
    x => !esaNodeModules.includes(x) && !polyfillNodeBuiltin.includes(x),
  );
  const esaExternals = Object.fromEntries([
    ...generateNodeExternals(
      api => `module-import node:${api}`,
      esaNodeModules,
    ),
    ...generateNodeExternals(() => 'var {}', otherBuiltin),
  ]);
  // make a rspack plugin to redirect "node:" prefix request to polyfill
  const rspackPlugin: Rspack.RspackPluginInstance = {
    apply(compiler) {
      compiler.hooks.compilation.tap(
        'ESANodeModulePlugin',
        (_, { normalModuleFactory }) => {
          normalModuleFactory.hooks.resolveForScheme
            .for('node')
            .tap('ESANodeModulePlugin', resourceData => {
              const name = resourceData.resource.replace(/^node:/, '');
              if (polyfillNodeBuiltin.includes(name)) {
                resourceData.path =
                  builtinMappingResolved[
                    name as keyof typeof builtinMappingResolved
                  ]!;
              }
            });
        },
      );
    },
  };
  api.modifyRspackConfig(options => {
    if (options.target === 'node') {
      _.set(options, 'experiments.outputModule', true);
      _.set(options, 'output.library.type', 'module');
      // make sure that node builtin modules are polyfilled
      _.set(options, 'target', 'es2020');
      polyfillNodeBuiltin.forEach(moduleName => {
        _.set(
          options,
          `resolve.fallback[${moduleName}]`,
          builtinMappingResolved[
            moduleName as keyof typeof builtinMappingResolved
          ],
        );
      });
      if (options.plugins) {
        options.plugins.push(rspackPlugin);
      } else {
        _.set(options, 'plugins', [rspackPlugin]);
      }
      const externals = _.get(options, 'externals');
      if (Array.isArray(externals)) {
        externals.push(esaExternals, externalPkgs);
      } else {
        _.set(options, 'externals', [esaExternals, externalPkgs]);
      }
    }
  });
};

export const createAliESAPreset: CreatePreset = (
  appContext,
  modernConfig,
  needModernServer,
) => {
  const { appDirectory, distDirectory, entrypoints } = appContext;

  const esaOutput = path.join(appDirectory, '.ali-esa');
  const funcsDirectory = path.join(esaOutput, 'functions');
  const entryFilePath = path.join(funcsDirectory, 'index.js');
  const esaDistOutput = path.join(esaOutput, 'dist');
  const staticDirectory = path.join(esaOutput, 'static');
  return {
    async prepare() {
      await fse.remove(esaOutput);
    },
    async writeOutput() {
      const distStaticDirectory = path.join(distDirectory, `static`);
      await fse.ensureDir(esaDistOutput);
      await fse.copy(distStaticDirectory, staticDirectory);

      if (!needModernServer) {
        await copyEntriesHtml(
          modernConfig,
          entrypoints,
          distDirectory,
          esaDistOutput,
        );
      } else {
        await fse.ensureDir(funcsDirectory);
        await copyDeps(distDirectory, funcsDirectory, distStaticDirectory);
      }
    },
    async genEntry() {
      if (!needModernServer) {
        return;
      }
      const handlerTemplate = (
        await fse.readFile(path.join(__dirname, './ali-esa-entry.mjs'))
      ).toString();
      const handlerCode = await generateHandler(
        handlerTemplate,
        appContext,
        modernConfig,
      );
      await fse.writeFile(entryFilePath, handlerCode);
    },
  };
};
