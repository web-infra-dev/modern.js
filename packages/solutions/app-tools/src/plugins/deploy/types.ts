import type { AppTools, CliPlugin } from '../../types';

export type Setup = NonNullable<CliPlugin<AppTools>['setup']>;

export type PluginAPI = Parameters<Setup>[0];
