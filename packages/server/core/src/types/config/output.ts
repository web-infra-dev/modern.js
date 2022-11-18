export interface OutputUserConfig {
  distPath?: {
    root?: string;
    js?: string;
    css?: string;
    svg?: string;
    font?: string;
    html?: string;
    image?: string;
    media?: string;
    server?: string;
  };
  assetPrefix?: string;
}

export type OutputNormalizedConfig = OutputUserConfig;
