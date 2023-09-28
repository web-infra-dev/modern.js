/// <reference types="node" />
/// <reference types="node" />
export = wdm;
/** @typedef {import('../schema-utils3/declarations/validate').Schema} Schema */
/** @typedef {import('webpack').Compiler} Compiler */
/** @typedef {import('webpack').MultiCompiler} MultiCompiler */
/** @typedef {import('webpack').Configuration} Configuration */
/** @typedef {import('webpack').Stats} Stats */
/** @typedef {import('webpack').MultiStats} MultiStats */
/**
 * @typedef {Object} ExtendedServerResponse
 * @property {{ webpack?: { devMiddleware?: Context<IncomingMessage, ServerResponse> } }} [locals]
 */
/** @typedef {import('http').IncomingMessage} IncomingMessage */
/** @typedef {import('http').ServerResponse & ExtendedServerResponse} ServerResponse */
/**
 * @callback NextFunction
 * @param {any} [err]
 * @return {void}
 */
/**
 * @typedef {NonNullable<Configuration["watchOptions"]>} WatchOptions
 */
/**
 * @typedef {Compiler["watching"]} Watching
 */
/**
 * @typedef {ReturnType<Compiler["watch"]>} MultiWatching
 */
/**
 * @typedef {Compiler["outputFileSystem"] & { createReadStream?: import('fs').createReadStream, statSync?: import('fs').statSync, lstat?: import('fs').lstat, readFileSync?: import('fs').readFileSync }} OutputFileSystem
 */
/** @typedef {ReturnType<Compiler["getInfrastructureLogger"]>} Logger */
/**
 * @callback Callback
 * @param {Stats | MultiStats} [stats]
 */
/**
 * @template {IncomingMessage} RequestInternal
 * @template {ServerResponse} ResponseInternal
 * @typedef {Object} Context
 * @property {boolean} state
 * @property {Stats | MultiStats | undefined} stats
 * @property {Callback[]} callbacks
 * @property {Options<RequestInternal, ResponseInternal>} options
 * @property {Compiler | MultiCompiler} compiler
 * @property {Watching | MultiWatching} watching
 * @property {Logger} logger
 * @property {OutputFileSystem} outputFileSystem
 */
/**
 * @template {IncomingMessage} RequestInternal
 * @template {ServerResponse} ResponseInternal
 * @typedef {Record<string, string | number> | Array<{ key: string, value: number | string }> | ((req: RequestInternal, res: ResponseInternal, context: Context<RequestInternal, ResponseInternal>) =>  void | undefined | Record<string, string | number>) | undefined} Headers
 */
/**
 * @template {IncomingMessage} RequestInternal
 * @template {ServerResponse} ResponseInternal
 * @typedef {Object} Options
 * @property {{[key: string]: string}} [mimeTypes]
 * @property {boolean | ((targetPath: string) => boolean)} [writeToDisk]
 * @property {string} [methods]
 * @property {Headers<RequestInternal, ResponseInternal>} [headers]
 * @property {NonNullable<Configuration["output"]>["publicPath"]} [publicPath]
 * @property {Configuration["stats"]} [stats]
 * @property {boolean} [serverSideRender]
 * @property {OutputFileSystem} [outputFileSystem]
 * @property {boolean | string} [index]
 */
/**
 * @template {IncomingMessage} RequestInternal
 * @template {ServerResponse} ResponseInternal
 * @callback Middleware
 * @param {RequestInternal} req
 * @param {ResponseInternal} res
 * @param {NextFunction} next
 * @return {Promise<void>}
 */
/**
 * @callback GetFilenameFromUrl
 * @param {string} url
 * @returns {string | undefined}
 */
/**
 * @callback WaitUntilValid
 * @param {Callback} callback
 */
/**
 * @callback Invalidate
 * @param {Callback} callback
 */
/**
 * @callback Close
 * @param {(err: Error | null | undefined) => void} callback
 */
/**
 * @template {IncomingMessage} RequestInternal
 * @template {ServerResponse} ResponseInternal
 * @typedef {Object} AdditionalMethods
 * @property {GetFilenameFromUrl} getFilenameFromUrl
 * @property {WaitUntilValid} waitUntilValid
 * @property {Invalidate} invalidate
 * @property {Close} close
 * @property {Context<RequestInternal, ResponseInternal>} context
 */
/**
 * @template {IncomingMessage} RequestInternal
 * @template {ServerResponse} ResponseInternal
 * @typedef {Middleware<RequestInternal, ResponseInternal> & AdditionalMethods<RequestInternal, ResponseInternal>} API
 */
/**
 * @template {IncomingMessage} RequestInternal
 * @template {ServerResponse} ResponseInternal
 * @param {Compiler | MultiCompiler} compiler
 * @param {Options<RequestInternal, ResponseInternal>} [options]
 * @returns {API<RequestInternal, ResponseInternal>}
 */
