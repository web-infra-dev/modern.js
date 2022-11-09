import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundleless',
      bundlelessOptions: {
        styleCompileMode: 'with-source-code',
      },
      path: './dist/with-source-code',
      copy: { options: { enableCopySync: true } },
    },
    {
      buildType: 'bundleless',
      bundlelessOptions: {
        styleCompileMode: 'only-compiled-code',
      },
      path: './dist/compiled-code',
      copy: { options: { enableCopySync: true } },
    },
  ],
});
