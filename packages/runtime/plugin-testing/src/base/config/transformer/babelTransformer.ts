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
  plugins: [
    [
      require.resolve('@babel/plugin-proposal-decorators'),
      {
        version: 'legacy',
      },
    ],
  ],
  configFile: false,
  babelrc: false,
});

export default babelTransformer;
