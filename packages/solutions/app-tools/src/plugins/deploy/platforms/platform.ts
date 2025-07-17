import type { AppToolsNormalizedConfig } from '../../../types';
import type { AppToolsContext } from '../../../types/plugin';

export type CreatePreset = (
  appContext: AppToolsContext,
  config: AppToolsNormalizedConfig,
  needModernServer?: boolean,
) => DeployPreset;

type DeployPreset = {
  prepare?: () => Promise<void>;
  writeOutput?: () => Promise<void>;
  genEntry?: () => Promise<void>;
  end?: () => Promise<void>;
};
