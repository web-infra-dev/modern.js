// Todo: This import will introduce router code, like remix, even if router config is false
import { matchRoutes } from '@modern-js/runtime-utils/router';
import ReactHelmet, { type HelmetData } from 'react-helmet';
import type { TInternalRuntimeContext } from '../../context';
import { CHUNK_CSS_PLACEHOLDER } from '../constants';
import { createReplaceHelemt } from '../helmet';
import type { HandleRequestConfig } from '../requestHandler';
import { type BuildHtmlCb, type SSRConfig, buildHtml } from '../shared';
import {
  attributesToString,
  checkIsNode,
  getLoadedScriptUrls,
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
  ssrConfig?: SSRConfig;
  styledComponentsStyleTags?: string;
}

type RouteAssetsItem = {
  assets?: string[];
  ownAssets?: string[];
  referenceCssAssets?: string[];
};

/**
 * The `crossorigin` attribute of a preload must match the one the bundler
 * runtime puts on the chunk `<script>`, otherwise the browser cannot reuse the
 * preloaded response and downloads the chunk again. The runtime follows
 * `output.crossOriginLoading` (set from `html.crossorigin`): `use-credentials`
 * is always applied, other values only for chunks served from another origin.
 * An absolute chunk URL means `output.assetPrefix` points to another origin,
 * the same rule Rsbuild uses for its own preload tags.
 */
const getPreloadCrossOrigin = (
  href: string,
  crossorigin: HandleRequestConfig['crossorigin'],
) => {
  if (!crossorigin) {
    return undefined;
  }
  const value = crossorigin === true ? 'anonymous' : crossorigin;
  if (value === 'use-credentials') {
    return value;
  }
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(href) ? value : undefined;
};

export async function buildShellBeforeTemplate(
  beforeAppTemplate: string,
  options: BuildShellBeforeTemplateOptions,
) {
  const {
    config,
    ssrConfig,
    runtimeContext,
    styledComponentsStyleTags,
    entryName,
  } = options;

  const helmetData: HelmetData = ReactHelmet.renderStatic();

  const callbacks: BuildHtmlCb[] = [
    createReplaceHelemt(helmetData),
    template =>
      injectRouteAssets(template, entryName, styledComponentsStyleTags),
  ];

  return buildHtml(beforeAppTemplate, callbacks);

  async function injectRouteAssets(
    template: string,
    entryName: string,
    styledComponentsStyleTags?: string,
  ) {
    const matchedRouteManifests = getMatchedRouteManifests();
    let css = await getCssChunks(matchedRouteManifests);
    if (styledComponentsStyleTags) {
      css += styledComponentsStyleTags;
    }
    const scriptPreloads = getScriptPreloads(matchedRouteManifests);
    return safeReplace(
      template,
      CHUNK_CSS_PLACEHOLDER,
      `${css}${scriptPreloads}`,
    );

    function getMatchedRouteManifests(): RouteAssetsItem[] | undefined {
      const { routeManifest, routerContext, routes } = runtimeContext;
      if (!routeManifest || !routerContext || !routes) {
        return undefined;
      }

      const { routeAssets } = routeManifest;

      const matches = matchRoutes(
        routes,
        routerContext.location,
        routerContext.basename,
      );
      return matches
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
        .filter((item): item is RouteAssetsItem => Boolean(item));
    }

    async function getCssChunks(matchedRouteManifests?: RouteAssetsItem[]) {
      if (!matchedRouteManifests) {
        return '';
      }

      const { routeAssets } = runtimeContext.routeManifest!;
      const cssRouteManifests = [...matchedRouteManifests];
      const asyncEntry = routeAssets[`async-${entryName}`];
      if (asyncEntry) {
        cssRouteManifests.push(asyncEntry);
      }

      const cssChunks: string[] = cssRouteManifests.reduce(
        (chunks, routeManifest) => {
          const { referenceCssAssets = [] } = routeManifest;
          const _cssChunks = referenceCssAssets.filter(
            (asset?: string) =>
              asset?.endsWith('.css') && !hasStylesheetLink(template, asset),
          );
          return [...chunks, ..._cssChunks];
        },
        [] as string[],
      );

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

    /**
     * Preload the JS of the matched routes, so the browser downloads the route
     * components in parallel with the entry instead of after the entry runs and
     * React reaches the lazy route component. Only the matched routes are
     * preloaded, not the lazy chunks they import.
     *
     * The route module itself (`ownAssets`) is preloaded at the default
     * priority. The chunks split out of its dependencies can be many and large,
     * so they are preloaded with `fetchpriority="low"` to keep them from
     * competing with the entry scripts and stylesheets.
     */
    function getScriptPreloads(matchedRouteManifests?: RouteAssetsItem[]) {
      if (!matchedRouteManifests?.length) {
        return '';
      }
      if (
        typeof ssrConfig === 'object' &&
        ssrConfig.preloadRouteScripts === false
      ) {
        return '';
      }

      const { routeAssets } = runtimeContext.routeManifest!;
      // The entry assets (merged with `async-${entryName}` when async entry is
      // enabled) are already loaded by the `<script>` tags of the entry.
      const excluded = new Set<string>([
        ...(routeAssets[entryName]?.assets ?? []),
        ...(routeAssets[`async-${entryName}`]?.assets ?? []),
        ...getLoadedScriptUrls(template),
      ]);

      const preloads: string[] = [];
      for (const { assets = [], ownAssets } of matchedRouteManifests) {
        // Manifests built before `ownAssets` existed keep the old behavior.
        const own = new Set(ownAssets ?? assets);
        for (const asset of assets) {
          if (!asset.endsWith('.js') || excluded.has(asset)) {
            continue;
          }
          excluded.add(asset);
          const attributes = attributesToString({
            nonce: config.nonce,
            crossorigin: getPreloadCrossOrigin(asset, config.crossorigin),
            fetchpriority: own.has(asset) ? undefined : 'low',
          });
          preloads.push(
            `<link rel="preload" as="script" href="${asset}"${attributes} />`,
          );
        }
      }
      return preloads.join('');
    }
  }
}
