import * as path from 'path';
import docTools, { defineConfig } from '@modern-js/doc-tools';
import { pluginPreview } from '@modern-js/doc-plugin-preview';
import { docPluginDemo } from './plugin';

export default defineConfig({
  plugins: [docTools()],
  doc: {
    root: path.join(__dirname, 'doc'),
    plugins: [docPluginDemo(), pluginPreview({ isMobile: true })],
  },
});
