declare module '@modern-js/server-runtime' {
  interface MiddlewareRequestLike {
    url: string;
    header?: (name: string) => string | undefined;
    headers?: {
      get?: (name: string) => string | null | undefined;
    };
  }

  export type MiddlewareHandler = (
    c: { req: MiddlewareRequestLike; res?: Response },
    next: () => Promise<void>,
  ) => Promise<void | Response> | void | Response;

  export function defineServerConfig<T>(config: T): T;
}
