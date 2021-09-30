import { PluginOptions } from '@babel/core';

/**
 * BUILD_MODE: nodejs = CJS+ES6, legacy-browser = ESM+ES5, modern = ESM+ES6, testing, storybook
 * NODE_ENV = development, production
 */
const defaultEnvVars: string[] = [];

export const envPlugin = (
  envVars = defaultEnvVars,
): [string, PluginOptions] => [
  'babel-plugin-transform-inline-environment-variables',
  { include: [...defaultEnvVars, ...envVars] },
];
