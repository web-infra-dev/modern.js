interface StatsOptionsObj {
  all?: boolean;
  preset?: 'normal' | 'none' | 'verbose' | 'errors-only' | 'errors-warnings';
  assets?: boolean;
  chunks?: boolean;
  modules?: boolean;
  entrypoints?: boolean;
  warnings?: boolean;
  warningsCount?: boolean;
  errors?: boolean;
  errorsCount?: boolean;
  colors?: boolean;

  /** rspack not support below opts */
  groupAssetsByInfo?: boolean;
  groupAssetsByPath?: boolean;
  groupAssetsByChunk?: boolean;
  groupAssetsByExtension?: boolean;
  groupAssetsByEmitStatus?: boolean;
}

/** webpack not support boolean or string */
type StatsOptions = StatsOptionsObj;

interface StatsAssetInfo {
  development?: boolean;
}

export interface StatsAsset {
  type: string;
  name: string;
  size: number;
  chunks?: Array<string | number>;
  chunkNames?: Array<string | number>;
  info: StatsAssetInfo;
}

interface StatsError {
  message: string;
  formatted?: string;
}

interface StatsModule {
  type?: string;
  moduleType?: string;
  identifier?: string;
  name?: string;
  id?: string;
  chunks?: Array<string>;
  size?: number;
}

interface StatsCompilation {
  assets?: Array<StatsAsset>;
  modules?: Array<StatsModule>;
  chunks?: Array<StatsChunk>;
  // entrypoints?: Array<StatsEntrypoint>;
  errors?: Array<StatsError>;
  errorsCount?: number;
  warnings?: Array<StatsError>;
  warningsCount?: number;
}

interface StatsChunk {
  type?: string;
  files?: Array<string>;
  id?: string | number;
  entry: boolean;
  initial: boolean;
  names?: Array<string>;
  size: number;
}

export declare class Stats {
  constructor(statsJson: any);
  hasErrors(): boolean;
  hasWarnings(): boolean;
  toJson(opts?: StatsOptions): StatsCompilation;
  toString(opts?: StatsOptions): string;
}

export declare class MultiStats {
  stats: Stats[];
  hasErrors(): boolean;
  hasWarnings(): boolean;
  toJson(options?: StatsOptions): StatsCompilation;
  toString(options?: StatsOptions): string;
}
