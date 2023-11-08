import type { ClientDefinition } from './client';

export interface MountPointFunctions {
  getLocation: () => string;
}

export interface SetupClientParams {
  endpoint: string;
  dataSource: string;
  def: ClientDefinition;
}
