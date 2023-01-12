import type { Alias } from '@modern-js/utils';
import type { ChainedConfig } from './share';

type JSONPrimitive = string | number | boolean | null | undefined;

type JSONArray = Array<JSONValue>;

type JSONObject = { [key: string]: JSONValue };

type JSONValue = JSONPrimitive | JSONObject | JSONArray;

export interface SourceUserConfig {
  alias?: ChainedConfig<Alias>;
  define?: Record<string, any>;
  globalVars?: Record<string, JSONValue>;
}

export type SourceNormalizedConfig = SourceUserConfig;
