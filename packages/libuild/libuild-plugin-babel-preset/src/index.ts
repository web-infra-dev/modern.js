import type { LibuildPlugin } from '@modern-js/libuild';
import type { TransformOptions as BabelTransformOptions } from '@babel/core';
import { isJsExt, isJsLoader, resolvePathAndQuery } from '@modern-js/libuild-utils';

export interface BabelPluginImportOptions {
  libraryName: string;
  /**
   * @default "lib"
   */
  libraryDirectory?: string;

  /**
   * @default true
   */
  camel2DashComponentName?: boolean;

  style: boolean | ((name: string) => string);

  styleLibraryDirectory?: string;

  customName?: string;

  customStyleName?: string;

  transformToDefaultImport?: boolean;
}
export interface BabelReactOptions {
  /**
   * @default "React.createElement" (only in classic runtime)
   */
  pragma?: string;
  /**
   * @default "React.Fragment" (only in classic runtime)
   */
  pragmaFrag?: string;
  /**
   * @default true
   */
  throwIfNamespace?: boolean;
  /**
   * @default "classic"
   */
  runtime?: 'classic' | 'automatic';

  /**
   * @default "react"  (only in automatic runtime)
   */
  importSource?: string;
}

export interface BabelPresetOption {
  /**
   * @description babel-plugin-import options
   */
  import?: BabelPluginImportOptions | BabelPluginImportOptions[];
  /**
   * @description @babel/preset-react options.
   */
  react?: BabelReactOptions;
}

export const babelPresetPlugin = (
  preset: BabelPresetOption = {},
  options: BabelTransformOptions = {}
): LibuildPlugin => {
  return {
    name: 'libuild:babel-preset',
    apply(compiler) {
      compiler.hooks.transform.tapPromise('babel', async (args) => {
        const { originalFilePath } = resolvePathAndQuery(args.path);
        if (isJsExt(originalFilePath) || isJsLoader(args.loader)) {
          const isTsx = args.loader === 'tsx' || /\.tsx$/i.test(originalFilePath);
          const { plugins, presets } = normalizeBabel(preset, isTsx);
          const result = await require('@babel/core').transformAsync(args.code, {
            ...options,
            exclude: [/\bcore-js\b/],
            inputSourceMap: false,
            filename: originalFilePath,
            sourceFileName: originalFilePath,
            sourceMaps: Boolean(compiler.config.sourceMap),
            babelrc: false,
            configFile: false,
            compact: false,
            presets: [...presets, ...(options.presets || [])],
            plugins: [...plugins, ...(options.plugins || [])],
          });

          return {
            ...args,
            code: result?.code,
            map: result?.map,
          };
        }
        /* c8 ignore start */
        return args;
        /* c8 ignore stop */
      });
    },
  };
};

function normalizeBabel(preset: BabelPresetOption, isTsx: boolean) {
  const presets = [[require('@babel/preset-typescript'), isTsx ? { isTSX: true, allExtensions: true } : {}]];

  /* c8 ignore start */
  if (preset.react || preset.import) {
    presets.push([require('@babel/preset-react'), preset.react]);
  }

  const plugins = [];

  if (preset.import) {
    if (Array.isArray(preset.import)) {
      plugins.push(
        ...preset.import.map((o, i) => {
          return [require('babel-plugin-import'), o, String(i)];
        })
      );
    } else if (typeof preset.import === 'object') {
      plugins.push([require('babel-plugin-import'), preset.import]);
    }
  }
  /* c8 ignore stop */
  return { presets, plugins };
}
