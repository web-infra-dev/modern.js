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
  enableInlineRouteManifests?: boolean;
  disableInlineRouteManifests?: boolean;
  path?: string;
  assetPrefix?: string;
  polyfill?: 'entry' | 'usage' | 'ua' | 'off';

  /**
   * @deprecated use `output.inlineScripts` instead
   */
  enableInlineScripts?: boolean;

  /**
   * @deprecated use `output.inlineStyles` instead
   */
  enableInlineStyles?: boolean;
}

export type OutputNormalizedConfig = OutputUserConfig;
