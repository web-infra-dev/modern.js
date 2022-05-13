import { createBabelChain } from '@modern-js/babel-chain';
import { IBaseBabelConfigOption } from '.';

export const getPluginsChain = (option: IBaseBabelConfigOption) => {
  const {
    runEnvironments,
    plugins: {
      import: babelPluginImport,
      transformRuntime,
      transformReactRemovePropTypes,
      styledComponentsOptions,
      lodashOptions,
    } = {},
    useLegacyDecorators = true,
    type = 'module',
    useTsLoader = false,
  } = option;
  const chain = createBabelChain();

  chain
    .plugin('babel-plugin-macros')
    .use(require.resolve('babel-plugin-macros'), [
      { twin: { preset: 'styled-components' } },
    ]);

  if (runEnvironments === 'node') {
    chain
      .plugin('babel-plugin-dynamic-import-node')
      .use(require.resolve('babel-plugin-dynamic-import-node'));
  }

  const { antd } = babelPluginImport || { antd: { libraryDirectory: 'es' } };
  chain
    .plugin('babel-plugin-import')
    .use(require.resolve('babel-plugin-import'), [
      {
        libraryName: 'antd',
        libraryDirectory: antd?.libraryDirectory || 'es',
        style: true,
      },
      'import-antd',
    ]);

  chain
    .plugin('babel-plugin-lodash')
    .use(require.resolve('babel-plugin-lodash'), [lodashOptions || {}]);

  if (useTsLoader) {
    return chain;
  }

  // link: https://github.com/tc39/proposal-decorators
  chain
    .plugin('@babel/plugin-proposal-decorators')
    .use(require.resolve('@babel/plugin-proposal-decorators'), [
      useLegacyDecorators
        ? {
            // https://github.com/nicolo-ribaudo/legacy-decorators-migration-utility
            legacy: true,
            // https://github.com/tc39/proposal-decorators/issues/69
          }
        : {
            legacy: false,
            decoratorsBeforeExport: true,
          },
    ]);

  // babel-preset-env have, but option should change
  // https://2ality.com/2016/10/rest-spread-properties.html
  // https://exploringjs.com/es6/ch_oop-besides-classes.html
  chain
    .plugin('@babel/plugin-proposal-object-rest-spread')
    .use(require.resolve('@babel/plugin-proposal-object-rest-spread'), [
      { useBuiltIns: true },
    ]);

  chain
    .plugin('@babel/plugin-transform-runtime')
    .use(require.resolve('@babel/plugin-transform-runtime'), [
      {
        // By default, babel assumes babel/runtime version 7.0.0-beta.0,
        // explicitly resolving to match the provided helper functions.
        // https://github.com/babel/babel/issues/10261
        version: require('@babel/runtime/package.json').version,
        regenerator: true,
        // https://babeljs.io/docs/en/babel-plugin-transform-runtime#useesmodules
        // We should turn this on once the lowest version of Node LTS
        // supports ES Modules.
        useESModules: type === 'module',
        // Undocumented option that lets us encapsulate our runtime, ensuring
        // the correct version is used
        // https://github.com/babel/babel/blob/090c364a90fe73d36a30707fc612ce037bdbbb24/packages/babel-plugin-transform-runtime/src/index.js#L35-L42
        // absoluteRuntime: absoluteRuntimePath,
        helpers: false,
        ...(transformRuntime || {}),
      },
    ]);

  const disableTransformReactRemovePropTypes =
    typeof transformReactRemovePropTypes === 'boolean' &&
    !transformReactRemovePropTypes;
  if (!disableTransformReactRemovePropTypes) {
    chain.plugin('babel-plugin-transform-react-remove-prop-types').use(
      require.resolve('babel-plugin-transform-react-remove-prop-types'),

      [
        {
          removeImport: true,
          ...(transformReactRemovePropTypes || {}),
        },
      ],
    );
  }

  chain
    .plugin('@babel/plugin-proposal-function-bind')
    .use(require.resolve('@babel/plugin-proposal-function-bind'));

  // link: https://github.com/tc39/proposal-export-default-from
  chain
    .plugin('@babel/plugin-proposal-export-default-from')
    .use(require.resolve('@babel/plugin-proposal-export-default-from'));

  // https://github.com/tc39/proposal-export-ns-from
  chain
    .plugin('@babel/plugin-proposal-export-namespace-from')
    .use(require.resolve('@babel/plugin-proposal-export-namespace-from'));

  // ======= Stage1 =====
  // link: https://github.com/tc39/proposal-pipeline-operator
  chain
    .plugin('@babel/plugin-proposal-pipeline-operator')
    .use(require.resolve('@babel/plugin-proposal-pipeline-operator'), [
      { proposal: 'minimal' },
    ]);

  // link: https://github.com/tc39/proposal-partial-application
  chain
    .plugin('@babel/plugin-proposal-partial-application')
    .use(require.resolve('@babel/plugin-proposal-partial-application'));

  chain
    .plugin('babel-plugin-styled-components')
    .use(require.resolve('babel-plugin-styled-components'), [
      styledComponentsOptions || {},
      'styled-components',
    ]);

  return chain;
};
