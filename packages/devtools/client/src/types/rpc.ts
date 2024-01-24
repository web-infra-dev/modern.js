export interface ClientFunctions {
  pullUpReactInspector: () => Promise<void>;
}

export interface MountPointFunctions {
  activateReactDevtools: () => Promise<void>;
  onFinishRender: () => Promise<void>;
}
