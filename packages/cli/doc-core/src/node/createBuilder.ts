import path from 'path';
import { createRequire } from 'module';
import type { Options } from '@mdx-js/loader';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const require = createRequire(import.meta.url);

export async function createMdxOptions(): Promise<Options> {
  const { default: remarkGFMPlugin } = await import('remark-gfm');

  const { default: rehypePluginAutolinkHeadings } = await import(
    'rehype-autolink-headings'
  );

  return {
    remarkPlugins: [[remarkGFMPlugin]],
    rehypePlugins: [
      [
        rehypePluginAutolinkHeadings,
        {
          properties: {
            class: 'header-anchor',
            ariaHidden: 'true',
          },
          content: {
            type: 'text',
            value: '#',
          },
        },
      ],
    ],
  };
}

export async function createModernBuilder(rootDir: string) {
  const PACKAGE_ROOT = path.join(__dirname, '..');
  const userRoot = path.resolve(rootDir || process.cwd());
  const { createBuilder } = await import('@modern-js/builder');
  const { builderWebpackProvider } = await import(
    '@modern-js/builder-webpack-provider'
  );
  const { createRouteVirtualModulePlugin } = await import(
    './route/createRouteVirtualModulePlugin'
  );

  const routeVirtualModulePlugin = await createRouteVirtualModulePlugin(
    userRoot,
    PACKAGE_ROOT,
  );

  const mdxOptions = await createMdxOptions();
  const builderProvider = builderWebpackProvider({
    builderConfig: {
      html: {
        template: path.join(PACKAGE_ROOT, 'index.html'),
      },
      output: {
        distPath: {
          root: 'build',
        },
      },
      source: {
        alias: {
          'react/jsx-runtime': require.resolve('react/jsx-runtime'),
        },
        include: [PACKAGE_ROOT],
      },
      tools: {
        cssExtract: {},
        babel(options, { modifyPresetReactOptions }) {
          modifyPresetReactOptions({
            runtime: 'automatic',
          });
          return options;
        },
        webpackChain(chain, { CHAIN_ID }) {
          const [loader, options] = chain.module
            .rule(CHAIN_ID.RULE.JS)
            .use(CHAIN_ID.USE.BABEL)
            .values();
          chain.module
            .rule('MDX')
            .test(/\.mdx?$/)
            .use('mdx-loader')
            .loader(loader as unknown as string)
            .options(options)
            .loader(require.resolve('@mdx-js/loader'))
            .options(mdxOptions)
            .end();
          chain.resolve.extensions.merge(['.ts', '.tsx', '.mdx', '.md']);
        },
        webpack(config) {
          config.plugins!.push(routeVirtualModulePlugin);
          return config;
        },
      },
    },
  });
  const entry = path.join(PACKAGE_ROOT, 'src', 'runtime', 'clientEntry.tsx');
  const builder = await createBuilder(builderProvider, {
    target: ['web'],
    entry: {
      main: entry,
    },
  });
  return builder;
}
