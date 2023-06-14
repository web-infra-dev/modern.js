import { dirname, isAbsolute, join } from 'path';
import { pathToFileURL } from 'url';
import { HelmetData } from 'react-helmet-async';
import chalk from '@modern-js/utils/chalk';
import fs from '@modern-js/utils/fs-extra';
import { PageData, UserConfig } from 'shared/types';
import {
  OUTPUT_DIR,
  APP_HTML_MARKER,
  HEAD_MARKER,
  HTML_START_TAG,
  BODY_START_TAG,
  PUBLIC_DIR,
} from './constants';
import { createModernBuilder } from './createBuilder';
import { writeSearchIndex } from './searchIndex';
import { logger } from './utils';
import { PluginDriver } from './PluginDriver';
import { APPEARANCE_KEY, normalizeSlash, withBase } from '@/shared/utils';
import type { Route } from '@/node/route/RouteService';

// In the first render, the theme will be set according to the user's system theme
const CHECK_DARK_LIGHT_SCRIPT = `
<script id="check-dark-light">
;(() => {
  const saved = localStorage.getItem('${APPEARANCE_KEY}')
  const prefereDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (!saved || saved === 'auto' ? prefereDark : saved === 'dark') {
    document.documentElement.classList.add('dark')
  }
})()
</script>
`;

export async function bundle(
  rootDir: string,
  config: UserConfig,
  pluginDriver: PluginDriver,
) {
  try {
    const outputDir = config.doc?.outDir ?? OUTPUT_DIR;
    const cwd = process.cwd();
    const [clientBuilder, ssrBuilder] = await Promise.all([
      createModernBuilder(rootDir, config, pluginDriver, false),
      createModernBuilder(rootDir, config, pluginDriver, true, {
        output: {
          distPath: {
            root: `${outputDir}/ssr`,
          },
        },
      }),
    ]);
    await Promise.all([clientBuilder.build(), ssrBuilder.build()]);
    // Handle logo path
    const logoPaths = [];
    const { logo } = config.doc;
    if (typeof logo === 'string') {
      logoPaths.push(logo);
    } else if (typeof logo === 'object') {
      logoPaths.push(logo.light);
      logoPaths.push(logo.dark);
    }
    logoPaths
      .filter(p => p.startsWith('/'))
      .forEach(p => {
        const normalize = (rawPath: string) =>
          isAbsolute(rawPath) ? rawPath : join(cwd, rawPath);
        // move logo to output folder
        const logoPath = join(
          normalize(rootDir || config.doc.root),
          PUBLIC_DIR,
          p,
        );
        const outputLogoPath = join(normalize(outputDir), p);
        fs.copyFileSync(logoPath, outputLogoPath);
      });
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

export async function renderPages(
  config: UserConfig,
  pluginDriver: PluginDriver,
) {
  logger.info('Rendering pages...');
  const startTime = Date.now();

  const cwd = process.cwd();
  const outputPath = config.doc?.outDir ?? join(cwd, OUTPUT_DIR);
  const ssrBundlePath = join(outputPath, 'ssr', 'bundles', 'main.js');
  const { default: fs } = await import('@modern-js/utils/fs-extra');
  const { default: ssrExports } = await import(
    pathToFileURL(ssrBundlePath).toString()
  );
  const { render, routes } = ssrExports as SSRBundleExports;
  const base = config.doc?.base ?? '';
  // Get the html generated by builder, as the default ssr template
  const htmlTemplatePath = join(outputPath, 'html', 'main', 'index.html');
  const htmlTemplate = await fs.readFile(htmlTemplatePath, 'utf-8');
  const additionalRoutes = (await pluginDriver.addSSGRoutes()).map(route => ({
    path: withBase(route.path, base),
  }));
  await Promise.all(
    [...routes, ...additionalRoutes]
      .filter(route => {
        // filter the route including dynamic params
        return !route.path.includes(':');
      })
      .map(async route => {
        const helmetContext: HelmetData = {
          context: {},
        } as HelmetData;
        const routePath = route.path;
        let appHtml: string;
        try {
          ({ appHtml } = await render(routePath, helmetContext.context));
        } catch (e) {
          logger.error(`page "${route.path}" render error: ${e.stack}`);
          return;
        }

        const { helmet } = helmetContext.context;

        let html = htmlTemplate
          // Don't use `string` as second param
          // To avoid some special characters transformed to the marker, such as `$&`, etc.
          .replace(APP_HTML_MARKER, () => appHtml)
          .replace(
            HEAD_MARKER,
            (config.doc?.head || [])
              .concat([
                helmet?.title?.toString(),
                helmet?.meta?.toString(),
                helmet?.link?.toString(),
                helmet?.style?.toString(),
                helmet?.script?.toString(),
                CHECK_DARK_LIGHT_SCRIPT,
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

  const totalTime = Date.now() - startTime;
  logger.success(`Pages rendered in ${chalk.yellow(totalTime)} ms.`);
}

export async function build(rootDir: string, config: UserConfig) {
  const pluginDriver = new PluginDriver(config, true);
  await pluginDriver.init();
  const modifiedConfig = await pluginDriver.modifyConfig();
  await pluginDriver.beforeBuild();
  await bundle(rootDir, modifiedConfig, pluginDriver);
  await renderPages(modifiedConfig, pluginDriver);
  await pluginDriver.afterBuild();
}
