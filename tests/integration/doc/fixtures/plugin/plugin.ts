import path from 'path';
import { DocPlugin } from '@modern-js/doc-tools';

export function docPluginDemo(): DocPlugin {
  return {
    name: 'doc-plugin-demo',
    addRoutes() {
      return [
        {
          routePath: '/filepath-route',
          filepath: path.join(__dirname, 'blog', 'index.md'),
        },
        {
          routePath: '/content-route',
          content: '# Demo2',
        },
      ];
    },
  };
}
