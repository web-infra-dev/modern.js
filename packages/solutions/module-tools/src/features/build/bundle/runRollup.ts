import path from 'path';
import { InputOptions, OutputOptions, Plugin } from 'rollup';
import ts from 'typescript';
import hashbangPlugin from 'rollup-plugin-hashbang';
import jsonPlugin from '@rollup/plugin-json';
import { Import, logger } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import type { NormalizedBundleBuildConfig } from '../types';
import { ModuleBuildError } from '../error';

const constants: typeof import('../constants') = Import.lazy(
  '../constants',
  require,
);

// Copied from https://github.com/egoist/tsup/blob/dev/src/rollup.ts

const loadCompilerOptions = (tsconfig?: string) => {
  if (!tsconfig) {
    return {};
  }
  const configFile = ts.readConfigFile(tsconfig, ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    './',
  );
  return options;
};

const dtsPlugin: typeof import('rollup-plugin-dts') = require('rollup-plugin-dts');

type RollupConfig = {
  inputConfig: InputOptions;
  outputConfig: OutputOptions;
};

const getRollupConfig = async (
  api: PluginAPI,
  options: NormalizedBundleBuildConfig,
): Promise<RollupConfig> => {
  const { appDirectory } = api.useAppContext();
  const {
    output: { path: distPath = 'dist' },
  } = api.useResolvedConfigContext();

  const { outputPath, bundleOptions, tsconfig } = options;
  const distDir = path.join(appDirectory, distPath, outputPath);
  const compilerOptions = loadCompilerOptions(tsconfig);
  const dtsOptions = { entry: bundleOptions.entry };

  const ignoreFiles: Plugin = {
    name: 'ignore-files',
    load(id) {
      if (!/\.(js|cjs|mjs|jsx|ts|tsx|mts|json)$/.test(id)) {
        return '';
      }
      return null;
    },
  };

  return {
    inputConfig: {
      input: dtsOptions.entry,
      external: bundleOptions.externals,
      onwarn(warning, handler) {
        if (
          warning.code === 'UNRESOLVED_IMPORT' ||
          warning.code === 'CIRCULAR_DEPENDENCY' ||
          warning.code === 'EMPTY_BUNDLE'
        ) {
          return;
        }
        handler(warning);
      },
      plugins: [
        hashbangPlugin(),
        jsonPlugin(),
        ignoreFiles,
        dtsPlugin.default({
          // use external to prevent them which come from node_modules from be bundled.
          respectExternal: true,
          compilerOptions: {
            ...compilerOptions,
            baseUrl: path.resolve(compilerOptions.baseUrl || '.'),
            // Ensure ".d.ts" modules are generated
            declaration: true,
            // Skip ".js" generation
            noEmit: false,
            emitDeclarationOnly: true,
            // Skip code generation when error occurs
            noEmitOnError: true,
            // Avoid extra work
            checkJs: false,
            skipLibCheck: true,
            // Ensure we can parse the latest code
            target: ts.ScriptTarget.ESNext,
          },
        }),
      ].filter(Boolean),
    },
    outputConfig: {
      dir: distDir,
      format: 'esm',
      exports: 'named',
    },
  };
};

async function runRollup(options: RollupConfig) {
  try {
    const { rollup } = await import('rollup');
    const bundle = await rollup(options.inputConfig);
    await bundle.write(options.outputConfig);
  } catch (e) {
    console.error('bundle failed:dts')
    throw new ModuleBuildError(e);
  }
}

async function watchRollup(options: {
  inputConfig: InputOptions;
  outputConfig: OutputOptions;
}) {
  const { watch } = await import('rollup');
  watch({
    ...options.inputConfig,
    plugins: options.inputConfig.plugins,
    output: options.outputConfig,
  }).on('event', event => {
    if (event.code === 'START') {
      console.info(constants.clearFlag);
      logger.info('[Bundle:DTS] Build start');
    } else if (event.code === 'BUNDLE_END') {
      console.info(`[Bundle:DTS]: Build success`);
    } else if (event.code === 'ERROR') {
      console.error(constants.clearFlag, '[Bundle:DTS]: Build failed');
      console.error(event.error);
    }
  });
}

export const startRollup = async (
  api: PluginAPI,
  options: NormalizedBundleBuildConfig,
) => {
  if (options.enableDts) {
    const config = await getRollupConfig(api, options);
    if (options.watch) {
      watchRollup(config);
    } else {
      await runRollup(config);
    }
  }
};
