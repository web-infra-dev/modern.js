import type {
  AppTools,
  AppToolsNormalizedConfig,
  CliPlugin,
} from '../../../types';
import type { AppToolsContext } from '../../../types/plugin';

export type Setup = NonNullable<CliPlugin<AppTools>['setup']>;

export type PluginAPI = Parameters<Setup>[0];

interface CreatePresetParams {
  appContext: AppToolsContext;
  modernConfig: AppToolsNormalizedConfig;
  api: PluginAPI;
  needModernServer?: boolean;
}

export type CreatePreset = (params: CreatePresetParams) => DeployPreset;

type DeployPreset = {
  prepare?: () => Promise<void>;
  writeOutput?: () => Promise<void>;
  genEntry?: () => Promise<void>;
  end?: () => Promise<void>;
};
