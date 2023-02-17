import { dirname, join } from 'path';
import { pathToFileURL } from 'url';
import { HelmetData } from 'react-helmet-async';
import { PageData, UserConfig } from 'shared/types';
import {
  OUTPUT_DIR,
  APP_HTML_MARKER,
  HEAD_MARKER,
  HTML_START_TAG,
  BODY_START_TAG,
} from './constants';
import { createModernBuilder } from './createBuilder';
import { writeSearchIndex } from './searchIndex';
import { modifyConfig, beforeBuild, afterBuild } from './hooks';
import { normalizeSlash } from '@/shared/utils';
import type { Route } from '@/node/route/RouteService';

export async function bundle(rootDir: string, config: UserConfig) {
  try {
    const [clientBuilder, ssrBuilder] = await Promise.all([
      createModernBuilder(rootDir, config, false),
      createModernBuilder(rootDir, config, true, {
        output: {
          distPath: {
            root: `${config.doc?.outDir ?? OUTPUT_DIR}/ssr`,
          },
        },
      }),
    ]);
    await Promise.all([clientBuilder.build(), ssrBuilder.build()]);
  } finally {
    await writeSearchIndex(config);
  }
}

export interface SSRBundleExports {
  render: (
    url: string,
    helmetContext: object,
  ) => Promise<{ appHtml: string; pageData: PageData }>;
  routes: Route[];
}

export async function renderPages(config: UserConfig) {
  const cwd = process.cwd();
  const outputPath = join(cwd, OUTPUT_DIR);
  const ssrBundlePath = join(outputPath, 'ssr', 'bundles', 'main.js');
  const { default: fs } = await import('@modern-js/utils/fs-extra');
  const { default: ssrExports } = await import(
    pathToFileURL(ssrBundlePath).toString()
  );
  const { render, routes } = ssrExports as SSRBundleExports;
  // Get the html generated by builder, as the default ssr template
  const htmlTemplatePath = join(outputPath, 'html', 'main', 'index.html');
  const htmlTemplate = await fs.readFile(htmlTemplatePath, 'utf-8');
  const iconLink = config.doc?.icon
    ? `<link rel="icon" href="${config.doc.icon}" />`
    : '';

  await Promise.all(
    routes.map(async route => {
      const helmetContext: HelmetData = {
        context: {},
      } as HelmetData;
      const routePath = route.path;
      const { appHtml } = await render(routePath, helmetContext.context);

      const { helmet } = helmetContext.context;

      let html = htmlTemplate
        .replace(APP_HTML_MARKER, appHtml)
        .replace(
          HEAD_MARKER,
          (config.doc?.head || [])
            .concat(iconLink)
            .concat([
              helmet?.title?.toString(),
              helmet?.meta?.toString(),
              helmet?.link?.toString(),
              helmet?.style?.toString(),
            ])
            .join(''),
        );
      if (helmet?.htmlAttributes) {
        html = html.replace(
          HTML_START_TAG,
          `${HTML_START_TAG} ${helmet?.htmlAttributes?.toString()}`,
        );
      }

      if (helmet?.bodyAttributes) {
        html = html.replace(
          BODY_START_TAG,
          `${BODY_START_TAG} ${helmet?.bodyAttributes?.toString()}`,
        );
      }

      const normalizeHtmlFilePath = (path: string) => {
        const normalizedBase = normalizeSlash(config.doc?.base || '/');

        if (path.endsWith('/')) {
          return `${path}index.html`.replace(normalizedBase, '');
        }

        return `${path}.html`.replace(normalizedBase, '');
      };
      const fileName = normalizeHtmlFilePath(routePath);
      await fs.ensureDir(join(outputPath, dirname(fileName)));
      await fs.writeFile(join(outputPath, fileName), html);
    }),
  );
  // Remove ssr bundle
  await fs.remove(join(outputPath, 'ssr'));
  await fs.remove(join(outputPath, 'html', 'main', 'index.html'));
}

export async function build(rootDir: string, config: UserConfig) {
  const docPlugins = [...(config.doc?.plugins ?? [])];
  const isProd = true;
  const modifiedConfig = await modifyConfig({
    config,
    docPlugins,
  });

  await beforeBuild({
    config: modifiedConfig,
    docPlugins,
    isProd,
  });
  await bundle(rootDir, modifiedConfig);
  await renderPages(modifiedConfig);
  await afterBuild({
    config: modifiedConfig,
    docPlugins,
    isProd,
  });
}
