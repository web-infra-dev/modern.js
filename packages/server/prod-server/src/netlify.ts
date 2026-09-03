import { createServerBase } from '@modern-js/server-core';
import {
  loadServerCliConfig,
  loadServerEnv,
  loadServerRuntimeConfig,
} from '@modern-js/server-core/node';
import { applyPlugins } from './apply';
import type { BaseEnv, ProdServerOptions } from './types';

export type { ProdServerOptions, BaseEnv } from './types';

type NetlifyEvent = {
  body?: string | null;
  headers?: Record<string, string | undefined>;
  httpMethod?: string;
  isBase64Encoded?: boolean;
  multiValueHeaders?: Record<string, Array<string | undefined> | undefined>;
  path?: string;
  queryStringParameters?: Record<string, string | undefined> | null;
  rawQuery?: string;
  rawUrl?: string;
};

type NetlifyResponse = {
  body: string;
  headers: Record<string, string>;
  isBase64Encoded: boolean;
  multiValueHeaders?: Record<string, string[]>;
  statusCode: number;
};

const isRequest = (value: unknown): value is Request => {
  return value instanceof Request;
};

const isTextResponse = (contentType: string | null) => {
  if (!contentType) {
    return true;
  }

  return (
    contentType.startsWith('text/') ||
    contentType.includes('application/json') ||
    contentType.includes('application/javascript') ||
    contentType.includes('application/xml') ||
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('image/svg+xml')
  );
};

const getRequestUrl = (event: NetlifyEvent) => {
  if (event.rawUrl) {
    return event.rawUrl;
  }

  const headers = event.headers ?? {};
  const protocol = headers['x-forwarded-proto'] ?? 'https';
  const host = headers['x-forwarded-host'] ?? headers.host ?? 'localhost';
  const pathname = event.path ?? '/';

  if (event.rawQuery) {
    return `${protocol}://${host}${pathname}?${event.rawQuery}`;
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(event.queryStringParameters ?? {})) {
    if (value !== undefined) {
      search.append(key, value);
    }
  }

  const query = search.toString();
  return `${protocol}://${host}${pathname}${query ? `?${query}` : ''}`;
};

const createWebRequest = (event: NetlifyEvent): Request => {
  const headers = new Headers();

  for (const [key, values] of Object.entries(event.multiValueHeaders ?? {})) {
    if (!values) {
      continue;
    }

    for (const value of values) {
      if (value !== undefined) {
        headers.append(key, value);
      }
    }
  }

  for (const [key, value] of Object.entries(event.headers ?? {})) {
    if (value !== undefined && !headers.has(key)) {
      headers.set(key, value);
    }
  }

  const method = event.httpMethod ?? 'GET';
  const init: RequestInit & { duplex?: 'half' } = {
    headers,
    method,
  };

  if (!(method === 'GET' || method === 'HEAD') && event.body) {
    init.body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : event.body;
    init.duplex = 'half';
  }

  return new Request(getRequestUrl(event), init);
};

const createNetlifyResponse = async (
  response: Response,
): Promise<NetlifyResponse> => {
  const headers: Record<string, string> = {};
  for (const [key, value] of response.headers.entries()) {
    if (key !== 'set-cookie') {
      headers[key] = value;
    }
  }

  const setCookie =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [];

  const contentType = response.headers.get('content-type');
  const buffer = Buffer.from(await response.arrayBuffer());
  const isBase64Encoded = !isTextResponse(contentType);

  return {
    statusCode: response.status,
    headers,
    body: isBase64Encoded ? buffer.toString('base64') : buffer.toString('utf8'),
    isBase64Encoded,
    ...(setCookie.length > 0
      ? { multiValueHeaders: { 'set-cookie': setCookie } }
      : {}),
  };
};

export const createNetlifyFunction = async (options: ProdServerOptions) => {
  await loadServerEnv(options);

  const serverBaseOptions = options;

  const serverCliConfig = loadServerCliConfig(options.pwd, options.config);

  if (serverCliConfig) {
    options.config = serverCliConfig;
  }

  const serverRuntimeConfig = await loadServerRuntimeConfig(
    options.serverConfigPath,
  );

  if (serverRuntimeConfig) {
    serverBaseOptions.serverConfig = serverRuntimeConfig;
    serverBaseOptions.plugins = [
      ...(serverRuntimeConfig.plugins || []),
      ...(options.plugins || []),
    ];
  }
  const server = createServerBase<BaseEnv>(serverBaseOptions);

  await applyPlugins(server, options);
  await server.init();
  return async (requestOrEvent: Request | NetlifyEvent, context: unknown) => {
    if (isRequest(requestOrEvent)) {
      return server.handle(requestOrEvent, context);
    }

    const request = createWebRequest(requestOrEvent);
    const response = await server.handle(request, context);

    return createNetlifyResponse(response);
  };
};
