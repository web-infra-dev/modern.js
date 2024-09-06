declare module 'react-server-dom-webpack/node-register';
declare module 'react-server-dom-webpack/server';

type Reference = {};

type TemporaryReferenceSet = Map<string, Reference | symbol>;

type ImportManifestEntry = {
  id: string;
  chunks: string[];
  name: string;
};

type ModuleLoading = null | {
  prefix: string;
  crossOrigin?: 'use-credentials' | '';
};

type SSRModuleMap = null | {
  [clientId: string]: {
    [clientExportName: string]: ImportManifestEntry;
  };
};

type SSRManifest = {
  moduleMap: SSRModuleMap;
  moduleLoading: ModuleLoading;
};

type ServerManifest = {
  [id: string]: ImportManifestEntry;
};

type ClientManifest = {
  [id: string]: ImportManifestEntry;
};

declare module 'react-server-dom-webpack/server.edge' {
  type Options = {
    environmentName?: string;
    identifierPrefix?: string;
    signal?: AbortSignal;
    temporaryReferences?: TemporaryReferenceSet;
    onError?: ((error: unknown) => void) | undefined;
    onPostpone?: ((reason: string) => void) | undefined;
  };

  export function renderToReadableStream(
    model: ReactClientValue,
    webpackMap: ClientManifest,
    options?: Options,
  ): ReadableStream;
  export function decodeReply<T>(
    body: string | FormData,
    webpackMap?: ServerManifest,
  ): Promise<T>;
}
