import type { HttpMethodDecider } from '@modern-js/types';

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

export type Sender<F = typeof fetch> = ((...args: any[]) => Promise<any>) & {
  fetch?: F;
};

export type RequestCreator<F = typeof fetch> = (
  path: string,
  method: string,
  port: number,
  httpMethodDecider: HttpMethodDecider,
  fetch?: F,
) => Sender;

export type IOptions<F = typeof fetch> = {
  request?: F;
  interceptor?: (request: F) => F;
  allowedHeaders?: string[];
};
