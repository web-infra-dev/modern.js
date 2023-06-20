import type { Rspack } from '@modern-js/builder-rspack-provider';
import { createProcessor } from '@mdx-js/mdx';
import grayMatter from 'gray-matter';
import type { RouteService } from '../route/RouteService';
import { createMDXOptions } from './options';
import { TocItem } from './remarkPlugins/toc';
import { checkLinks } from './remarkPlugins/checkDeadLink';
import { Header, UserConfig } from '@/shared/types';

interface LoaderOptions {
  config: UserConfig;
  docDirectory: string;
  checkDeadLinks: boolean;
  enableMdxRs: boolean;
  routeService: RouteService;
}

export interface PageMeta {
  toc: TocItem[];
  title: string;
  frontmatter: Record<string, any>;
}

export default async function mdxLoader(
  context: Rspack.LoaderContext<LoaderOptions>,
  source: string,
  callback: Rspack.LoaderContext['callback'],
) {
  const options = context.getOptions();
  const filepath = context.resourcePath;
  context.cacheable(true);

  let pageMeta = {
    title: '',
    toc: [],
    frontmatter: {},
  } as PageMeta;

  const { config, docDirectory, checkDeadLinks, routeService, enableMdxRs } =
    options;

  const { data: frontmatter, content } = grayMatter(source);
  let compileResult: string;
  if (!enableMdxRs) {
    const mdxOptions = await createMDXOptions(
      docDirectory,
      config,
      checkDeadLinks,
      routeService,
    );
    const compiler = createProcessor(mdxOptions);

    compiler.data('pageMeta', {
      toc: [],
      title: '',
    });
    const vFile = await compiler.process({
      value: content,
      path: filepath,
    });
    compileResult = String(vFile);
    pageMeta = {
      ...(compiler.data('pageMeta') as { toc: Header[]; title: string }),
      frontmatter,
    } as PageMeta;
  } else {
    const { compile } = require('@modern-js/mdx-rs-binding');
    const { toc, links, title, code } = await compile({
      value: content,
      filepath,
      root: docDirectory,
      development: process.env.NODE_ENV !== 'production',
    });

    compileResult = code;
    pageMeta = {
      toc,
      title,
      frontmatter,
    };
    // We should check dead links in mdx-rs mode
    if (checkDeadLinks) {
      checkLinks(links, filepath, docDirectory, routeService);
    }
  }

  try {
    const result = `globalThis.__RSPRESS_PAGE_META ||= {};
globalThis.__RSPRESS_PAGE_META["${filepath}"] = ${JSON.stringify(pageMeta)};
${compileResult}`;
    callback(null, result);
  } catch (e) {
    console.error(`MDX compile error: ${e.message} in ${filepath}`);
    callback({ message: e.message, name: `${filepath} compile error` });
  }
}
