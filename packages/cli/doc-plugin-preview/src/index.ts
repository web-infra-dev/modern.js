import path from 'path';
import { RspackVirtualModulePlugin } from 'rspack-plugin-virtual-module';
import type { DocPlugin, RouteMeta } from '@modern-js/doc-core';
import { remarkCodeToDemo } from './codeToDemo';

export type Options = {
  /**
   * preview in mobile mode or not
   * @default true
   */
  isMobile: boolean;
};

// eslint-disable-next-line import/no-mutable-exports
export let routeMeta: RouteMeta[];

/**
 * The plugin is used to preview component.
 */
export function pluginPreview(options?: Options): DocPlugin {
  const isMobile = options?.isMobile ?? true;
  const demoComponentPath = path.join(__dirname, '..', 'dist/demo.js');
  const demoRuntimeModule = new RspackVirtualModulePlugin({});
  const getRouteMeta = () => routeMeta;

  return {
    name: '@modern-js/doc-plugin-preview',
    addPages(_config, _isProd, routes) {
      // init routeMeta
      routeMeta = routes;
      // only addPages in mobile mode
      if (!isMobile) {
        return [];
      }
      const files = routes.map(route => route.absolutePath);
      /**
       * expect the meta of each demo file is like this:
       * {
       *   id,
       *   component,
       * }
       */
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
          content: `

import Demo from '${demoComponentPath}'

<Demo />

export const pageType = "blank";

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
          chain.module
            .rule('MDX')
            .oneOf('MDXMeta')
            .before('MDXCompile')
            .resourceQuery(/meta/)
            .use('mdx-meta-loader')
            .loader(path.join(__dirname, '../mdx-meta-loader.cjs'))
            .end();

          chain.resolve.extensions.prepend('.md').prepend('.mdx');
        },
      },
    },
    markdown: {
      remarkPlugins: [[remarkCodeToDemo, { isMobile, getRouteMeta }]],
    },
    globalStyles: path.join(
      __dirname,
      `../static/${isMobile ? 'mobile' : 'web'}.css`,
    ),
  };
}
