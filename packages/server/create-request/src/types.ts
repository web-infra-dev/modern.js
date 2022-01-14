import type nodeFetch from 'node-fetch';

export type BFFRequestPayload = {
  params?: Record<string, any>;
  query?: Record<string, any>;
  body?: string;
  formUrlencoded?: never;
  formData?: FormData;
  data?: Record<string, any>;
  headers?: Record<string, any>;
  cookies?: Record<string, any>;
};

export type Fetch = typeof fetch | typeof nodeFetch;
export type Sender = ((...args: any[]) => Promise<any>) & {
  fetch?: Fetch;
};

export type RequestCreator = (
  path: string,
  method: string,
  port: number,
  fetch?: Fetch,
  headerWhiteList?: string[],
) => Sender;

export type IOptions<F = Fetch> = {
  request?: F;
  interceptor?: (request: F) => F;
  allowedHeaders?: string[];
};
