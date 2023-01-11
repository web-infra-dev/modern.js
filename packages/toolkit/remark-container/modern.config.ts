// https://modernjs.dev/docs/apis/module/config
export default {
  testing: {
    transformer: 'ts-jest',
  },
  buildConfig: {
    buildType: 'bundle',
    format: 'cjs',
    sourceMap: true,
  },
};
