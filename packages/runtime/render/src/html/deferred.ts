import { escapeHtmlAttribute, serializeRenderData } from './data';

export interface RenderDataError {
  message: string;
  stack?: string;
}

export interface RenderDataStore {
  read(source: string, key: string): Promise<unknown>;
  get(source: string, key: string): unknown;
  resolve(
    source: string,
    key: string,
    value: unknown,
    error?: RenderDataError,
  ): void;
}

export interface RenderDataHost {
  __MODERN_RENDER_DATA__?: RenderDataStore;
}

/** The owner supplies a request-local host or the browser document's global. */
export function getRenderDataStore(host: RenderDataHost): RenderDataStore {
  host.__MODERN_RENDER_DATA__ ??= createRenderDataStore();
  return host.__MODERN_RENDER_DATA__;
}

/**
 * This factory is also embedded in the bootstrap script. Keep it self-contained
 * and create it per document/request, never as a server module singleton.
 */
export function createRenderDataStore(): RenderDataStore {
  interface Entry {
    status: 'pending' | 'fulfilled' | 'rejected';
    promise: Promise<unknown>;
    value?: unknown;
    resolve: (value: unknown) => void;
    reject: (error: RenderDataError) => void;
  }
  const sources = new Map<string, Map<string, Entry>>();
  function entry(source: string, key: string): Entry {
    let values = sources.get(source);
    if (!values) {
      values = new Map();
      sources.set(source, values);
    }
    let item = values.get(key);
    if (!item) {
      let resolve!: Entry['resolve'];
      let reject!: Entry['reject'];
      const promise = new Promise((yes, no) => {
        resolve = yes;
        reject = no;
      });
      // Rejections can arrive before the application bundle reads the promise.
      // Keep the original rejected promise for the eventual consumer to observe.
      void promise.then(
        () => undefined,
        () => undefined,
      );
      item = { status: 'pending', promise, resolve, reject };
      values.set(key, item);
    }
    return item;
  }
  return {
    read(source, key) {
      return entry(source, key).promise;
    },
    get(source, key) {
      const item = entry(source, key);
      return item.status === 'fulfilled' ? item.value : item.promise;
    },
    resolve(source, key, value, error) {
      const item = entry(source, key);
      if (item.status !== 'pending') return;
      if (error !== undefined) {
        item.status = 'rejected';
        item.reject(error);
      } else {
        item.status = 'fulfilled';
        item.value = value;
        item.resolve(value);
      }
    },
  };
}

export interface DeferredResultInput {
  source: string;
  key: string;
  value: PromiseLike<unknown> | unknown;
}

export type DeferredResult =
  | { source: string; key: string; status: 'fulfilled'; value: unknown }
  | { source: string; key: string; status: 'rejected'; error: unknown };

export function toRenderDataError(error: unknown): RenderDataError {
  if (error && typeof error === 'object') {
    const message = 'message' in error ? error.message : error;
    const stack = 'stack' in error ? error.stack : undefined;
    return {
      message: String(message),
      stack:
        typeof stack === 'string' &&
        (typeof process === 'undefined' ||
          process.env.NODE_ENV !== 'production')
          ? stack
          : undefined,
    };
  }
  return { message: String(error) };
}

export function getDeferredBootstrapCode(
  pending: ReadonlyArray<Pick<DeferredResultInput, 'source' | 'key'>> = [],
): string {
  return `window.__MODERN_RENDER_DATA__=window.__MODERN_RENDER_DATA__||(${createRenderDataStore.toString()})();${pending.map(({ source, key }) => `window.__MODERN_RENDER_DATA__.read(${serializeRenderData(source)},${serializeRenderData(key)});`).join('')}`;
}

export function createDeferredBootstrapScript(
  pending: ReadonlyArray<Pick<DeferredResultInput, 'source' | 'key'>>,
  nonce?: string,
): string {
  const attribute =
    nonce === undefined ? '' : ` nonce="${escapeHtmlAttribute(nonce)}"`;
  return `<script${attribute}>${getDeferredBootstrapCode(pending)}</script>`;
}

export function createDeferredResultScript(
  result: DeferredResult,
  { nonce, after = '' }: { nonce?: string; after?: string } = {},
): string {
  const attribute =
    nonce === undefined ? '' : ` nonce="${escapeHtmlAttribute(nonce)}"`;
  const value =
    result.status === 'fulfilled' && result.value !== undefined
      ? serializeRenderData(result.value)
      : 'undefined';
  const error =
    result.status === 'rejected'
      ? `,${serializeRenderData(toRenderDataError(result.error))}`
      : '';
  return `<script${attribute}>window.__MODERN_RENDER_DATA__.resolve(${serializeRenderData(result.source)},${serializeRenderData(result.key)},${value}${error});${after}</script>`;
}

/** Subscribe once, before React output, including promises already settled. */
export async function subscribeDeferredResults(
  results: readonly DeferredResultInput[],
  emit: (result: DeferredResult) => void,
): Promise<void> {
  await Promise.all(
    results.map(({ source, key, value }) =>
      Promise.resolve(value).then(
        value => emit({ source, key, status: 'fulfilled', value }),
        error => emit({ source, key, status: 'rejected', error }),
      ),
    ),
  );
}
