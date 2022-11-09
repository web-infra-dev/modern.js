import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      bundleOptions: {
        entry: ['./src/index.ts'],
        skipDeps: false,
      },
      path: './dist/1',
    },
    {
      buildType: 'bundle',
      bundleOptions: {
        entry: ['./src/index.ts'],
        skipDeps: false,
        externals: ['react'],
      },
      path: './dist/2',
    },
    {
      buildType: 'bundle',
      bundleOptions: {
        entry: ['./src/index.ts'],
        skipDeps: {
          dependencies: true,
        },
      },
      path: './dist/3',
    },
    {
      buildType: 'bundle',
      bundleOptions: {
        entry: ['./src/index.ts'],
        skipDeps: {
          devDependencies: true,
        },
      },
      path: './dist/4',
    },
    {
      buildType: 'bundle',
      bundleOptions: {
        entry: ['./src/index.ts'],
        skipDeps: {
          peerDependencies: true,
        },
      },
      path: './dist/5',
    },
  ],
});
