import path from 'path';
import { InputOptions, OutputOptions, Plugin } from 'rollup';
import ts from 'typescript';
import hashbangPlugin from 'rollup-plugin-hashbang';
import jsonPlugin from '@rollup/plugin-json';
import { Import } from '@modern-js/utils';
import { TsResolveOptions, tsResolvePlugin } from './ts-resolve';

const argv: typeof import('process.argv').default = Import.lazy(
  'process.argv',
  require,
);
const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
const logger: typeof import('../../features/build/logger') = Import.lazy(
  '../../features/build/logger',
  require,
);
interface ITaskConfig {
  distDir: string;
  watch: boolean;
  entry: string;
  tsconfig: string;
}

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

const getRollupConfig = async (options: ITaskConfig): Promise<RollupConfig> => {
  const compilerOptions = loadCompilerOptions(options.tsconfig);
  // FIXME: ts-resolve plugin and resolve option
  const dtsOptions = { entry: options.entry, resolve: false };

  // if (Array.isArray(dtsOptions.entry) && dtsOptions.entry.length > 1) {
  //   dtsOptions.entry = toObjectEntry(dtsOptions.entry)
  // }

  let tsResolveOptions: TsResolveOptions | undefined;
  if (dtsOptions.resolve) {
    tsResolveOptions = {};
    // Only resolve specific types when `dts.resolve` is an array
    if (Array.isArray(dtsOptions.resolve)) {
      tsResolveOptions.resolveOnly = dtsOptions.resolve;
    }

    // `paths` should be handled by rollup-plugin-dts
    if (compilerOptions.paths) {
      const res = Object.keys(compilerOptions.paths).map(
        p => new RegExp(`^${p.replace('*', '.+')}$`),
      );
      tsResolveOptions.ignore = source => {
        return res.some(re => re.test(source));
      };
    }
  }

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
        tsResolveOptions && tsResolvePlugin(tsResolveOptions),
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
      dir: options.distDir || 'dist',
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

const startRollup = async (options: ITaskConfig) => {
  const config = await getRollupConfig(options);
  if (options.watch) {
    watchRollup(config);
  } else {
    await runRollup(config);
  }
};

const taskMain = async () => {
  // Execution of the script's parameter handling and related required configuration acquisition
  const processArgv = argv(process.argv.slice(2));
  const config = processArgv<ITaskConfig>({} as ITaskConfig);

  await startRollup(config);
};

(async () => {
  await core.manager.run(async () => {
    try {
      await taskMain();
    } catch (e) {
      console.error(e);
    }
  });
})();
