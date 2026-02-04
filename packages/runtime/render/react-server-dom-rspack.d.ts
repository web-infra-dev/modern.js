// Types for react-server-dom-rspack
// Based on react-server-dom-rspack@0.0.1-alpha.10

declare module 'react-server-dom-rspack' {
  export type TemporaryReferenceSet = Map<string, unknown>;

  export type ServerEntry<T> = T & {
    entryJsFiles: string[];
    entryCssFiles: string[];
  };

  type ModuleLoading = {
    prefix: string;
    crossOrigin: 'use-credentials' | '';
  };

  type ServerConsumerModuleMap = {
    [id: string]: {
      [name: string]: {
        specifier: string;
        name: string;
      };
    };
  };

  type ServerManifest = {
    [id: string]: ImportManifestEntry;
  };

  type ImportManifestEntry = {
    id: string;
    chunks: Array<string>;
    name: string;
    async?: boolean;
  };

  type ClientManifest = {
    [id: string]: ImportManifestEntry;
  };

  type RscManifest = {
    serverManifest: ServerManifest;
    clientManifest: ClientManifest;
    serverConsumerModuleMap: ServerConsumerModuleMap;
    moduleLoading: ModuleLoading;
    entryCssFiles: Record<string, string[]>;
    entryJsFiles: string[];
  };

  global {
    const __webpack_require__: (id: string | number) => any;
    const __rspack_rsc_manifest__: RscManifest;
    const __rspack_rsc_hot_reloader__: {
      on: (callback: () => void) => () => void;
    };
  }
}

// Server Node
declare module 'react-server-dom-rspack/server.node' {
  import type {
    TemporaryReferenceSet,
    ServerEntry,
  } from 'react-server-dom-rspack';
  export type { TemporaryReferenceSet, ServerEntry };

  export function renderToReadableStream(
    model: unknown,
    options?: {
      temporaryReferences?: TemporaryReferenceSet;
      environmentName?: string | (() => string);
      filterStackFrame?: (
        url: string,
        functionName: string,
        lineNumber: number,
        columnNumber: number,
      ) => boolean;
      onError?: (error: unknown) => void;
      signal?: AbortSignal;
      debugChannel?: {
        readable?: ReadableStream;
        writable?: WritableStream;
      };
    },
  ): ReadableStream<Uint8Array>;

  export function decodeReply<T>(
    body: string | FormData,
    options?: {
      temporaryReferences?: TemporaryReferenceSet;
    },
  ): Promise<T[]>;

  export function decodeReplyFromAsyncIterable<T>(
    iterable: AsyncIterable<[string, string | File]>,
    options?: {
      temporaryReferences?: TemporaryReferenceSet;
    },
  ): Promise<T>;

  export function decodeAction(body: FormData): Promise<() => unknown> | null;

  export function decodeFormState(
    actionResult: unknown,
    body: FormData,
  ): Promise<unknown | null>;

  export function registerServerReference<T extends Function>(
    reference: T,
    id: string,
    exportName: string | null,
  ): unknown;

  export function registerClientReference(
    proxyImplementation: unknown,
    id: string,
    exportName: string,
  ): unknown;

  export const createTemporaryReferenceSet: (
    ...args: unknown[]
  ) => TemporaryReferenceSet;

  export function loadServerAction(actionId: string): Function;

  export function createServerEntry<T>(
    value: T,
    resourceId: string,
  ): ServerEntry<T>;

  export function ensureServerActions(actions: any[]): void;

  type EncryptFunction = (actionId: string, ...args: any[]) => Promise<any>;
  type DecryptFunction = (
    actionId: string,
    encryptedPromise: Promise<any>,
  ) => Promise<any>;

  export function setActionBoundArgsEncryption(
    encrypt: EncryptFunction,
    decrypt: DecryptFunction,
  ): void;

  export function encryptActionBoundArgs(
    actionId: string,
    ...args: any[]
  ): Promise<any>;

