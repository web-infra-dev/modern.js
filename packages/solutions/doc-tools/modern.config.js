module.exports = {
  testing: {
    transformer: 'ts-jest',
  },
  output: {
    buildConfig: {
      format: 'esm',
      enableDts: true,
    },
  },
};
