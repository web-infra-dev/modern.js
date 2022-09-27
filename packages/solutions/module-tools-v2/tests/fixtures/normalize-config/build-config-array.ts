import { defineConfig } from '../../../src';

export default defineConfig({
  buildConfig: [{ target: 'es5' }, { dts: false }],
});
