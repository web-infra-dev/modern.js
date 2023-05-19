import path from 'path';
import { fileURLToPath } from 'url';
import type { DocPlugin } from '../../doc-core';

/**
 * The plugin is used to add medium-zoom to the doc site.
 */
export function pluginMediumZoom(): DocPlugin {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return {
    name: '@modern-js/doc-plugin-medium-zoom',
    globalUIComponents: [
      path.join(__dirname, '../src/components/MediumZoom.tsx'),
    ],
  };
}
