import type { ServerRoute } from '@modern-js/types';
import type { ServerManifest, UserConfig } from '../../types';

/** Writes a `103 Early Hints` response with the given `Link` header values. */
export type WriteEarlyHints = (links: string[]) => void;

type CrossOrigin = boolean | 'anonymous' | 'use-credentials' | undefined;

type RouteAssets = Record<
  string,
  { assets?: string[]; referenceCssAssets?: string[] } | undefined
>;

const getSSRConfig = (config: UserConfig, entryName?: string) => {
  const { ssr, ssrByEntries } = config.server || {};
  return (entryName && ssrByEntries?.[entryName]) ?? ssr;
};

export const isEarlyHintsEnabled = (config: UserConfig, entryName?: string) => {
  const ssrConfig = getSSRConfig(config, entryName);
  return typeof ssrConfig === 'object' && ssrConfig.earlyHints === true;
};

const getTagAttributes = (tag: string) => {
  const attributes = new Map<string, string>();
  const attributeRegExp =
    /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  const tagName = /^<\s*([^\s>/]+)/.exec(tag)?.[1]?.toLowerCase();
  let match: RegExpExecArray | null;
  while ((match = attributeRegExp.exec(tag))) {
    const [, name, doubleQuotedValue, singleQuotedValue, unquotedValue] = match;
    if (name.toLowerCase() === tagName) {
      continue;
    }
    attributes.set(
      name.toLowerCase(),
      doubleQuotedValue ?? singleQuotedValue ?? unquotedValue ?? '',
    );
  }
  return attributes;
};

const toLink = (href: string, as: 'script' | 'style', crossorigin?: string) => {
  let link = `<${href}>; rel=preload; as=${as}`;
  if (crossorigin !== undefined) {
    link +=
      crossorigin === 'use-credentials'
        ? '; crossorigin=use-credentials'
        : '; crossorigin';
  }
  return link;
};

const MAX_CACHED_TEMPLATES = 100;
const templateLinksCache = new Map<string, { href: string; link: string }[]>();

/**
 * The scripts and stylesheets the HTML template loads before any rendering,
 * with the same `crossorigin` mode as their tags, so the browser can reuse
 * the early-hinted responses.
 */
const getTemplateLinks = (html: string) => {
  const cached = templateLinksCache.get(html);
  if (cached) {
    return cached;
  }
  const links: { href: string; link: string }[] = [];
  for (const tag of html.match(/<script\b[^>]*>/gi) ?? []) {
    const attributes = getTagAttributes(tag);
    const src = attributes.get('src');
    if (src) {
      links.push({
        href: src,
        link: toLink(src, 'script', attributes.get('crossorigin')),
      });
    }
  }
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attributes = getTagAttributes(tag);
    const href = attributes.get('href');
    const rel = attributes.get('rel')?.toLowerCase().split(/\s+/) ?? [];
    if (href && rel.includes('stylesheet')) {
      links.push({
        href,
        link: toLink(href, 'style', attributes.get('crossorigin')),
      });
    }
  }
  if (templateLinksCache.size >= MAX_CACHED_TEMPLATES) {
    templateLinksCache.clear();
  }
  templateLinksCache.set(html, links);
  return links;
};

const normalizeCrossOrigin = (crossorigin: CrossOrigin) =>
  crossorigin === true ? 'anonymous' : crossorigin || undefined;

/**
 * The `crossorigin` mode the page uses to load a route chunk, so the browser
 * can reuse the early-hinted response:
 * - string SSR outputs `<script>` / `<link rel="stylesheet">` tags with
 *   `html.crossorigin` (`string/loadable.ts`);
 * - streaming SSR outputs `<link rel="stylesheet">` without `crossorigin`, and
 *   the JS is loaded by the bundler runtime, which follows
 *   `output.crossOriginLoading` (from `html.crossorigin`): `use-credentials`
 *   is always applied, other values only to chunks from another origin.
 */
const getChunkCrossOrigin = (
  href: string,
  as: 'script' | 'style',
  crossorigin: CrossOrigin,
  isStringSSR: boolean,
) => {
  const value = normalizeCrossOrigin(crossorigin);
  if (!value || isStringSSR) {
    return value;
  }
  if (as === 'style') {
    return undefined;
  }
  if (value === 'use-credentials') {
    return value;
  }
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(href) ? value : undefined;
};

/**
 * Assets of the nested routes matched by the URL. Only the route matching is
 * done here, no loader runs. The root route is skipped as in streaming SSR:
 * it is bundled into the entry.
 */
const getMatchedRouteAssets = (
  request: Request,
  routeInfo: ServerRoute,
  serverManifest: ServerManifest,
) => {
  const entryName = routeInfo.entryName;
  const routes = entryName && serverManifest.nestedRoutesJson?.[entryName];
  const routeAssets: RouteAssets | undefined =
    serverManifest.routeManifest?.routeAssets;
  if (!routes || !routeAssets) {
    return [];
  }
  const { matchRoutes } = require('@modern-js/runtime-utils/router');
  const matches: { route: { id?: string } }[] | null = matchRoutes(
    routes,
    new URL(request.url).pathname,
    routeInfo.urlPath,
  );
  return (matches ?? [])
    .slice(1)
    .map(match => match.route.id && routeAssets[match.route.id])
    .filter(<T>(item: T | undefined | '' | 0): item is T => Boolean(item));
};

/**
 * `Link` header values for `103 Early Hints`: the scripts and stylesheets of
 * the HTML template, plus the JS and CSS of the matched nested routes.
 */
export const getEarlyHintLinks = ({
  request,
  html,
  routeInfo,
  serverManifest,
  config,
}: {
  request: Request;
  html: string;
  routeInfo: ServerRoute;
  serverManifest: ServerManifest;
  config: UserConfig;
}) => {
  const hrefs = new Set<string>();
  const links: string[] = [];
  for (const { href, link } of getTemplateLinks(html)) {
    if (!hrefs.has(href)) {
      hrefs.add(href);
      links.push(link);
    }
  }

  const crossorigin = config.html?.crossorigin;
  const inlineStyles = Boolean(config.output?.inlineStyles);
  const ssrConfig = getSSRConfig(config, routeInfo.entryName);
  const isStringSSR =
    typeof ssrConfig === 'object' && ssrConfig.mode === 'string';
  for (const { assets = [], referenceCssAssets = [] } of getMatchedRouteAssets(
    request,
    routeInfo,
    serverManifest,
  )) {
    for (const asset of assets) {
      if (asset.endsWith('.js') && !hrefs.has(asset)) {
        hrefs.add(asset);
        links.push(
          toLink(
            asset,
            'script',
            getChunkCrossOrigin(asset, 'script', crossorigin, isStringSSR),
          ),
        );
      }
    }
    if (inlineStyles) {
      continue;
    }
    for (const asset of referenceCssAssets) {
      if (asset.endsWith('.css') && !hrefs.has(asset)) {
        hrefs.add(asset);
        links.push(
          toLink(
            asset,
            'style',
            getChunkCrossOrigin(asset, 'style', crossorigin, isStringSSR),
          ),
        );
      }
    }
  }
  return links;
};
