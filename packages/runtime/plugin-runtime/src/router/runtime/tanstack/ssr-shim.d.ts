declare module '@tanstack/react-router/ssr/client' {
  export function RouterClient(props: {
    router: unknown;
  }): import('react').JSX.Element;
}

declare module '@tanstack/react-router/ssr/server' {
  export function attachRouterServerSsrUtils(opts: {
    router: unknown;
    manifest?: unknown;
  }): void;
}

