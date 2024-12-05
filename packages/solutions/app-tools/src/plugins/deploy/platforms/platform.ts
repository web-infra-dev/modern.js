import type { AppToolsNormalizedConfig } from '../../../types';
import type { AppToolsContext } from '../../../types/new';

export type CreatePreset = (
  appContext: AppToolsContext<'shared'>,
  config: AppToolsNormalizedConfig,
  needModernServer?: boolean,
) => DeployPreset;

type DeployPreset = {
  prepare?: () => Promise<void>;
  writeOutput?: () => Promise<void>;
  genEntry?: () => Promise<void>;
  end?: () => Promise<void>;
};
