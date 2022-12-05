import { CommonAPI } from '@modern-js/plugin';
import type {
  setAppContext,
  useAppContext,
  useResolvedConfigContext,
  useConfigContext,
} from '../context';
import { BaseHooks } from './hooks';

export type BasePluginAPI<
  Extends extends {
    hooks?: ExtendHooks;
    userConfig?: ExtendUserConfig;
    normalizedConfig?: ExtendNormalizedConfig;
  },
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendHooks extends {} = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendUserConfig extends Record<string, any> = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
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
    // eslint-disable-next-line @typescript-eslint/ban-types
  } = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendHooks extends {} = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendUserConfig extends Record<string, any> = {},
> = BasePluginAPI<Extends> & CommonAPI<BaseHooks<Extends> & Extends['hooks']>;
