import { PluginOptions } from '@babel/core';

export const globalVarsPlugin = (
  globalVars: Record<string, string>,
): [string, PluginOptions] => [
  'babel-plugin-transform-define',
  { ...globalVars },
];
