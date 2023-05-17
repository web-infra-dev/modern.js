import path, { join } from 'path';
import { sync } from '@modern-js/utils/globby';
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
  const cwd = process.cwd();
  const DemoComponentPath = path.join(__dirname, '..', 'dist/demo.js');
  const demoRuntimeModule = new RspackVirtualModulePlugin({});
  return {
    name: '@modern-js/doc-plugin-preview',
    addPages() {
      return [
        {
          routePath: '/~demo/:id',
          content: `
            ---
            pageType: custom
            ---
            import Demo from '${DemoComponentPath}'
            <Demo />
          `,
        },
      ];
    },
    async beforeBuild(config) {
      const files = sync('**/*.mdx', { cwd: config.root, onlyFiles: true });
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
            return `import * as Route${index} from '${filepath}?meta';`;
          })
          .join('\n')}
        export const demos = ${files.map((_, index) => `Route${index}`).flat()};
        `;
      const virtualMetaPath = join(
        cwd,
        'node_modules',
        '.modern-doc',
        'client-runtime',
        'virtual-meta.js',
      );
      demoRuntimeModule.writeModule(virtualMetaPath, virtualMeta);
    },
    builderConfig: {
      tools: {
        rspack: {
          plugins: [demoRuntimeModule],
        },
        bundlerChain(chain) {
          chain.module
            .rule('MDX')
            .enforce('pre')
            .test(/\.mdx\?meta/)
            .use('mdx-meta-loader')
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
