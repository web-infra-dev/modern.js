import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    target: 'es2021',
    buildType: 'bundle',
    path: './dist/bundle',
  } as any,
});
