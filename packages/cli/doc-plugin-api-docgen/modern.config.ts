// https://modernjs.dev/module-tools/en/api
import { dtsConfig } from '@scripts/build';

export default {
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'cjs',
      sourceMap: true,
      target: 'es2020',
      dts: dtsConfig,
    },
  ],
};
