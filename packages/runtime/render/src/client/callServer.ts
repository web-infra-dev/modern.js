import {
  createFromFetch,
  createTemporaryReferenceSet,
  encodeReply,
  setServerCallback,
} from 'react-server-dom-rspack/client.browser';

type ReactServerValue = unknown;

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
  const entryName = window.__MODERN_JS_ENTRY_NAME;
  const url =
    entryName === 'main' || entryName === 'index' ? '/' : `/${entryName}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'text/x-component',
        'x-rsc-action': id,
      },
      body: await encodeReply(args),
    });

    if (!response.ok) {
      throw new CallServerError(response.statusText, response.status, url, {
        id,
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
      { id, args },
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
