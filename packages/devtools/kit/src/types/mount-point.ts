import _ from '@modern-js/utils/lodash';
import { parseURL, stringifyParsedURL } from 'ufo';

export interface MountPointFunctions {
  getLocation: () => string;
}

export interface SetupClientOptions extends Record<string, any> {
  endpoint?: string;
  version?: string | boolean;
  dataSource?: string;
}
