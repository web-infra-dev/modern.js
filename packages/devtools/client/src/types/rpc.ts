// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ClientFunctions {}

export interface MountPointFunctions {
  activateReactDevtools: () => Promise<void>;
  onFinishRender: () => Promise<void>;
}
