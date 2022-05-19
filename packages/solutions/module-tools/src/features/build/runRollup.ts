import path from 'path';
import { InputOptions, OutputOptions, Plugin } from 'rollup';
import ts from 'typescript';
import hashbangPlugin from 'rollup-plugin-hashbang';
import jsonPlugin from '@rollup/plugin-json';
import { Import } from '@modern-js/utils';
import { TaskBuildConfig } from '../../types';

const logger: typeof import('../../features/build/logger') = Import.lazy(
  '../../features/build/logger',
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

const getRollupConfig = async (options: TaskBuildConfig): Promise<RollupConfig> => {
  const distDir = path.join(options.appDirectory, `./dist/types`)
  const compilerOptions = loadCompilerOptions(options.tsconfig);
  const dtsOptions = { entry: options.entry };

  const ignoreFiles: Plugin = {
    name: 'ignore-files',
    load(id) {
      if (!/\.(js|cjs|mjs|jsx|ts|tsx|mts|json)$/.test(id)) {
        return '';
      }
    },
  };

  return {
    inputConfig: {
      input: dtsOptions.entry,
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
            declarationMap: false,
            skipLibCheck: true,
            preserveSymlinks: false,
            // Ensure we can parse the latest code
            target: ts.ScriptTarget.ESNext,
          },
        }),
      ].filter(Boolean),
    },
    outputConfig: {
      dir: distDir || 'dist',
      format: 'esm',
      exports: 'named',
    },
  };
};

async function runRollup(options: RollupConfig) {
  const { rollup } = await import('rollup');
  try {
    const start = Date.now();
    const getDuration = () => {
      return `${Math.floor(Date.now() - start)}ms`;
    };
    console.info('dts', 'Build start');
    const bundle = await rollup(options.inputConfig);
    await bundle.write(options.outputConfig);
    console.info('dts', `Build success in ${getDuration()}`);
  } catch (error) {
    console.error('dts', 'Build error');
    console.error(error);
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
      console.info(logger.clearFlag);
      console.info('dts', 'Build start');
    } else if (event.code === 'BUNDLE_END') {
      console.info('dts', `Build success in ${event.duration}ms`);
    } else if (event.code === 'ERROR') {
      console.error(logger.clearFlag, 'dts', 'Build failed');
      console.error(event.error);
    }
  });
}

export const startRollup = async (options: TaskBuildConfig) => {
  if(options.dts) {
    const config = await getRollupConfig(options);
    if (options.enableWatchMode) {
      watchRollup(config);
    } else {
      await runRollup(config);
    }
  }
};

