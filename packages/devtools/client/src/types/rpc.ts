export interface ClientFunctions {
  pullUp: (target: string) => Promise<void>;
}

export interface MountPointFunctions {
  activateReactDevtools: () => Promise<void>;
  onFinishRender: () => Promise<void>;
}
