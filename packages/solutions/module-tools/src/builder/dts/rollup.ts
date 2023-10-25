import path from 'path';
import { logger } from '@modern-js/utils';
import ts from 'typescript';
import type {
  InputOptions,
  OutputOptions,
  Plugin,
  RollupWatcher,
} from '../../../compiled/rollup';
import type {
  GeneratorDtsConfig,
  Input,
  PluginAPI,
  ModuleTools,
} from '../../types';
import jsonPlugin from '../../../compiled/@rollup/plugin-json';
import dtsPlugin from '../../../compiled/rollup-plugin-dts';
import { mapValue, transformUndefineObject, withLogTitle } from '../../utils';

export type { RollupWatcher };

export const runRollup = async (
  api: PluginAPI<ModuleTools>,
  {
    distPath,
    tsconfigPath,
    externals,
    input,
    watch,
    abortOnError,
    respectExternal,
    appDirectory,
    footer,
    banner,
    dtsExtension,
  }: GeneratorDtsConfig,
) => {
  const ignoreFiles: Plugin = {
    name: 'ignore-files',
    load(id) {
      if (!/\.(js|jsx|ts|tsx|json|cts|mts)$/.test(id)) {
        return '';
      }
      return null;
    },
  };
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    './',
  );

  const baseUrl = path.isAbsolute(options.baseUrl || '.')
    ? options.baseUrl
    : path.join(path.dirname(tsconfigPath), options.baseUrl || '.');
  const ignoreCompileOptions = [
    'incremental',
    'tsBuildInfoFile',
    'sourceMap',
    'inlineSources',
  ];
  const resolveRelative = (p: string) => path.resolve(appDirectory, p);

  // rollup don't have working directory option like esbuild,
  // so we need to resolve relative path.
  const dtsInput: Input = Array.isArray(input)
    ? input.map(resolveRelative)
    : mapValue(input, resolveRelative);

  const inputConfig: InputOptions = {
    input: dtsInput,
    external: externals,
    plugins: [
      jsonPlugin(),
      ignoreFiles,
      dtsPlugin({
        respectExternal,
        compilerOptions: {
          skipLibCheck: true,
          // https://github.com/Swatinem/rollup-plugin-dts/issues/143,
          // but it will cause error when bundle ts which import another ts file.
          preserveSymlinks: false,
          ...options,
          // https://github.com/Swatinem/rollup-plugin-dts/issues/127
          composite: false,
          // https://github.com/Swatinem/rollup-plugin-dts/issues/113
          declarationMap: false,
          // isAbsolute
          baseUrl,
          // Ensure ".d.ts" modules are generated
          declaration: true,
          // Skip ".js" generation
          noEmit: false,
          emitDeclarationOnly: true,
          // Skip code generation when error occurs
          noEmitOnError: true,
          // Avoid extra work
          checkJs: false,
          // Ensure we can parse the latest code
          target: ts.ScriptTarget.ESNext,
          ...transformUndefineObject(ignoreCompileOptions),
        },
        tsconfig: tsconfigPath,
      }),
    ].filter(Boolean),
  };
  const outputConfig: OutputOptions = {
    dir: distPath,
    format: 'esm',
    exports: 'named',
    footer,
    banner,
    entryFileNames: `[name]${dtsExtension}`,
  };
  if (watch) {
    const { watch } = await import('../../../compiled/rollup');
    const runner = api.useHookRunners();
    const watcher = watch({
      ...inputConfig,
      plugins: inputConfig.plugins,
      output: outputConfig,
    }).on('event', async event => {
      if (event.code === 'START') {
        logger.info(withLogTitle('bundle', 'Start build types...'));
      } else if (event.code === 'BUNDLE_END') {
        logger.success(withLogTitle('bundle', 'Build types'));
        runner.buildWatchDts({ buildType: 'bundle' });
      } else if (event.code === 'ERROR') {
        // this is dts rollup plugin bug, error not complete message
      }
    });
    return watcher;
  } else {
    try {
      const { rollup } = await import('../../../compiled/rollup');
      const { addRollupChunk } = await import('../../utils');
      const bundle = await rollup(inputConfig);
      const rollupOutput = await bundle.write(outputConfig);
      addRollupChunk(rollupOutput, appDirectory, outputConfig.dir!);
      return bundle;
    } catch (e) {
      const { printOrThrowDtsErrors } = await import('../../utils');
      await printOrThrowDtsErrors(e, { abortOnError, buildType: 'bundle' });
      return null;
    }
  }
};
