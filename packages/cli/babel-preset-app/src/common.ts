import { join } from 'path';
import {
  getBaseBabelChain,
  createBabelChain,
  BabelChain,
} from '@modern-js/babel-preset-base';
import {
  isTest,
  isDev,
  isProd,
  getCoreJsVersion,
  isBeyondReact17,
} from '@modern-js/utils';
import type { Options, PresetEnvOptions } from './type';

const prepareEnvOptions = (options: Options): PresetEnvOptions => {
  const { useBuiltIns, modules, useModern } = options;

  const envOptions: PresetEnvOptions = {
    useBuiltIns,
    modules,
    exclude: ['transform-typeof-symbol'],
    corejs: useBuiltIns
      ? {
          version: getCoreJsVersion(require.resolve('core-js/package.json')),
          proposals: true,
        }
      : undefined,
  };

  if (useModern) {
    envOptions.targets = { esmodules: true };
    envOptions.modules = false;
    envOptions.bugfixes = true;
  }

  return envOptions;
};

export const genCommon = (options: Options): BabelChain => {
  const {
    lodash: lodashOptions,
    target,
    appDirectory,
    useLegacyDecorators,
    modules,
    styledComponents,
    useTsLoader,
    overrideBrowserslist,
  } = options;

  const useSSR = target === 'server';

  const envOptions = prepareEnvOptions(options);

  const chain = createBabelChain();

  const baseConfigChain = getBaseBabelChain({
    appDirectory,
    useTsLoader,
    runEnvironments: isTest() || target === 'server' ? 'node' : 'browsers',
    // https://babeljs.io/docs/en/babel-preset-react#runtime
    jsxTransformRuntime: isBeyondReact17(appDirectory)
      ? 'automatic'
      : 'classic',
    presets: {
      // 与内部的preset-env配置合并
      envOptions,
      typescriptOptions: {
        allExtensions: true,
        allowDeclareFields: true,
        isTSX: true,
      },
      reactOptions: {
        // Adds component stack to warning messages
        // Adds __self attribute to JSX which React will use for some warnings
        development: isDev() || isTest(),
        // Will use the native built-in instead of trying to polyfill
        // behavior for any plugins that require one.
        useBuiltIns: true,
        // 原来配置中没有配置这个，默认为false，而 base config里有配置
        useSpread: false,
      },
    },
    plugins: {
      lodashOptions,
      import: { antd: { libraryDirectory: useSSR ? 'lib' : 'es' } },
      transformRuntime: {
        // version, regenerator 在 base config 里已配置
        // https://babeljs.io/docs/en/babel-plugin-transform-runtime#useesmodules
        // We should turn this on once the lowest version of Node LTS
        // supports ES Modules.
        useESModules: !modules,
        helpers: target === 'client' && !isTest(),
      },
      transformReactRemovePropTypes: isProd()
        ? {
            // 内部默认 removeImport: true,
          }
        : false,
      styledComponentsOptions: styledComponents,
    },
    syntax: 'es5',
    useLegacyDecorators,
    overrideBrowserslist,
  });

  chain
    .plugin('built-in/babel-plugin-lock-corejs-version')
    .use(join(__dirname, './built-in/babel-plugin-lock-corejs-version'));

  return chain.merge(baseConfigChain);
};
