// Todo: This import will introduce router code, like remix, even if router config is false
import { matchRoutes } from '@modern-js/runtime-utils/router';
import type { HelmetServerState } from 'react-helmet-async';
import type { RuntimeContext } from '../../context';
import { CHUNK_CSS_PLACEHOLDER } from '../constants';
import { createReplaceHelemt } from '../helmet';
import type { HandleRequestConfig } from '../requestHandler';
import { type BuildHtmlCb, buildHtml } from '../shared';
import { checkIsNode, safeReplace } from '../utils';

const readAsset = async (chunk: string) => {
  // working node env
  const fs = await import('fs/promises');
  const path = await import('path');

  // only working in 'production' env
  // we need ensure the assetsDir is same as ssr bundles.
  const filepath = path.join(__dirname, chunk);

  return fs.readFile(filepath, 'utf-8');
};

const checkIsInline = (
  chunk: string,
  enableInline: boolean | RegExp | undefined,
) => {
  // only production apply the inline config
  if (process.env.NODE_ENV === 'production') {
    if (enableInline instanceof RegExp) {
      return enableInline.test(chunk);
    } else {
      return Boolean(enableInline);
    }
  } else {
    return false;
  }
};

export interface BuildShellBeforeTemplateOptions {
  runtimeContext: RuntimeContext;
  entryName: string;
  config: HandleRequestConfig;
  styledComponentsStyleTags?: string;
  helmetContext?: Record<string, unknown>;
}

export async function buildShellBeforeTemplate(
  beforeAppTemplate: string,
  options: BuildShellBeforeTemplateOptions,
) {
  const {
    config,
    runtimeContext,
    styledComponentsStyleTags,
    entryName,
    helmetContext,
  } = options;

  // Get helmet data from request-level context
  const helmetServerState = helmetContext
    ? ((helmetContext as { helmet?: HelmetServerState })
        .helmet as HelmetServerState)
    : undefined;

  const callbacks: BuildHtmlCb[] = [
    createReplaceHelemt(helmetServerState),
    // @TODO: prefetch scripts of lazy component
    template => injectCss(template, entryName, styledComponentsStyleTags),
  ];

  return buildHtml(beforeAppTemplate, callbacks);

  async function injectCss(
    template: string,
    entryName: string,
    styledComponentsStyleTags?: string,
  ) {
    let css = await getCssChunks();
    if (styledComponentsStyleTags) {
      css += styledComponentsStyleTags;
    }
    return safeReplace(template, CHUNK_CSS_PLACEHOLDER, css);

    async function getCssChunks() {
      const { routeManifest, routerContext, routes } = runtimeContext;
      if (!routeManifest || !routerContext || !routes) {
        return '';
      }

      const { routeAssets } = routeManifest;

      const matches = matchRoutes(
        routes,
        routerContext.location,
        routerContext.basename,
      );
      const matchedRouteManifests = matches
        ?.map((match, index) => {
          if (!index) {
            return;
          }

          const routeId = match.route.id;
          if (routeId) {
            const routeManifest = routeAssets[routeId];
            return routeManifest;
          }
        })
        .filter(Boolean);
      const asyncEntry = routeAssets[`async-${entryName}`];
      if (asyncEntry) {
        matchedRouteManifests?.push(asyncEntry);
      }

      const cssChunks: string[] = matchedRouteManifests
        ? matchedRouteManifests?.reduce((chunks, routeManifest) => {
            const { referenceCssAssets = [] } = routeManifest as {
              referenceCssAssets?: string[];
            };
            const _cssChunks = referenceCssAssets.filter(
              (asset?: string) =>
                asset?.endsWith('.css') && !template.includes(asset),
            );
            return [...chunks, ..._cssChunks];
          }, [] as string[])
        : [];

      const { enableInlineStyles } = config;

      const styles = await Promise.all(
        cssChunks.map(async chunk => {
          const link = `<link href="${chunk}" rel="stylesheet" />`;
          if (checkIsNode() && checkIsInline(chunk, enableInlineStyles)) {
            return readAsset(chunk)
              .then(content => `<style>${content}</style>`)
              .catch(_ => {
                // if read file occur error, we should return link to import css assets.
                return link;
              });
          } else {
            return link;
          }
        }),
      );

      return `${styles.join('')}`;
    }
  }
}
