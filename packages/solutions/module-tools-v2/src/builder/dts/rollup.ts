import { InputOptions, OutputOptions, Plugin } from 'rollup';
import dtsPlugin from 'rollup-plugin-dts'
import ts from 'typescript';
import jsonPlugin from '@rollup/plugin-json';
import path from 'path';
import { BundleOptions, Entry } from '../../types';

type Config = {
  distDir: string;
  tsconfigPath: string;
  externals: BundleOptions['externals'];
  entry: Entry;
  watch: boolean;
}

export const runRollup = async ({
  distDir,
  tsconfigPath,
  externals,
  entry,
  watch
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
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    './',
  );
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
          baseUrl: path.resolve(options.baseUrl || '.'),
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
    const { watch } = await import('rollup');
    watch({
      ...inputConfig,
      plugins: inputConfig.plugins,
      output: outputConfig,
    }).on('event', event => {

    });
  } else {
    try {
      const { rollup } = await import('rollup');
      const bundle = await rollup(inputConfig);
      await bundle.write(outputConfig);
    } catch (e) {

    }
  }
}

