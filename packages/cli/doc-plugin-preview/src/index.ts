import path from 'path';
import { fileURLToPath } from 'url';
import { DocPlugin } from '@modern-js/doc-core';
import { RspackVirtualModulePlugin } from 'rspack-plugin-virtual-module';
import { remarkCodeToDemo } from './codeToDemo';

export type Options = {
  /**
   * preview in mobile mode or not
   * @default true
   */
  isMobile: boolean;
};

/**
 * The plugin is used to preview component.
 */
export function pluginPreview(options?: Options): DocPlugin {
  const isMobile = options?.isMobile ?? true;
  const DemoComponentPath = path.join(__dirname, '..', 'dist/demo.js');
  const demoRuntimeModule = new RspackVirtualModulePlugin({});
  return {
    name: '@modern-js/doc-plugin-preview',
    addPages(_config, routes) {
      const files = routes
        .map(route => route.absolutePath)
        .filter(item => item.endsWith('.mdx'));
      /**
       * expect the meta of each demo file is like this:
       * {
       *   id,
       *   component,
       * }
       */
      // const obj = arr.reduce((acc, { id, component }) => {
      //   return { ...acc, [id]: component };
      // }, {});
      const virtualMeta = `
        ${files
          .map((filepath, index) => {
            return `import Route${index} from '${filepath}?meta';`;
          })
          .join('\n')}
        export const demos = [${files
          .map((_, index) => `Route${index}`)
          .flat()
          .join(',')}];
        `;
      demoRuntimeModule.writeModule('virtual-meta', virtualMeta);

      return [
        {
          routePath: '/~demo/:id',
          content: `---
pageType: custom
---

import Demo from '${DemoComponentPath}'

<Demo />
          `,
        },
      ];
    },
    builderConfig: {
      tools: {
        rspack: {
          plugins: [demoRuntimeModule],
        },
        bundlerChain(chain) {
          const dirname = path.dirname(fileURLToPath(new URL(import.meta.url)));
          chain.module
            .rule('MDX')
            .test(/\.mdx/)
            .resourceQuery(/meta/)
            .use('mdx-meta-loader')
            .loader(path.join(dirname, '../mdx-meta-loader.cjs'))
            .end();

          chain.resolve.extensions.prepend('.md').prepend('.mdx');
        },
      },
    },
    markdown: {
      remarkPlugins: [[remarkCodeToDemo, { isMobile }]],
    },
  };
}