declare function wdm<
  RequestInternal extends import('http').IncomingMessage,
  ResponseInternal extends ServerResponse
>(
  compiler: Compiler | MultiCompiler,
  options?: Options<RequestInternal, ResponseInternal> | undefined
): API<RequestInternal, ResponseInternal>;
declare namespace wdm {
  export {
    Schema,
    Compiler,
    MultiCompiler,
    Configuration,
    Stats,
    MultiStats,
    ExtendedServerResponse,
    IncomingMessage,
    ServerResponse,
    NextFunction,
    WatchOptions,
    Watching,
    MultiWatching,
    OutputFileSystem,
    Logger,
    Callback,
    Context,
    Headers,
    Options,
    Middleware,
    GetFilenameFromUrl,
    WaitUntilValid,
    Invalidate,
    Close,
    AdditionalMethods,
    API,
  };
}
type ServerResponse = import('http').ServerResponse & ExtendedServerResponse;
type Compiler = import('webpack').Compiler;
type MultiCompiler = import('webpack').MultiCompiler;
type Options<
  RequestInternal extends import('http').IncomingMessage,
  ResponseInternal extends ServerResponse
> = {
  mimeTypes?:
    | {
        [key: string]: string;
      }
    | undefined;
  writeToDisk?: boolean | ((targetPath: string) => boolean) | undefined;
  methods?: string | undefined;
  headers?: Headers<RequestInternal, ResponseInternal>;
  publicPath?: NonNullable<Configuration["output"]>["publicPath"];
  stats?: Configuration["stats"];
  serverSideRender?: boolean | undefined;
  outputFileSystem?: OutputFileSystem | undefined;
  index?: string | boolean | undefined;
};
type API<
  RequestInternal extends import('http').IncomingMessage,
  ResponseInternal extends ServerResponse
> = Middleware<RequestInternal, ResponseInternal> &
  AdditionalMethods<RequestInternal, ResponseInternal>;
type Schema = import('../schema-utils3/declarations/validate').Schema;
type Configuration = import('webpack').Configuration;
type Stats = import('webpack').Stats;
type MultiStats = import('webpack').MultiStats;
type ExtendedServerResponse = {
  locals?:
    | {
        webpack?:
          | {
              devMiddleware?:
                | Context<import('http').IncomingMessage, ServerResponse>
                | undefined;
            }
          | undefined;
      }
    | undefined;
};
type IncomingMessage = import('http').IncomingMessage;
type NextFunction = (err?: any) => void;
type WatchOptions = NonNullable<Configuration["watchOptions"]>;
type Watching = Compiler["watching"];
type MultiWatching = ReturnType<Compiler["watch"]>;
type OutputFileSystem = Compiler["outputFileSystem"] & {
  createReadStream?: typeof import('fs').createReadStream;
  statSync?: import('fs').StatSyncFn;
  lstat?: typeof import('fs').lstat;
  readFileSync?: typeof import('fs').readFileSync;
};
type Logger = ReturnType<Compiler["getInfrastructureLogger"]>;
type Callback = (
  stats?: import('webpack').Stats | import('webpack').MultiStats | undefined
) => any;
type Context<
  RequestInternal extends import('http').IncomingMessage,
  ResponseInternal extends ServerResponse
> = {
  state: boolean;
  stats: Stats | MultiStats | undefined;
  callbacks: Callback[];
  options: Options<RequestInternal, ResponseInternal>;
  compiler: Compiler | MultiCompiler;
  watching: Watching | MultiWatching;
  logger: Logger;
  outputFileSystem: OutputFileSystem;
};
type Headers<
  RequestInternal extends import('http').IncomingMessage,
  ResponseInternal extends ServerResponse
> =
  | Record<string, string | number>
  | {
      key: string;
      value: number | string;
    }[]
  | ((
      req: RequestInternal,
      res: ResponseInternal,
      context: Context<RequestInternal, ResponseInternal>
    ) => void | undefined | Record<string, string | number>)
  | undefined;
type Middleware<
  RequestInternal extends import('http').IncomingMessage,
  ResponseInternal extends ServerResponse
> = (
  req: RequestInternal,
  res: ResponseInternal,
  next: NextFunction
) => Promise<void>;
type GetFilenameFromUrl = (url: string) => string | undefined;
type WaitUntilValid = (callback: Callback) => any;
type Invalidate = (callback: Callback) => any;
type Close = (callback: (err: Error | null | undefined) => void) => any;
type AdditionalMethods<
  RequestInternal extends import('http').IncomingMessage,
  ResponseInternal extends ServerResponse
> = {
  getFilenameFromUrl: GetFilenameFromUrl;
  waitUntilValid: WaitUntilValid;
  invalidate: Invalidate;
  close: Close;
  context: Context<RequestInternal, ResponseInternal>;
};
