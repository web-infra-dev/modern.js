// import type { renderToString, renderToStaticMarkup } from 'react-dom/server';

declare module '@loadable/server' {
  interface ChunkAsset {
    filename?: string;
    integrity?: any;
    scriptType?: 'style' | 'script';
    chunk?: string;
    url?: string;
    path?: string;
    type?: string;
    linkeType?: 'preload' | string;
  }
  export class ChunkExtractor {
    chunks: any;

    getScriptTags: () => string;

    collectChunks: (
      jsx: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    ) => ReactElement<any, string | JSXElementConstructor<any>>;

    getChunkAssets: (chunks: any) => ChunkAsset[];

    constructor({ statsFile, entrypoints });
  }
}

declare module 'react-dom/server' {
  // modern.js only has @types/react-dom@17;
  // extend react-dom@18 types, fork from @types/react-dom18.0.6
  export interface RenderToPipeableStreamOptions {
    identifierPrefix?: string;
    namespaceURI?: string;
    nonce?: string;
    bootstrapScriptContent?: string;
    bootstrapScripts?: string[];
    bootstrapModules?: string[];
    progressiveChunkSize?: number;
    onShellReady?: () => void;
    onShellError?: (error: unknown) => void;
    onAllReady?: () => void;
    onError?: (error: unknown) => void;
  }

  export interface PipeableStream {
    // eslint-disable-next-line @typescript-eslint/method-signature-style
    abort(): void;
    // eslint-disable-next-line @typescript-eslint/method-signature-style
    pipe<Writable extends NodeJS.WritableStream>(
      destination: Writable,
    ): Writable;
  }

  /**
   * Only available in the environments with [Node.js Streams](https://nodejs.dev/learn/nodejs-streams).
   *
   * @see [API](https://reactjs.org/docs/react-dom-server.html#rendertopipeablestream)
   *
   * @param children
   * @param options
   */
  export function renderToPipeableStream(
    children: ReactNode,
    options?: RenderToPipeableStreamOptions,
  ): PipeableStream;

  /**
   * Render a React element to its initial HTML. This should only be used on the server.
   * React will return an HTML string. You can use this method to generate HTML on the server
   * and send the markup down on the initial request for faster page loads and to allow search
   * engines to crawl your pages for SEO purposes.
   *
   * If you call `ReactDOM.hydrate()` on a node that already has this server-rendered markup,
   * React will preserve it and only attach event handlers, allowing you
   * to have a very performant first-load experience.
   */
  export function renderToString(element: ReactElement): string;

  /**
   * Similar to `renderToString`, except this doesn't create extra DOM attributes
   * such as `data-reactid`, that React uses internally. This is useful if you want
   * to use React as a simple static page generator, as stripping away the extra
   * attributes can save lots of bytes.
   */
  export function renderToStaticMarkup(element: ReactElement): string;
}
