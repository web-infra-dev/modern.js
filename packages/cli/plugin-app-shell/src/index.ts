import fs from 'node:fs';
import path from 'node:path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { logger } from '@modern-js/utils';
import {
  type CssSource,
  DEFAULT_ALLOW_RULES,
  extractCriticalCss,
} from './critical-css';
import {
  getHeadStylesheets,
  getHtmlAttributes,
  injectAppShell,
  SHELL_ELEMENT_ID,
} from './inject';
import { toRuntimeConfig } from './config';
import { renderShells } from './render';
import type { AppShellPluginOptions } from './types';

export type {
  AppShellCriticalCssOptions,
  AppShellEntryOptions,
  AppShellInputOptions,
  AppShellPluginOptions,
} from './types';
export { extractCriticalCss } from './critical-css';
export { injectAppShell } from './inject';
export { toRuntimeConfig } from './config';

interface RouteSpec {
  entryName?: string;
  entryPath?: string;
  isSPA?: boolean;
}

const listCssFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const files: string[] = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...listCssFiles(full));
    } else if (item.name.endsWith('.css')) {
      files.push(full);
    }
  }
  return files.sort();
};

/** Map a public stylesheet URL back to the emitted file under `distDirectory`. */
const resolveCssFile = (
  href: string,
  distDirectory: string,
  cssFiles: string[],
): string | undefined => {
  const pathname = href.split(/[?#]/)[0];
  return cssFiles.find(file => {
    const relative = path
      .relative(distDirectory, file)
      .split(path.sep)
      .join('/');
    return pathname.endsWith(`/${relative}`) || pathname === relative;
  });
};

const collectCssSources = (
  html: string,
  distDirectory: string,
  cssDir: string,
  includeAsyncCss: boolean,
): CssSource[] => {
  const cssFiles = listCssFiles(cssDir);
  const sources: CssSource[] = [];
  const used = new Set<string>();
  for (const href of getHeadStylesheets(html)) {
    const file = resolveCssFile(href, distDirectory, cssFiles);
    if (file) {
      used.add(file);
      sources.push({ url: href, css: fs.readFileSync(file, 'utf-8') });
    }
  }
  if (includeAsyncCss && sources.length > 0) {
    // Async chunks share the public path of the first initial stylesheet.
    const first = sources[0].url;
    const firstFile = [...used][0];
    const prefix = first.slice(
      0,
      first.length -
        path.relative(distDirectory, firstFile).split(path.sep).join('/')
          .length,
    );
    for (const file of cssFiles) {
      if (!used.has(file)) {
        const relative = path
          .relative(distDirectory, file)
          .split(path.sep)
          .join('/');
        sources.push({
          url: `${prefix}${relative}`,
          css: fs.readFileSync(file, 'utf-8'),
          async: true,
        });
      }
    }
  }
  return sources;
};

export const appShellPlugin = (
  options: AppShellPluginOptions,
): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-app-shell',

  setup: api => {
    api.onAfterBuild(async () => {
      const entries = Object.entries(options.entries || {});
      if (entries.length === 0) {
        return;
      }
      const config = api.getNormalizedConfig();
      const { appDirectory, distDirectory } = api.getAppContext();
      const mountId = config.html?.mountId || 'root';
      const cssDir = path.join(
        distDirectory,
        config.output?.distPath?.css || 'static/css',
      );
      const routesFile = path.join(distDirectory, 'route.json');
      const routes: RouteSpec[] = fs.existsSync(routesFile)
        ? (JSON.parse(fs.readFileSync(routesFile, 'utf-8')).routes ?? [])
        : [];

      const startedAt = Date.now();
      const alias = config.resolve?.alias;
      const shells = await renderShells({
        appDirectory,
        workDirectory: path.join(
          appDirectory,
          'node_modules',
          '.modern-js',
          'app-shell',
        ),
        components: Object.fromEntries(
          entries.map(([name, entry]) => [name, entry.component]),
        ),
        alias:
          alias && typeof alias === 'object' && !Array.isArray(alias)
            ? (alias as Record<string, string | string[]>)
            : undefined,
      });

      for (const [entryName, entryOptions] of entries) {
        const htmlFiles = new Set(
          routes
            .filter(route => route.entryName === entryName && route.entryPath)
            .map(route => path.join(distDirectory, route.entryPath as string))
            .filter(file => file.endsWith('.html')),
        );
        if (htmlFiles.size === 0) {
          logger.warn(
            `[app-shell] no HTML output found for entry "${entryName}", skipped`,
          );
          continue;
        }
        const runtimeConfig = toRuntimeConfig(entryOptions, mountId);
        for (const file of htmlFiles) {
          const html = fs.readFileSync(file, 'utf-8');
          let criticalCss = '';
          if (entryOptions.criticalCss !== false) {
            const sources = collectCssSources(
              html,
              distDirectory,
              cssDir,
              entryOptions.criticalCss?.includeAsyncCss ?? true,
            );
            criticalCss = await extractCriticalCss({
              shellHtml: `<div id="${SHELL_ELEMENT_ID}">${shells[entryName]}</div>`,
              htmlAttributes: getHtmlAttributes(html),
              sources,
              allowRules:
                entryOptions.criticalCss?.allowRules ?? DEFAULT_ALLOW_RULES,
            });
          }
          fs.writeFileSync(
            file,
            injectAppShell(html, {
              config: runtimeConfig,
              shellHtml: shells[entryName],
              criticalCss,
            }),
          );
          logger.info(
            `[app-shell] ${entryName}: ${(shells[entryName].length / 1024).toFixed(1)} kB markup, ${(criticalCss.length / 1024).toFixed(1)} kB critical CSS -> ${path.relative(distDirectory, file)}`,
          );
        }
      }
      logger.info(`[app-shell] done in ${Date.now() - startedAt} ms`);
    });
  },
});

export default appShellPlugin;