  export function decryptActionBoundArgs(
    actionId: string,
    encryptedPromise: Promise<any>,
  ): Promise<any>;
}

// Server Edge
declare module 'react-server-dom-rspack/server.edge' {
  import type {
    TemporaryReferenceSet,
    ServerEntry,
  } from 'react-server-dom-rspack';
  export type { TemporaryReferenceSet, ServerEntry };

  export function renderToReadableStream(
    model: unknown,
    options?: {
      temporaryReferences?: TemporaryReferenceSet;
      environmentName?: string | (() => string);
      filterStackFrame?: (
        url: string,
        functionName: string,
        lineNumber: number,
        columnNumber: number,
      ) => boolean;
      onError?: (error: unknown) => void;
      signal?: AbortSignal;
      debugChannel?: {
        readable?: ReadableStream;
        writable?: WritableStream;
      };
    },
  ): ReadableStream<Uint8Array>;

  export function decodeReply<T>(
    body: string | FormData,
    options?: {
      temporaryReferences?: TemporaryReferenceSet;
    },
  ): Promise<T[]>;

  export function decodeReplyFromAsyncIterable<T>(
    iterable: AsyncIterable<[string, string | File]>,
    options?: {
      temporaryReferences?: TemporaryReferenceSet;
    },
  ): Promise<T>;

  export function decodeAction(body: FormData): Promise<() => unknown> | null;

  export function decodeFormState(
    actionResult: unknown,
    body: FormData,
  ): Promise<unknown | null>;

  export function registerServerReference<T extends Function>(
    reference: T,
    id: string,
    exportName: string | null,
  ): unknown;

  export function registerClientReference(
    proxyImplementation: unknown,
    id: string,
    exportName: string,
  ): unknown;

  export const createTemporaryReferenceSet: (
    ...args: unknown[]
  ) => TemporaryReferenceSet;

  export function loadServerAction(actionId: string): Function;

  export function createServerEntry<T>(
    value: T,
    resourceId: string,
  ): ServerEntry<T>;

  export function ensureServerActions(actions: any[]): void;
}

// Server Browser
declare module 'react-server-dom-rspack/server.browser' {
  import type {
    TemporaryReferenceSet,
    ServerEntry,
  } from 'react-server-dom-rspack';
  export type { TemporaryReferenceSet, ServerEntry };

  export function renderToReadableStream(
    model: unknown,
    options?: {
      temporaryReferences?: TemporaryReferenceSet;
      environmentName?: string | (() => string);
      filterStackFrame?: (
        url: string,
        functionName: string,
        lineNumber: number,
        columnNumber: number,
      ) => boolean;
      onError?: (error: unknown) => void;
      signal?: AbortSignal;
      debugChannel?: {
        readable?: ReadableStream;
        writable?: WritableStream;
      };
    },
  ): ReadableStream<Uint8Array>;

  export function decodeReply<T>(
    body: string | FormData,
    options?: {
      temporaryReferences?: TemporaryReferenceSet;
    },
  ): Promise<T[]>;

  export function decodeReplyFromAsyncIterable<T>(
    iterable: AsyncIterable<[string, string | File]>,
    options?: {
      temporaryReferences?: TemporaryReferenceSet;
    },
  ): Promise<T>;

  export function decodeAction(body: FormData): Promise<() => unknown> | null;

  export function decodeFormState(
    actionResult: unknown,
    body: FormData,
  ): Promise<unknown | null>;

  export function registerServerReference<T extends Function>(
    reference: T,
    id: string,
    exportName: string | null,
  ): unknown;

  export function registerClientReference(
    proxyImplementation: unknown,
    id: string,
    exportName: string,
  ): unknown;

  export const createTemporaryReferenceSet: (
    ...args: unknown[]
  ) => TemporaryReferenceSet;

  export function loadServerAction(actionId: string): Function;

  export function createServerEntry<T>(
    value: T,
    resourceId: string,
  ): ServerEntry<T>;

  export function ensureServerActions(actions: any[]): void;
}

