import type {
  RuntimePlugin as BaseRuntimePlugin,
  RuntimePluginExtends,
} from '@modern-js/plugin';
import type { Hooks } from '@modern-js/plugin/runtime';
import type { RuntimeConfig as BaseRuntimeConfig } from '../../common';
import type { RuntimeContext } from '../context/runtime';

export type RuntimeHooks = Hooks<RuntimeConfig, RuntimeContext>;

export type RuntimeExtends = Required<
  RuntimePluginExtends<RuntimeConfig, RuntimeContext, {}, {}>
>;

export type RuntimePlugin<Extends extends RuntimePluginExtends = {}> =
  BaseRuntimePlugin<RuntimeExtends & Extends>;
export interface RuntimeConfig extends BaseRuntimeConfig {
  plugins?: RuntimePlugin[];
}
