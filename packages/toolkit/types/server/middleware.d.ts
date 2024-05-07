type Set<V extends Record<string, unknown>> = <Key extends keyof V>(
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
  req: Request;
  res: Response;
  get: Get<V>;
  set: Set<V>;
  header: (name: string, value: string, options?: { append?: boolean }) => void;
  status: (code: number) => void;
  body: (data: Body, init?: ResponseInit) => Response;
  html: (
    data: string | Promise<string>,
    init?: ResponseInit,
  ) => Response | Promise<Response>;
};

export type UnstableNext = () => Promise<void>;

export type UnstableMiddleware<V extends Record<string, unknown> = any> = (
  c: UnstableMiddlewareContext<V>,
  next: UnstableNext,
) => Promise<void>;
