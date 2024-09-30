module.exports = {
  buildConfig: {
    target: 'es2020',
    autoExternal: {
      dependencies: true,
    },
    dts: false,
    externals: ['bluebird', '@npmcli/run-script'],
    minify: 'terser',
  },
};
