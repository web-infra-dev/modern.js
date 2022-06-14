export type TsLoaderOptions = {
  colors?: boolean;
  silent?: boolean;
  context?: string;
  instance?: string;
  logLevel?: string;
  compiler?: string;
  configFile?: string;
  reportFiles?: string[];
  transpileOnly?: boolean;
  happyPackMode?: boolean;
  errorFormatter?: (
    message: Record<string, unknown>,
    colors: boolean,
  ) => string;
  logInfoToStdOut?: boolean;
  compilerOptions?: Record<string, unknown>;
  appendTsSuffixTo?: (RegExp | string)[];
  appendTsxSuffixTo?: (RegExp | string)[];
  projectReferences?: boolean;
  ignoreDiagnostics?: number[];
  allowTsInNodeModules?: boolean;
  experimentalFileCaching?: boolean;
  onlyCompileBundledFiles?: boolean;
  useCaseSensitiveFileNames?: boolean;
};
