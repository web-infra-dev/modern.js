/// <reference types="@modern-js/types/server" />
/// <reference types="react/canary" />
/// <reference types="react-dom/canary" />

declare module 'react-dom/server.edge' {
  export {
    renderToNodeStream,
    renderToReadableStream,
    renderToStaticMarkup,
    renderToStaticNodeStream,
    renderToString,
    version,
  } from 'react-dom/server';
}

declare module 'react-server-dom-webpack' {
  export type ReactServerValue =
    // References are passed by their value
    | ServerReference
    // The rest are passed as is. Sub-types can be passed in but lose their
    // subtype, so the receiver can only accept once of these.
    | string
    | boolean
    | number
    | symbol
    | null
    | void
    | Iterable<ReactServerValue>
    | ReactServerValue[]
    | ReactServerObject
    | Promise<ReactServerValue>;
}

declare module 'react-server-dom-webpack/server.edge' {
  export * from '@modern-js/types/server/rsc';
}
declare module 'react-server-dom-webpack/client.browser' {
  export * from '@modern-js/types/server/rsc';
}

declare module 'react-server-dom-webpack/client.edge' {
  export * from '@modern-js/types/server/rsc';
}

declare module 'react-server-dom-webpack/server' {
  export * from '@modern-js/types/server/rsc';
}

// https://github.com/facebook/react/blob/2283d7204cfc200aa78b674d086a481c9a983007/packages/react-server-dom-esm/src/client/ReactFlightDOMClientBrowser.js
declare module 'react-server-dom-webpack/client.browser' {
  import type { Thenable } from 'react';

  type CallServerCallback<A, T> = (id: string, args: A) => Promise<T>;
  type Options = {
    callServer: CallServerCallback<any, any>;
  };

  export function createFromFetch<T>(
    promiseForResponse: Promise<Response>,
    options?: Options,
  ): Thenable<T>;

  export function createFromReadableStream<T>(
    stream: ReadableStream,
    options?: Options,
  ): Thenable<T>;

  export function encodeReply(
    value: ReactServerValue,
  ): Promise<string | FormData>;

  export function createServerReference(
    id: string,
    callServer: CallServerCallback,
  ): (...args: unknown[]) => Promise<unknown>;
}
