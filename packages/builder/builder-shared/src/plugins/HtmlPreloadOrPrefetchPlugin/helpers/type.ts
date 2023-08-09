import type HtmlWebpackPlugin from 'html-webpack-plugin';

export type BeforeAssetTagGenerationHtmlPluginData = {
  assets: {
    publicPath: string;
    js: Array<string>;
    css: Array<string>;
    favicon?: string;
    manifest?: string;
  };
  outputName: string;
  plugin: HtmlWebpackPlugin;
};

export type As =
  | 'audio'
  | 'document'
  | 'embed'
  | 'fetch'
  | 'font'
  | 'image'
  | 'object'
  | 'script'
  | 'style'
  | 'track'
  | 'worker'
  | 'video';
