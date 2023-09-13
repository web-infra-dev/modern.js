/** @type {import('@modern-js/module-tools').ModuleConfigParams} */
module.exports = {
  buildConfig: {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es2019',
    outDir: './dist',
    externalHelpers: true,
    dts: process.env.SKIP_DTS !== 'true' ? {} : false,
  },
};
