module.exports = {
  buildConfig: [
    {
      buildType: 'bundleless',
      format: 'cjs',
      // autoExternal: false,
      // externals: [
      //   /node_modules/,
      //   '@modern-js/plugin-lint',
      //   '@modern-js/plugin-changeset',
      // ],
      target: 'es6',
      sourceMap: true,
      // dts: false,
    },
  ],
};
