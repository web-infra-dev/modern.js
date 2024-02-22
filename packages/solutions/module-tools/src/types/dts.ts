import type { AliasOption, BaseBuildConfig, Input } from './config';

export interface GeneratorDtsConfig {
  appDirectory: string;
  tsconfigPath: string;
  watch: boolean;
  sourceDir: string;
  alias: AliasOption;
  abortOnError?: boolean;
  footer?: string;
  banner?: string;
  distPath: string;
  externals: BaseBuildConfig['externals'];
  input: Input;
  respectExternal: boolean;
  dtsExtension: string;
  userTsconfig: ITsconfig;
  enableTscBuild: boolean;
}

export interface GeneratedDtsInfo {
  userTsconfig: ITsconfig;
  tempTsconfigPath: string;
  tempDistAbsRootPath: string;
  tempDistAbsSrcPath: string;
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
        composite?: boolean;
        incremental?: boolean;
        tsBuildInfoFile?: string;
      }
    | undefined;
  include?: string[];
  exclude?: string[];
  extends?: string | string[];
  references?: { path?: string }[];
}
