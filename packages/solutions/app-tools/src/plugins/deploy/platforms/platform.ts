import type { NormalizedConfig } from '@modern-js/core';
import type { AppToolsContext } from '../../../new/types';
import type { AppTools } from '../../../types';

export type CreatePreset = (
  appContext: AppToolsContext<'shared'>,
  config: NormalizedConfig<AppTools>,
  needModernServer?: boolean,
) => DeployPreset;

type DeployPreset = {
  prepare?: () => Promise<void>;
  writeOutput?: () => Promise<void>;
  genEntry?: () => Promise<void>;
  end?: () => Promise<void>;
};
