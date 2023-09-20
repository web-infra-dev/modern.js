import _ from '@modern-js/utils/lodash';

export interface MountPointFunctions {
  getLocation: () => string;
}

export interface SetupClientOptions extends Record<string, any> {
  endpoint?: string;
  dataSource?: string;
}
