import type {
  RuntimePlugin as BaseRuntimePlugin,
  RuntimePluginExtends,
} from '@modern-js/plugin';
import type { Hooks } from '@modern-js/plugin/runtime';
import type { RuntimeConfig as BaseRuntimeConfig } from '../../common';
import type { TInternalRuntimeContext } from '../context/runtime';
import type { SyncHook } from '@modern-js/plugin';

export type ApplicationPreparation = () => Promise<{
  value: unknown;
  interrupted: boolean;
}>;

export type ApplicationHooks = {
  /** Optional lifecycle capability, registered only by an owning adapter. */
  wrapPreparation?: SyncHook<
    (prepare: ApplicationPreparation) => ApplicationPreparation
  >;
};

export type RuntimeHooks = Hooks<RuntimeConfig, TInternalRuntimeContext>;

export type RuntimeExtends = Required<
  RuntimePluginExtends<
    RuntimeConfig,
    TInternalRuntimeContext,
    {},
    ApplicationHooks
  >
>;

export type RuntimePlugin<Extends extends RuntimePluginExtends = {}> =
  BaseRuntimePlugin<RuntimeExtends & Extends>;
export interface RuntimeConfig extends BaseRuntimeConfig {
  plugins?: RuntimePlugin[];
}
