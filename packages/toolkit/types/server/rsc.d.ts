export type ImportManifestEntry = {
  id: string | number;
  chunks: (string | number)[];
  styles?: string[];
  name: string;
};

export interface ClientReference {
  readonly id: string | number;
  readonly exportName: string;
  ssrId?: string | number;
}

export interface ClientManifest {
  [id: string]: ImportManifestEntry;
}

export interface ServerManifest {
  [id: string]: ImportManifestEntry;
}

export interface ServerReferencesModuleInfo {
  readonly exportNames: string[];
  moduleId?: string | number;
  federationRef?: {
    remote: string;
    expose: string;
  };
}

export type ClientReferencesMap = Map<string, ClientReference[]>;

export type ServerReferencesMap = Map<string, ServerReferencesModuleInfo>;

export type ModuleLoading = null | {
  prefix: string;
  crossOrigin?: 'use-credentials' | '';
};

export type SSRModuleMap = {
  [clientId: string]: {
    [clientExportName: string]: ImportManifestEntry;
  };
};

export type SSRManifest = {
  moduleMap: SSRModuleMap;
  moduleLoading: ModuleLoading;
  styles: string[];
};

export type ServerManifest = {
  [id: string]: ImportManifestEntry;
};

export type ClientManifest = {
  [id: string]: ImportManifestEntry;
};

declare module '@modern-js/utils/react-server-dom-webpack/server' {
  export const registerClientReference: <T>(
    proxyImplementation: any,
    id: string,
    exportName: string,
  ) => ClientReference[];

  export const registerServerReference: <T>(
    proxyImplementation: any,
    id: string,
    exportName: string,
  ) => ServerReference[];
}

declare module '@modern-js/utils/react-server-dom-webpack/server.edge' {
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

declare module '@modern-js/utils/react-server-dom-webpack/client' {
  type CallServerCallback = <T, A extends unknown[] = unknown[]>(
    string,
    args: A,
  ) => Promise<T>;

  type Options<T> = {
    callServer?: CallServerCallback<T>;
    temporaryReferences?: TemporaryReferenceSet;
  };

  export function createFromFetch<T>(
    promiseForResponse: Promise<Response>,
    options?: Options<T>,
  ): Promise<T>;
  export function encodeReply(
    value: ReactServerValue,
    options?: { temporaryReferences?: TemporaryReferenceSet },
  ): Promise<string | URLSearchParams | FormData>;
}

declare module '@modern-js/utils/react-server-dom-webpack/client.edge' {
  export type Options = {
    ssrManifest: SSRManifest;
    nonce?: string;
  };
  export function createFromReadableStream<T>(
    stream: ReadableStream,
    options: Options<T>,
  ): Promise<T>;
}
