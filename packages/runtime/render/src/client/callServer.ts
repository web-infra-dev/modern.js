import {
  createFromFetch,
  encodeReply,
} from 'react-server-dom-rspack/client.browser';

type ReactServerValue = unknown;

export type ActionIdResolver = (id: string) => string | Promise<string>;
export type ActionRequestUrlResolver = (entryName?: string) => string;

const ACTION_RESOLVER_KEY = '__MODERN_RSC_ACTION_RESOLVER__';
const ACTION_URL_RESOLVER_KEY = '__MODERN_RSC_ACTION_URL_RESOLVER__';

/**
 * Register a custom action ID resolver. Plugins (e.g. Module Federation)
 * use this to remap raw action IDs before they are sent to the server.
 */
export const setResolveActionId = (resolver: ActionIdResolver): void => {
  (
    globalThis as typeof globalThis & {
      [ACTION_RESOLVER_KEY]?: ActionIdResolver;
    }
  )[ACTION_RESOLVER_KEY] = resolver;
};

export const setActionIdResolver = setResolveActionId;

const resolveActionId = (id: string): string | Promise<string> => {
  const resolver = (
    globalThis as typeof globalThis & {
      [ACTION_RESOLVER_KEY]?: ActionIdResolver;
    }
  )[ACTION_RESOLVER_KEY];
  if (typeof resolver === 'function') {
    return resolver(id);
  }
  return id;
};

/**
 * Register a custom action request URL resolver. Plugins can use this
 * to align request URLs with customized route/base configurations.
 */
export const setResolveActionRequestUrl = (
  resolver: ActionRequestUrlResolver,
): void => {
  (
    globalThis as typeof globalThis & {
      [ACTION_URL_RESOLVER_KEY]?: ActionRequestUrlResolver;
    }
  )[ACTION_URL_RESOLVER_KEY] = resolver;
};

export const setActionRequestUrlResolver = setResolveActionRequestUrl;

const resolveActionRequestUrl = (): string => {
  const entryName =
    typeof window !== 'undefined' ? window.__MODERN_JS_ENTRY_NAME : undefined;

  const resolver = (
    globalThis as typeof globalThis & {
      [ACTION_URL_RESOLVER_KEY]?: ActionRequestUrlResolver;
    }
  )[ACTION_URL_RESOLVER_KEY];
  if (typeof resolver === 'function') {
    return resolver(entryName);
  }

  // Legacy fallback: preserve existing behavior for default entry names.
  if (!entryName || entryName === 'main' || entryName === 'index') {
    return '/';
  }
  return `/${entryName}`;
};

class CallServerError extends Error {
  readonly #statusCode: number;
  readonly #url: string;
  readonly #details: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    url = '',
    details: Record<string, unknown> = {},
  ) {
    const formattedMessage = `Call Server Action failed (${statusCode}): ${message}\nURL: ${url}`;
    super(formattedMessage);

    this.name = 'CallServerError';
    this.#statusCode = statusCode;
    this.#url = url;
    this.#details = details;
  }

  get statusCode(): number {
    return this.#statusCode;
  }

  get url(): string {
    return this.#url;
  }

  get details(): Record<string, unknown> {
    return { ...this.#details };
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.#statusCode,
      url: this.#url,
      details: this.#details,
    };
  }
}

export async function requestCallServer(id: string, args: ReactServerValue) {
  let url = '/';
  let actionId = id;

  try {
    url = resolveActionRequestUrl();
    actionId = await resolveActionId(id);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'text/x-component',
        'x-rsc-action': actionId,
      },
      body: await encodeReply(args),
    });

    if (!response.ok) {
      throw new CallServerError(response.statusText, response.status, url, {
        id: actionId,
        rawId: id,
        args,
      });
    }

    return response;
  } catch (error) {
    if (error instanceof CallServerError) {
      throw error;
    }
    throw new CallServerError(
      error instanceof Error ? error.message : 'Unknown error',
      1,
      url,
      { id: actionId, rawId: id, args },
    );
  }
}

export async function callServer(
  id: string,
  args: ReactServerValue,
): Promise<any> {
  const response = requestCallServer(id, args);
  const res = createFromFetch(response);

  return res;
}
