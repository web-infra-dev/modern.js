declare module '@modern-js/server-runtime' {
  interface MiddlewareRequestLike {
    url: string;
    headers?: {
      get?: (name: string) => string | null | undefined;
    };
  }

  export type MiddlewareHandler = (
    c: { req: MiddlewareRequestLike; res?: Response },
    next: () => Promise<void>,
  ) => Promise<void> | void;

  export function defineServerConfig<T>(config: T): T;
}
