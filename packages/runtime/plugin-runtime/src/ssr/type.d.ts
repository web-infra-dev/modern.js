declare module '@loadable/server' {
  interface ChunkAsset {
    filename?: string;
    integrity?: any;
    scriptType?: 'style' | 'script';
    chunk?: string;
    url?: string;
    path?: string;
    type?: string;
    linkType?: 'preload' | string;
  }
  export class ChunkExtractor {
    chunks: any;

    getScriptTags: () => string;

    collectChunks: (
      jsx: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    ) => ReactElement<any, string | JSXElementConstructor<any>>;

    getChunkAssets: (chunks: any) => ChunkAsset[];

    constructor({ stats, entrypoints });
  }
}
