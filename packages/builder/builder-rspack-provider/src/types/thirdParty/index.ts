import { RspackOptions } from '@rspack/core/dist/config';

export { Stats } from '@rspack/core/dist/stats';

type RspackConfig = RspackOptions;

export interface StatsAssetInfo {
  development: boolean;
}

export interface StatsAsset {
  type: string;
  name: string;
  size: number;
  chunks: Array<string>;
  chunkNames: Array<string>;
  info: StatsAssetInfo;
}

export type { RspackConfig };
