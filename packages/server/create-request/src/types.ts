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
  files?: Record<string, any>;
};

export type Sender<F = typeof fetch> = ((...args: any[]) => Promise<any>) & {
  fetch?: F;
};

export type RequestOptions<F = typeof fetch> = {
  path: string;
  method: string;
  port: number;
  httpMethodDecider?: HttpMethodDecider;
  domain?: string;
  fetch?: F;
};

export type RequestCreator<F = typeof fetch> = (
  options: RequestOptions<F>,
) => Sender;

export type UploadOptions = {
  path: string;
  domain?: string;
};

export type UploadCreator = (options: UploadOptions) => Sender;

export type IOptions<F = typeof fetch> = {
  request?: F;
  interceptor?: (request: F) => F;
  allowedHeaders?: string[];
};
