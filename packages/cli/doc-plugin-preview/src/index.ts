import path, { join } from 'path';
import { RspackVirtualModulePlugin } from 'rspack-plugin-virtual-module';
import type { DocPlugin, RouteMeta } from '@modern-js/doc-core';
import { remarkCodeToDemo } from './codeToDemo';
import { toValidVarName } from './utils';

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
export const demoMeta: Record<
  string,
  { id: string; virtualModulePath: string }[]
> = {};

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
                const isPure = node?.meta?.includes('pure');
                // not transform pure code
                if (isPure) {
                  return;
                }
                const { pageName } = routeMeta.find(
                  meta => meta.absolutePath === filepath,
                )!;
                const id = `${toValidVarName(pageName)}_${index++}`;

                const demoDir = join(
                  process.cwd(),
                  'node_modules',
                  '.modern-doc',
                  `virtual-demo`,
                );

                const virtualModulePath = join(demoDir, `${id}.tsx`);
                demoMeta[filepath] = demoMeta[filepath] ?? [];
                const isExist = demoMeta[filepath].find(item => item.id === id);
                if (!isExist) {
                  demoMeta[filepath].push({
                    id,
                    virtualModulePath,
                  });
                }

                fs.ensureDirSync(join(demoDir));
                fs.writeFileSync(virtualModulePath, value);
              }
            });
          } catch (e) {
            console.error(e);
            throw e;
          }
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
      // only addPages in mobile mode

      return [
        {
          routePath: '/~demo/:id',
          content: `---
pageType: "blank"
---

import Demo from '${demoComponentPath}'

<Demo />
          `,
        },
      ];
    },
    builderConfig: {
      tools: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error
        // @ts-ignore
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
