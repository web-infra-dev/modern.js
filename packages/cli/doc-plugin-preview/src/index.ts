import path, { join } from 'path';
import { RspackVirtualModulePlugin } from 'rspack-plugin-virtual-module';
import type { DocPlugin, RouteMeta } from '@modern-js/doc-core';
import { remarkCodeToDemo } from './codeToDemo';
import { injectDemoBlockImport, toValidVarName } from './utils';
import { demoBlockComponentPath, demoComponentPath } from './constant';

export type Options = {
  /**
   * preview in mobile mode or not
   * when isMobile is true, 1. aside will hide. 2. default preview component by iframe
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
  const demoRuntimeModule = new RspackVirtualModulePlugin({});
  const getRouteMeta = () => routeMeta;
  return {
    name: '@modern-js/doc-plugin-preview',
    async addPages(_config, _isProd, routes) {
      // init routeMeta
      routeMeta = routes;

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
            const { pageName } = routeMeta.find(
              meta => meta.absolutePath === filepath,
            )!;

            const registerDemo = (
              demoId: string,
              demoPath: string,
              isMobileMode: boolean,
            ) => {
              if (isMobileMode) {
                // only add demoMeta in mobile mode
                demoMeta[filepath] = demoMeta[filepath] ?? [];
                const isExist = demoMeta[filepath].find(
                  item => item.id === demoId,
                );
                if (!isExist) {
                  demoMeta[filepath].push({
                    id: demoId,
                    virtualModulePath: demoPath,
                  });
                }
              }
            };

            visit(ast, 'mdxJsxFlowElement', (node: any) => {
              if (node.name === 'code') {
                const src = node.attributes.find(
                  (attr: { name: string; value: string }) =>
                    attr.name === 'src',
                )?.value;
                const isMobileMode =
                  node.attributes.find(
                    (attr: { name: string; value: boolean }) =>
                      attr.name === 'isMobile',
                  )?.value ?? isMobile;
                if (!src) {
                  return;
                }
                const id = `${toValidVarName(pageName)}_${index++}`;
                registerDemo(id, src, isMobileMode);
              }
            });

            visit(ast, 'code', (node: any) => {
              if (node.lang === 'jsx' || node.lang === 'tsx') {
                const { value } = node;
                const isPure = node?.meta?.includes('pure');

                // do not anything for pure mode
                if (isPure) {
                  return;
                }

                // every code block can change their preview mode by meta
                const isMobileMode =
                  node?.meta?.includes('mobile') ||
                  (!node?.meta?.includes('web') && isMobile);

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
                registerDemo(id, virtualModulePath, isMobileMode);

                fs.ensureDirSync(join(demoDir));
                fs.writeFileSync(
                  virtualModulePath,
                  injectDemoBlockImport(value, demoBlockComponentPath),
                );
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
            .rule('Raw')
            .resourceQuery(/raw/)
            .type('asset/source')
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
      globalComponents: [
        path.join(
          __dirname,
          '..',
          'static',
          'global-components',
          'Container.tsx',
        ),
      ],
    },
    globalStyles: path.join(
      __dirname,
      '..',
      'static',
      'global-styles',
      `${isMobile ? 'mobile' : 'web'}.css`,
    ),
    addSSGRoutes() {
      return demoRoutes;
    },
  };
}
