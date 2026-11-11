// Todo: This import will introduce router code, like remix, even if router config is false
import { matchRoutes } from '@modern-js/runtime-utils/router';
import { Fragment, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactHelmet, {
  type HelmetData,
  type HelmetProps,
} from 'react-helmet';
import type { TInternalRuntimeContext } from '../../context';
import { CHUNK_CSS_PLACEHOLDER } from '../constants';
import { createReplaceHelemt } from '../helmet';
import type { HandleRequestConfig } from '../requestHandler';
import { type BuildHtmlCb, buildHtml } from '../shared';
import {
  checkIsNode,
  hasStylesheetLink,
  readAssetWithCache,
  safeReplace,
} from '../utils';

const readAsset = async (chunk: string) => {
  // working node env
  const path = await import('path');

  // only working in 'production' env
  // we need ensure the assetsDir is same as ssr bundles.
  const filepath = path.join(__dirname, chunk);

  return readAssetWithCache(filepath);
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
  runtimeContext: TInternalRuntimeContext;
  entryName: string;
  config: HandleRequestConfig;
  styledComponentsStyleTags?: string;
  /**
   * The props of the `Helmet` rendered by this request. When it is not
   * empty, the head is built from it instead of the module level state of
   * react-helmet, which is shared by all requests. `Helmet` imported from
   * react-helmet directly is not recorded and keeps using that state.
   */
  helmetProps?: HelmetProps[];
}

/**
 * Mount the recorded props and read the result in one synchronous pass, so no
 * other request can mount react-helmet in between.
 */
function renderHelmetData(helmetProps: HelmetProps[]): HelmetData {
  // Drop what earlier renders left in the module level state.
  ReactHelmet.renderStatic();
  renderToStaticMarkup(
    createElement(
      Fragment,
      null,
      ...helmetProps.map((props, index) =>
        createElement(ReactHelmet, { ...props, key: index }),
      ),
    ),
  );
  return ReactHelmet.renderStatic();
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
    helmetProps,
  } = options;

  const helmetData: HelmetData = helmetProps?.length
    ? renderHelmetData(helmetProps)
    : ReactHelmet.renderStatic();

  const callbacks: BuildHtmlCb[] = [
    createReplaceHelemt(helmetData),
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
                asset?.endsWith('.css') && !hasStylesheetLink(template, asset),
            );
            return [...chunks, ..._cssChunks];
          }, [] as string[])
        : [];

      const { inlineStyles } = config;

      const styles = await Promise.all(
        cssChunks.map(async chunk => {
          const link = `<link href="${chunk}" rel="stylesheet" />`;
          if (checkIsNode() && checkIsInline(chunk, inlineStyles)) {
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
