import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    format: 'umd',
    path: './dist/bundleless',
  } as any,
});
