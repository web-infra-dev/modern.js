// eslint-disable-next-line filenames/match-exported
import { isBrowser } from '@modern-js/utils';
import { createRequest as browser } from './browser';
import { createRequest as node } from './node';

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

export type Fetcher = typeof fetch;
export type Sender = ((...args: any[]) => Promise<any>) & {
  fetch?: Fetcher;
};

export type RequestCreator = (
  path: string,
  method: string,
  port: number,
  fetch?: Fetcher,
  headerWhiteList?: string[],
) => Sender;

const createRequest: RequestCreator = (...args) =>
  isBrowser() ? browser(...args) : node(...args);

export default createRequest;
