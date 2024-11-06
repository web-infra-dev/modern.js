import type { CLIPluginAPI } from '@modern-js/plugin-v2';
import type {
  AppToolsNormalizedConfig,
  AppToolsUserConfig,
} from '../../types/config';
import type { Bundler } from '../../types/utils';

export interface AppTools<B extends Bundler>
  extends CLIPluginAPI<
    AppToolsUserConfig<B>,
    AppToolsNormalizedConfig<AppToolsUserConfig<'shared'>>
  > {}
