import path, { join } from 'path';
import { RspackVirtualModulePlugin } from 'rspack-plugin-virtual-module';
import type { DocPlugin, RouteMeta } from '@modern-js/doc-core';
import { remarkCodeToDemo } from './codeToDemo';

export type Options = {
  /**
   * preview in mobile mode or not
   * @default false
   */
  isMobile: boolean;
};

// eslint-disable-next-line import/no-mutable-exports
export let routeMeta: RouteMeta[];
export const demoRoutes: { path: string }[] = [];

/**
 * The plugin is used to preview component.
 */
export function pluginPreview(options?: Options): DocPlugin {
  const isMobile = options?.isMobile ?? false;
  const demoComponentPath = path.join(__dirname, '..', 'dist/demo.js');
  const demoRuntimeModule = new RspackVirtualModulePlugin({});
  const getRouteMeta = () => routeMeta;

  return {
    name: '@modern-js/doc-plugin-preview',
    async addPages(_config, _isProd, routes) {
      // init routeMeta
      routeMeta = routes;
      // only addPages in mobile mode
      if (!isMobile) {
        return [];
      }
      const files = routes.map(route => route.absolutePath);
      // Write the demo code ahead of time
      // Fix: rspack build error because demo file is not exist, probably the demo file was written in rspack build process?
      await Promise.all(
        files.map(async (filepath, _index) => {
          const { createProcessor } = await import('@mdx-js/mdx');
          const { visit } = await import('unist-util-visit');
          const { default: fs } = await import('@modern-js/utils/fs-extra');
          try {
            const processor = createProcessor();
            const source = await fs.readFile(filepath, 'utf-8');
            const ast = processor.parse(source);
            let index = 1;
            visit(ast, 'code', (node: any) => {
              if (node.lang === 'jsx' || node.lang === 'tsx') {
                const { value } = node;
                const { pageName } = routeMeta.find(
                  meta => meta.absolutePath === filepath,
                )!;
                const id = `${pageName}_${index++}`;

                const demoDir = join(
                  process.cwd(),
                  'node_modules',
                  '.modern-doc',
                  `virtual-demo`,
                );
                const virtualModulePath = join(demoDir, `${id}.tsx`);

                fs.ensureDirSync(join(demoDir));
                fs.writeFileSync(virtualModulePath, value);
              }
            });
          } catch (e) {}
        }),
      );
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
    addSSGRoutes() {
      return isMobile ? demoRoutes : [];
    },
  };
}
