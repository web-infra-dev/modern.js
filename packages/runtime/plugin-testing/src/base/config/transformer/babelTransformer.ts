import babelJest from 'babel-jest';

const babelTransformer = (babelJest.createTransformer as any)?.({
  presets: [
    [
      require.resolve('@rsbuild/babel-preset/node'),
      {
        pluginDecorators: {
          version: 'legacy',
        },
      },
    ],
    require.resolve('@babel/preset-react'),
  ],
  configFile: false,
  babelrc: false,
});

export default babelTransformer;
