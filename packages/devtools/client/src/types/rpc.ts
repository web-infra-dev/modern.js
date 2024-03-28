export interface ClientFunctions {
  pullUp: (target: string) => Promise<void>;
}

export interface MountPointFunctions {
  activateReactDevtools: () => Promise<void>;
  onFinishRender: () => Promise<void>;
  cookies: (items?: Record<string, string>) => Promise<{
    client: Record<string, string>;
    server: Record<string, string>;
  }>;
  localStorage: (
    items?: Record<string, string>,
  ) => Promise<Record<string, string>>;
  sessionStorage: (
    items?: Record<string, string>,
  ) => Promise<Record<string, string>>;
}
