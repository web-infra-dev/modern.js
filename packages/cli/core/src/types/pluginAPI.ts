import type { CommonAPI } from '@modern-js/plugin';
import type {
  setAppContext,
  useAppContext,
  useResolvedConfigContext,
  useConfigContext,
} from '../context';
import type { BaseHooks } from './hooks';

export type BasePluginAPI<
  Extends extends {
    hooks?: ExtendHooks;
    userConfig?: ExtendUserConfig;
    normalizedConfig?: ExtendNormalizedConfig;
  },
  ExtendHooks extends {} = {},
  ExtendUserConfig extends Record<string, any> = {},
  ExtendNormalizedConfig extends Record<string, any> = {},
> = {
  setAppContext: typeof setAppContext;
  useAppContext: typeof useAppContext;
  useConfigContext: typeof useConfigContext<Extends>;
  useResolvedConfigContext: typeof useResolvedConfigContext<Extends>;
};

/** all apis for cli plugin */
export type PluginAPI<
  Extends extends {
    hooks?: ExtendHooks;
    userConfig?: ExtendUserConfig;
  } = {},
  ExtendHooks extends {} = {},
  ExtendUserConfig extends Record<string, any> = {},
> = BasePluginAPI<Extends> & CommonAPI<BaseHooks<Extends> & Extends['hooks']>;
