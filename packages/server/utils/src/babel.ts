import {
  getBabelChain,
  ILibPresetOption,
  ISyntaxOption,
  applyUserBabelConfig,
} from '@modern-js/babel-preset-lib';
import { TransformOptions } from '@babel/core';
import { fs, json5, getAlias, applyOptionsChain } from '@modern-js/utils';
import type { NormalizedConfig } from '@modern-js/core';

export * from '@babel/core';

export interface ITsconfig {
  compilerOptions?:
    | {
        rootDir?: string;
        baseUrl?: string;
        declaration?: boolean;
        emitDeclarationOnly?: boolean;
        isolatedModules?: boolean;
        allowJs?: boolean;
        outDir?: string;
        paths?: Record<string, string[]>;
      }
    | undefined;
  include?: string[];
  exclude?: string[];
}

export const readTsConfig = <T extends null | ITsconfig>(
  tsconfigPath: string,
  noExistReturn: T = null as T,
): ITsconfig | T => {
  // 如果不存在，则返回 noExistReturn
  if (!fs.existsSync(tsconfigPath)) {
    return noExistReturn;
  }
  const content = fs.readFileSync(tsconfigPath, 'utf-8');
  return json5.parse(content);
};

export const existTsConfigFile = (tsconfigAbsolutePath: string) => {
  const tsconfig = readTsConfig(tsconfigAbsolutePath);
  return Boolean(tsconfig);
};

export const getBabelConfig = (
  libPresetOption: ILibPresetOption,
  syntaxOption: ISyntaxOption,
): TransformOptions => {
  const chain = getBabelChain(libPresetOption, syntaxOption);

  return {
    sourceType: 'unambiguous',
    ...chain.toJSON(),
  };
};

export interface IPackageModeValue {
  type: 'module' | 'commonjs';
  syntax: 'es5' | 'es6+';
  tsconfigPath: string;
}

export const resolveBabelConfig = (
  appDirectory: string,
  modernConfig: NormalizedConfig,
  option: IPackageModeValue,
  // FIXME: babel type can't pass type checking
): any => {
  const {
    source: {
      envVars,
      globalVars,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      jsxTransformRuntime = 'automatic',
    },
    tools: { lodash: userLodashOption },
  } = modernConfig;

  // alias config
  const aliasConfig = getAlias(modernConfig.source.alias, {
    appDirectory,
    ...option,
  });

  // lodash config
  const lodashOptions = applyOptionsChain(
    { id: ['lodash', 'ramda'] },
    // TODO: 需要处理类型问题
    userLodashOption as any,
  );
  // babel config
  const babelChain = getBabelChain(
    {
      appDirectory,
      enableReactPreset: true,
      enableTypescriptPreset: true,
      alias: aliasConfig,
      envVars,
      globalVars,
      lodashOptions,
      jsxTransformRuntime,
    },
    {
      type: option.type,
      syntax: option.syntax,
    },
  );

  const envOptions = babelChain.preset('@babel/preset-env').options();
  babelChain
    .preset('@babel/preset-env')
    .use(require.resolve('@babel/preset-env'), [
      {
        ...envOptions[0],
        loose: true,
      },
    ]);

  babelChain.plugin('babel-plugin-transform-typescript-metadata').use(
    require.resolve('babel-plugin-transform-typescript-metadata'),

    [],
  );

  babelChain
    .plugin('@babel/plugin-proposal-decorators')
    .use(require.resolve('@babel/plugin-proposal-decorators'), [
      { legacy: true },
    ]);

  // resolve "Definitely assigned fields cannot be initialized here, but only in the constructor."
  babelChain
    .plugin('@babel/plugin-proposal-class-properties')
    .use(require.resolve('@babel/plugin-proposal-class-properties'), [
      {
        loose: true,
      },
    ]);

  const internalBabelConfig = { ...babelChain.toJSON() };

  const userBabelConfig = modernConfig.tools.babel;

  return applyUserBabelConfig(internalBabelConfig, userBabelConfig);
};
