import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      autoExternal: false,
      outdir: './dist/1',
    },
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      autoExternal: false,
      externals: ['react'],
      outdir: './dist/2',
    },
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      autoExternal: {
        dependencies: true,
      },
      outdir: './dist/3',
    },
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      outdir: './dist/4',
    },
    {
      buildType: 'bundle',
      input: ['./src/index.ts'],
      autoExternal: {
        peerDependencies: true,
      },
      outdir: './dist/5',
    },
  ],
});
