interface Error {
  cause?: unknown;
  error?: unknown;
  originalError?: unknown;
}

declare module 'webpack/lib/ChunkRenderError' {
  import { Chunk, Compilation, WebpackError } from 'webpack';

  export default class ChunkRenderError extends WebpackError {
    constructor(chunk: Chunk, compilation: Compilation, error: Error);
  }
}

declare module 'webpack/lib/ModuleParseError' {
  import { WebpackError } from 'webpack';

  export default class ModuleParseError extends WebpackError {
    constructor(
      // eslint-disable-next-line node/prefer-global/buffer
      source: string | Buffer,
      err: Error,
      loaders: string[],
      type: string,
    );
  }
}
