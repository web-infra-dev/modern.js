import type { ClientDefinition } from './client';

export interface MountPointFunctions {
  getLocation: () => string;
}

export interface SetupClientParams {
  src: string;
  def: ClientDefinition;
}
