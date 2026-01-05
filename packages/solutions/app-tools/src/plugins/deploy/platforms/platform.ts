import type { AppToolsNormalizedConfig } from '../../../types';
import type { AppToolsContext } from '../../../types/plugin';
import type { PluginAPI } from '../types';

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
