import path from 'path';
import type {
  InputOptions,
  OutputOptions,
  Plugin,
  RollupWatcher,
} from '../../../compiled/rollup';
import type { BundleOptions, Entry } from '../../types';

export type { RollupWatcher };

type Config = {
  distDir: string;
  tsconfigPath: string;
  externals: BundleOptions['externals'];
  entry: Entry;
  watch: boolean;
};

export const runRollup = async ({
  distDir,
  tsconfigPath,
  externals,
  entry,
  watch,
}: Config) => {
  const ignoreFiles: Plugin = {
    name: 'ignore-files',
    load(id) {
      if (!/\.(js|jsx|ts|tsx|json)$/.test(id)) {
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
    input: entry,
    external: externals,
    plugins: [
      jsonPlugin(),
      ignoreFiles,
      dtsPlugin({
        // use external to prevent them which come from node_modules from be bundled.
        respectExternal: true,
        compilerOptions: {
          ...options,
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
          declarationMap: false,
          skipLibCheck: true,
          preserveSymlinks: false,
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
      } else if (event.code === 'ERROR') {
        // this is dts rollup plugin bug, error not complete message
      }
    });
    return watcher;
  } else {
    try {
      const { rollup } = await import('../../../compiled/rollup');
      const bundle = await rollup(inputConfig);
      await bundle.write(outputConfig);
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
