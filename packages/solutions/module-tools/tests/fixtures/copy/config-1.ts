import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      outDir: 'dist',
      copy: {
        patterns: [
          /**
           * copy file to file
           */
          {
            from: './temp-1/a.png',
            context: __dirname,
            to: './temp-1/b.png',
          },
        ],
        options: {
          enableCopySync: true,
        },
      },
    },
    {
      outDir: 'dist',
      copy: {
        patterns: [
          /**
           * copy file to dir
           */
          {
            from: './temp-2/a.png',
            context: __dirname,
            to: './temp-2',
          },
        ],
        options: {
          enableCopySync: true,
        },
      },
    },
    {
      outDir: 'dist',
      copy: {
        patterns: [
          /**
           * copy dir to dir
           */
          {
            from: './temp-3/',
            to: './temp-3',
            context: __dirname,
          },
        ],
        options: {
          enableCopySync: true,
        },
      },
    },
    {
      outDir: 'dist',
      copy: {
        patterns: [
          /**
           * copy dir to file
           */
          {
            from: './temp-4/',
            context: __dirname,
            to: './temp-4/_index.html',
          },
        ],
        options: {
          enableCopySync: true,
        },
      },
    },
    {
      outDir: 'dist',
      copy: {
        patterns: [
          /**
           * copy glob to dir
           */
          {
            from: './*.html',
            to: './temp-5',
          },
        ],
        options: {
          enableCopySync: true,
        },
      },
    },
    {
      copy: {
        patterns: [
          /**
           * copy glob to file
           */
          {
            from: './*.html',
            to: './temp-6/index.html',
          },
        ],
        options: {
          enableCopySync: true,
        },
      },
    },
  ],
});
