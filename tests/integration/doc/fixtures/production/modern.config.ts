import * as path from 'path';
import docTools, { defineConfig } from '@modern-js/doc-tools';

export default defineConfig({
  plugins: [docTools()],
  doc: {
    root: path.join(__dirname, 'doc'),
  },
});