// Client Browser
declare module 'react-server-dom-rspack/client.browser' {
  import type { TemporaryReferenceSet } from 'react-server-dom-rspack';
  export type { TemporaryReferenceSet };

  export type CallServerCallback = (
    id: string,
    args: unknown[],
  ) => Promise<unknown>;

  export function setServerCallback(fn: CallServerCallback): void;

  export function createServerReference(
    id: string,
  ): (...args: unknown[]) => Promise<unknown>;

  export const registerServerReference: <T extends Function>(
    reference: T,
    id: string,
    exportName: string | null,
  ) => unknown;

  export const createTemporaryReferenceSet: (
    ...args: unknown[]
  ) => TemporaryReferenceSet;

  export type FindSourceMapURLCallback = (
    fileName: string,
    environmentName: string,
  ) => null | string;

  export interface Options {
    environmentName?: string;
    replayConsoleLogs?: boolean;
    temporaryReferences?: TemporaryReferenceSet;
    debugChannel?: {
      readable?: ReadableStream;
      writable?: WritableStream;
    };
  }

  export function createFromFetch<T>(
    promiseForResponse: Promise<Response>,
    options?: Options,
  ): Promise<T>;

  export function createFromReadableStream<T>(
    stream: ReadableStream,
    options?: Options,
  ): Promise<T>;

  export const encodeReply: (
    value: unknown,
    options?: {
      temporaryReferences?: TemporaryReferenceSet;
      signal?: AbortSignal;
    },
  ) => Promise<string | FormData>;

  export function onServerComponentChanges(callback: () => void): () => void;
}

// Client Edge
declare module 'react-server-dom-rspack/client.edge' {
  import type { TemporaryReferenceSet } from 'react-server-dom-rspack';
  export type { TemporaryReferenceSet };

  export const createTemporaryReferenceSet: (
    ...args: unknown[]
  ) => TemporaryReferenceSet;

  export function createServerReference(
    id: string,
  ): (...args: unknown[]) => Promise<unknown>;

  export type EncodeFormActionCallback = <A>(
    id: unknown,
    args: Promise<A>,
  ) => ReactCustomFormAction;

  export type ReactCustomFormAction = {
    name?: string;
    action?: string;
    encType?: string;
    method?: string;
    target?: string;
    data?: null | FormData;
  };

  export interface Options {
    nonce?: string;
    encodeFormAction?: EncodeFormActionCallback;
    temporaryReferences?: TemporaryReferenceSet;
    replayConsoleLogs?: boolean;
    environmentName?: string;
    debugChannel?: {
      readable?: ReadableStream;
    };
  }

  export function createFromFetch<T>(
    promiseForResponse: Promise<Response>,
    options?: Options,
  ): Promise<T>;

  export function createFromReadableStream<T>(
    stream: ReadableStream,
    options?: Options,
  ): Promise<T>;

  export const encodeReply: (
    value: unknown,
    options?: {
      temporaryReferences?: TemporaryReferenceSet;
      signal?: AbortSignal;
    },
  ) => Promise<string | FormData>;
}

// Client Node
declare module 'react-server-dom-rspack/client.node' {
  import type { Readable } from 'node:stream';
  import type {
    TemporaryReferenceSet,
    EncodeFormActionCallback,
    ReactCustomFormAction,
  } from 'react-server-dom-rspack/client.edge';
  export type {
    TemporaryReferenceSet,
    EncodeFormActionCallback,
    ReactCustomFormAction,
  };
  export {
    createTemporaryReferenceSet,
    createServerReference,
    createFromFetch,
    createFromReadableStream,
    encodeReply,
  } from 'react-server-dom-rspack/client.edge';

  export interface Options {
    nonce?: string;
    encodeFormAction?: EncodeFormActionCallback;
    replayConsoleLogs?: boolean;
    environmentName?: string;
    debugChannel?: Readable;
  }

  export function createFromNodeStream<T>(
    stream: Readable,
    options?: Options,
  ): Promise<T>;
}
