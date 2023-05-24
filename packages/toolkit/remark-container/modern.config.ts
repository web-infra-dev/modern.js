// https://modernjs.dev/module-tools/en/api
export default {
  testing: {
    transformer: 'ts-jest',
  },
  buildConfig: {
    buildType: 'bundle',
    format: 'cjs',
    sourceMap: true,
    dts: false,
  },
};
