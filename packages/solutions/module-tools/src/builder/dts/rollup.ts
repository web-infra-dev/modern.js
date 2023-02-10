import path from 'path';
import type {
  InputOptions,
  OutputOptions,
  Plugin,
  RollupWatcher,
} from '../../../compiled/rollup';
import type {
  BaseBuildConfig,
  Input,
  PluginAPI,
  ModuleTools,
} from '../../types';

export type { RollupWatcher };

type Config = {
  distDir: string;
  tsconfigPath: string;
  externals: BaseBuildConfig['externals'];
  input: Input;
  watch: boolean;
};

export const runRollup = async (
  api: PluginAPI<ModuleTools>,
  { distDir, tsconfigPath, externals, input, watch }: Config,
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
  const ts = await import('typescript');
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    './',
  );

  const { default: jsonPlugin } = await import(
    '../../../compiled/@rollup/plugin-json'
  );
  const { default: dtsPlugin } = await import(
    '../../../compiled/rollup-plugin-dts'
  );
  const baseUrl = path.isAbsolute(options.baseUrl || '.')
    ? options.baseUrl
    : path.join(path.dirname(tsconfigPath), options.baseUrl || '.');
  const inputConfig: InputOptions = {
    input,
    external: externals,
    plugins: [
      jsonPlugin(),
      ignoreFiles,
      dtsPlugin({
        // use external to prevent them which come from node_modules from be bundled.
        respectExternal: true,
        compilerOptions: {
          declarationMap: false,
          skipLibCheck: true,
          // https://github.com/Swatinem/rollup-plugin-dts/issues/143,
          // but it will cause error when bundle ts which import another ts file.
          preserveSymlinks: false,
          ...options,
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
        },
      }),
    ].filter(Boolean),
  };
  const outputConfig: OutputOptions = {
    dir: distDir,
    format: 'esm',
    exports: 'named',
  };
  if (watch) {
    const { watch } = await import('../../../compiled/rollup');
    const { watchSectionTitle } = await import('../../utils/log');
    const { SectionTitleStatus, BundleDtsLogPrefix } = await import(
      '../../constants/log'
    );
    const runner = api.useHookRunners();
    const watcher = watch({
      ...inputConfig,
      plugins: inputConfig.plugins,
      output: outputConfig,
    }).on('event', async event => {
      if (event.code === 'START') {
        console.info(
          await watchSectionTitle(BundleDtsLogPrefix, SectionTitleStatus.Log),
        );
      } else if (event.code === 'BUNDLE_END') {
        console.info(
          await watchSectionTitle(
            BundleDtsLogPrefix,
            SectionTitleStatus.Success,
          ),
        );
        runner.buildWatchDts({ buildType: 'bundle' });
      } else if (event.code === 'ERROR') {
        // this is dts rollup plugin bug, error not complete message
      }
    });
    return watcher;
  } else {
    try {
      const { rollup } = await import('../../../compiled/rollup');
      const { addRollupChunk } = await import('../../utils/print');
      const bundle = await rollup(inputConfig);
      const rollupOutput = await bundle.write(outputConfig);
      const { appDirectory } = api.useAppContext();
      addRollupChunk(rollupOutput, appDirectory, outputConfig.dir!);
      return bundle;
    } catch (e) {
      if (e instanceof Error) {
        const { InternalDTSError } = await import('../../error');
        throw new InternalDTSError(e, {
          buildType: 'bundle',
        });
      }
      throw e;
    }
  }
};
