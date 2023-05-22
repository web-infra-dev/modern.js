import path from 'path';
import { fileURLToPath } from 'url';
// TODO: Add @modern-js/doc-shared to provide types
import type { DocPlugin } from '../../doc-core';

/**
 * The plugin is used to add medium-zoom to the doc site.
 */
export function pluginMediumZoom(): DocPlugin {
  const __dirname = path
    .dirname(fileURLToPath(import.meta.url))
    // Fix: adapt windows
    .replace(/\\/g, '/');
  return {
    name: '@modern-js/doc-plugin-medium-zoom',
    globalUIComponents: [
      path.posix.join(__dirname, '../src/components/MediumZoom.tsx'),
    ],
  };
}
