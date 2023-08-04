export type Asset = {
  outdir?: string;
  /**
   * rebase relative url, default is true when format is 'cjs' or 'esm'.
   */
  rebase?: boolean;
  name?: string | ((filePath: string) => string);
  /**
   * Specify the limit size to inline
   * @default 0
   */
  limit?: number;
  publicPath?: string | ((filePath: string) => string);
};

export type AssetNormalized = Required<Asset>;
