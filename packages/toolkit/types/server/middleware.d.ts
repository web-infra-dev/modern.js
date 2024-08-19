import type { RequestPayload } from './context';

type Set<V extends Record<string>> = <Key extends keyof V>(
  key: Key,
  value: V[Key],
) => void;

type Get<V extends Record<string, unknown>> = <Key extends keyof V>(
  key: Key,
) => V[Key];

type Body = ReadableStream | ArrayBuffer | string | null;

export type UnstableMiddlewareContext<
  V extends Record<string, unknown> = Record<string, unknown>,
> = {
  request: Request;
  response: Response;
  get: Get<V & RequestPayload>;
  set: Set<V & RequestPayload>;
  header: (name: string, value: string, options?: { append?: boolean }) => void;
  status: (code: number) => void;
  redirect: (location: string, status?: number) => Response;
  body: (data: Body, init?: ResponseInit) => Response;
  html: (
    data: string | Promise<string>,
    init?: ResponseInit,
  ) => Response | Promise<Response>;
};

export type UnstableNext = () => Promise<void>;

export type UnstableMiddleware<
  V extends Record<string, unknown> = Record<string, unknown>,
> = (
  c: UnstableMiddlewareContext<V>,
  next: UnstableNext,
) => Promise<void | Response>;
