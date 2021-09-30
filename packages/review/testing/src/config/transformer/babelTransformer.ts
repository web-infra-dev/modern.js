import babelJest from 'babel-jest';

const babelTransformer = (babelJest.createTransformer as any)?.({
  presets: [
    [
      require.resolve('@modern-js/babel-preset-app'),
      {
        appDirectory: process.cwd(),
        modules: 'cjs',
      },
    ],
  ],
  configFile: false,
  babelrc: false,
});

export default babelTransformer;
