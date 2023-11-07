import type { ClientDefinition } from './client';

export interface MountPointFunctions {
  getLocation: () => string;
}

export interface SetupClientOptions extends Record<string, any> {
  endpoint?: string;
  dataSource?: string;
  def?: ClientDefinition;
}
