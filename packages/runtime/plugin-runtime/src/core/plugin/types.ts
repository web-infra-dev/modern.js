import type {
  RuntimePlugin as BaseRuntimePlugin,
  RuntimePluginExtends,
} from '@modern-js/plugin-v2';
import type { Hooks } from '@modern-js/plugin-v2/runtime';
import type { AppConfig } from '../../common';
import type { RuntimeContext } from '../context/runtime';

export type RuntimeHooks = Hooks<RuntimeConfig, RuntimeContext>;

export type RuntimeExtends = Required<
  RuntimePluginExtends<RuntimeConfig, RuntimeContext, {}, {}>
>;

export type RuntimePluginFuture<Extends extends RuntimePluginExtends = {}> =
  BaseRuntimePlugin<RuntimeExtends & Extends>;
export interface RuntimeConfig extends AppConfig {
  plugins?: RuntimePluginFuture[];
}
