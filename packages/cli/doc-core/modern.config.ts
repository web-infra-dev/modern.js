// https://modernjs.dev/module-tools/en/api
export default {
  testing: {
    transformer: 'ts-jest',
  },
  buildConfig: {
    buildType: 'bundle',
    format: 'esm',
    target: 'es2020',
    sourceMap: true,
    externals: ['@modern-js/mdx-rs-binding', '@rspack/core'],
  },
};
