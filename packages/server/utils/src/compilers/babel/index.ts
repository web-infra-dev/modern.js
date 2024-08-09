import * as path from 'path';
import { fs, json5, getAliasConfig } from '@modern-js/utils';
import { compiler } from '@modern-js/babel-compiler';
import { CompileFunc, FILE_EXTENSIONS } from '../../common';
import { getBabelConfig, applyUserBabelConfig } from './preset';

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

export interface IPackageModeValue {
  tsconfigPath: string;
}

export const resolveBabelConfig = (
  appDirectory: string,
  config: Parameters<CompileFunc>[1],
  option: IPackageModeValue,
  isEsm?: boolean,
): any => {
  const { alias, babelConfig } = config;
  // alias config
  const aliasConfig = getAliasConfig(alias, {
    appDirectory,
    ...option,
  });

  // babel config
  const defaultBabelConfig = getBabelConfig({
    appDirectory,
    alias: aliasConfig,
    isEsm
  });

  return applyUserBabelConfig(defaultBabelConfig, babelConfig);
};

export const compileByBabel: CompileFunc = async (
  appDirectory,
  config,
  compileOptions,
) => {
  const { sourceDirs, distDir, tsconfigPath, moduleType } = compileOptions;
  const isEsm = moduleType === 'module';
  const results = await Promise.all(
    sourceDirs.map(async sourceDir => {
      const babelConfig = resolveBabelConfig(appDirectory, config, {
        tsconfigPath: tsconfigPath ? tsconfigPath : '',
      }, isEsm);
      if (await fs.pathExists(sourceDir)) {
        const basename = path.basename(sourceDir);
        const targetDir = path.join(distDir, basename);
        await fs.copy(sourceDir, targetDir, {
          filter: src =>
            !['.ts', '.js'].includes(path.extname(src)) && src !== tsconfigPath,
        });
      }
      return compiler(
        {
          rootDir: appDirectory,
          distDir,
          sourceDir,
          extensions: FILE_EXTENSIONS,
        },
        babelConfig,
      );
    }),
  );
  results.forEach(result => {
    if (result.code === 1) {
      throw new Error(result.message);
    }
  });
};
