import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    format: 'iife',
    path: './dist/bundleless',
  } as any,
});
