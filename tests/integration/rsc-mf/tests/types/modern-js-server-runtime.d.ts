declare module '@modern-js/server-runtime' {
  export type MiddlewareHandler = (
    c: { req: { url: string }; res?: Response },
    next: () => Promise<void>,
  ) => Promise<void> | void;

  export function defineServerConfig<T>(config: T): T;
}
