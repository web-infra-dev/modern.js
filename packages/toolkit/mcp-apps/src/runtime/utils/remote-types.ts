import type React from 'react';

export type RemoteProps = Record<string, unknown>;

export type MountResult =
  | undefined
  | (() => void)
  | {
      unmount?: () => void;
      update?: (props: RemoteProps) => void;
    };

export type RemoteModule = {
  default?: RemoteComponent;
  [key: string]: unknown;
};

export type RemoteComponent = {
  (props: RemoteProps): React.ReactNode;
  (container: HTMLElement, props: RemoteProps): MountResult;
  mount?: (container: HTMLElement, props: RemoteProps) => MountResult;
  update?: (props: RemoteProps) => void;
};

export type ModuleFederationInstance = {
  loadRemote: (path: string) => Promise<RemoteModule | RemoteComponent>;
};
