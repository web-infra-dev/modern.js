import type { AliasOption } from './config';

export interface BundlelessGeneratorDtsConfig {
  appDirectory: string;
  distAbsPath: string;
  tsconfigPath: string;
  watch: boolean;
  sourceDir: string;
  alias: AliasOption;
  abortOnError?: boolean;
}

export type TsTarget =
  | 'es3'
  | 'es5'
  | 'es6'
  | 'es2015'
  | 'es2016'
  | 'es2017'
  | 'es2018'
  | 'es2019'
  | 'es2020'
  | 'es2021'
  | 'es2022'
  | 'esnext';

export interface ITsconfig {
  compilerOptions?:
    | {
        rootDir?: string;
        baseUrl?: string;
        declaration?: boolean;
        declarationDir?: string;
        emitDeclarationOnly?: boolean;
        emitDecoratorMetadata?: boolean;
        isolatedModules?: boolean;
        allowJs?: boolean;
        outDir?: string;
        paths?: Record<string, string[]>;
        target?: TsTarget;
        useDefineForClassFields?: boolean;
      }
    | undefined;
  include?: string[];
  exclude?: string[];
  extends?: string;
}
