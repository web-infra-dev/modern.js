import path from 'path';
import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    copy: {
      patterns: [
        {
          from: './src/*.html',
          to: './dist/copy-src',
          context: path.join(__dirname, './src'),
        },
        {
          from: './template/a.png',
          to: './dist/template/b.png',
          context: path.join(__dirname, './src'),
        },
        {
          from: './html/',
          to: './dist/html/_index.html',
          context: path.join(__dirname, './src'),
        },
      ],
    },
  },
});
