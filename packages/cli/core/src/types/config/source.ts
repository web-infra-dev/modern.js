import type { SharedBuilderConfig } from '@modern-js/builder-shared';
import type { Merge } from '@modern-js/types/cli';

export type BuilderSourceConfig = Required<SharedBuilderConfig>['source'];

export type BaseSourceUserConfig<ExtendSourceUserConfig> = Merge<
  Pick<BuilderSourceConfig, 'globalVars' | 'alias' | 'define'> & {
    /**
     * The configuration of `source.designSystem` is provided by `tailwindcss` plugin.
     * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
     * @requires `tailwindcss` plugin
     */
    designSystem?: Record<string, any>;
  },
  ExtendSourceUserConfig
>;

export type BaseSourceNormalizedConfig<ExtendSourceNormailzedConfig> =
  BaseSourceUserConfig<ExtendSourceNormailzedConfig>;
