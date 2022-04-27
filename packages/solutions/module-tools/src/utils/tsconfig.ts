import { fs, json5 } from '@modern-js/utils';

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
