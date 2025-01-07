import type {
  RuntimePlugin as BaseRuntimePlugin,
  RuntimePluginExtends,
} from '@modern-js/plugin-v2';
import type { Hooks } from '@modern-js/plugin-v2/runtime';
import type { RuntimeContext } from '../context/runtime';
import type { Plugin } from './base';

export type RuntimeHooks = Hooks<RuntimeConfig, RuntimeContext>;

export type RuntimeExtends = Required<
  RuntimePluginExtends<RuntimeConfig, RuntimeContext, {}, {}>
>;

export type RuntimePlugin = BaseRuntimePlugin<RuntimeExtends>;
export interface RuntimeConfig {
  plugins?: (Plugin | RuntimePlugin)[];
}
