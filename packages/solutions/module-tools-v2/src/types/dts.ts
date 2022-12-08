import type { AliasOption } from './config';

export interface BundlelessGeneratorDtsConfig {
  appDirectory: string;
  distAbsPath: string;
  tsconfigPath: string;
  watch: boolean;
  sourceDir: string;
  alias: AliasOption;
}

export interface ITsconfig {
  compilerOptions?:
    | {
        rootDir?: string;
        baseUrl?: string;
        declaration?: boolean;
        emitDeclarationOnly?: boolean;
        emitDecoratorMetadata?: boolean;
        isolatedModules?: boolean;
        allowJs?: boolean;
        outDir?: string;
        paths?: Record<string, string[]>;
      }
    | undefined;
  include?: string[];
  exclude?: string[];
  extends?: string;
}
