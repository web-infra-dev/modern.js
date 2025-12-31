import type {
  AppTools,
  AppToolsNormalizedConfig,
  CliPlugin,
} from '../../../types';
import type { AppToolsContext } from '../../../types/plugin';

export type CreatePreset = (
  appContext: AppToolsContext,
  config: AppToolsNormalizedConfig,
  needModernServer?: boolean,
) => DeployPreset;

export type Setup = NonNullable<CliPlugin<AppTools>['setup']>;

type DeployPreset = {
  prepare?: () => Promise<void>;
  writeOutput?: () => Promise<void>;
  genEntry?: () => Promise<void>;
  end?: () => Promise<void>;
};
