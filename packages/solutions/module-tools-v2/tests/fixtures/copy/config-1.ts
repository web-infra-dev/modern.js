import path from 'path';
import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    copy: {
      patterns: [
        /**
         * copy file to file
         */
        {
          from: './temp-1/a.png',
          to: './dist/temp-1/b.png',
        },
        /**
         * copy file to dir
         */
        {
          from: './temp-2/a.png',
          to: './dist/temp-2',
        },
        /**
         * copy dir to dir
         */
        {
          from: './temp-3/',
          to: './dist/temp-3',
        },
        /**
         * copy dir to file
         */
        {
          from: './temp-4/',
          to: './dist/temp-4/_index.html',
        },
        /**
         * copy glob to dir
         */
        {
          from: './*.html',
          to: './dist/temp-5',
          context: path.join(__dirname, './src'),
        },
        /**
         * copy glob to file
         */
        {
          from: './*.html',
          to: './dist/temp-6/index.html',
          context: path.join(__dirname, './src'),
        },
      ],
      options: {
        enableCopySync: true,
      },
    },
  },
});
