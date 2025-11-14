import type {
  RuntimePlugin as BaseRuntimePlugin,
  RuntimePluginExtends,
} from '@modern-js/plugin';
import type { Hooks } from '@modern-js/plugin/runtime';
import type { RuntimeConfig as BaseRuntimeConfig } from '../../common';
import type { TRuntimeContext } from '../context/runtime';

export type RuntimeHooks = Hooks<RuntimeConfig, TRuntimeContext>;

export type RuntimeExtends = Required<
  RuntimePluginExtends<RuntimeConfig, TRuntimeContext, {}, {}>
>;

export type RuntimePlugin<Extends extends RuntimePluginExtends = {}> =
  BaseRuntimePlugin<RuntimeExtends & Extends>;
export interface RuntimeConfig extends BaseRuntimeConfig {
  plugins?: RuntimePlugin[];
}
