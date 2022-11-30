module.exports = {
  testing: {
    transformer: 'ts-jest',
  },
  output: {
    buildConfig: {
      buildType: 'bundle',
      enableDts: true,
      format: 'esm',
    },
  },
};
