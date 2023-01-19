// https://modernjs.dev/docs/apis/module/config
export default {
  testing: {
    transformer: 'ts-jest',
  },
  buildConfig: {
    buildType: 'bundle',
    format: 'esm',
    target: 'es2020',
    sourceMap: true,
  },
};
