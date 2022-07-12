import { getBrowserslist } from '@modern-js/utils';
import { createBabelChain } from './babel-chain';
import { IBaseBabelConfigOption } from '.';

const es6BrowserList = [
  'chrome > 61',
  'edge > 16',
  'firefox > 60',
  'safari > 11',
  'ios_saf > 11',
];

const getPresetOptions = (options: any) =>
  typeof options === 'object' ? options : {};

export const getPresetChain = (option: IBaseBabelConfigOption) => {
  const {
    appDirectory,
    presets: { envOptions, reactOptions, typescriptOptions } = {},
    syntax = 'es5',
    type = 'module',
    runEnvironments = 'browsers',
    jsxTransformRuntime = 'automatic',
    useTsLoader = false,
  } = option;
  const chain = createBabelChain();
  // set envOptions = false
  const disableEnvPreset = typeof envOptions === 'boolean' && !envOptions;
  const disableReactPreset = typeof reactOptions === 'boolean' && !reactOptions;
  const disableTypescriptPreset =
    typeof typescriptOptions === 'boolean' && !typescriptOptions;
  if (!disableEnvPreset) {
    const browsersTargets =
      syntax === 'es5' ? getBrowserslist(appDirectory) : es6BrowserList;
    const targets =
      runEnvironments === 'node' ? { node: '12' } : browsersTargets;
    const presetEnvOptions = {
      targets,
      modules: type === 'commonjs' ? 'commonjs' : false,
      bugfixes: runEnvironments !== 'node',
      shippedProposals: type === 'module' && syntax === 'es6+',
      ...getPresetOptions(envOptions),
    };
    chain
      .preset('@babel/preset-env')
      .use(require.resolve('@babel/preset-env'), [presetEnvOptions]);
  }

  if (!disableReactPreset) {
    const classicOption = {
      useBuiltIns: !(type === 'module' && syntax === 'es5'),
      useSpread: type === 'module' && syntax === 'es5',
    };
    // auto useSpread enable when automatic
    const automaticOption = {};
    const presetReactOptions = {
      runtime: jsxTransformRuntime === 'classic' ? 'classic' : 'automatic',
      ...(jsxTransformRuntime === 'classic' ? classicOption : automaticOption),
      ...getPresetOptions(reactOptions),
    };
    chain
      .preset('@babel/preset-react')
      .use(require.resolve('@babel/preset-react'), [presetReactOptions]);
  }

  if (!(useTsLoader || disableTypescriptPreset)) {
    const typescriptPresetOptions = {
      allowNamespaces: true,
      allExtensions: true,
      allowDeclareFields: true,
      isTSX: true,
      ...getPresetOptions(typescriptOptions),
    };
    chain
      .preset('@babel/preset-typescript')
      .use(require.resolve('@babel/preset-typescript'), [
        typescriptPresetOptions,
      ]);
  }

  return chain;
};
