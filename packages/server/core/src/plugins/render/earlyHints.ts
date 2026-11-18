import {
  type ResourcePreloadPlan,
  selectMatchedResourcePreloads,
} from '@modern-js/utils/universal';
import type { SSRRenderOptions } from './ssrRender';

type ResourceStagesManifest = ResourcePreloadPlan & {
  version: 1;
  earlyHints?: {
    entries: string[];
    crossOriginLoading?: false | 'anonymous' | 'use-credentials';
  };
};

const MAX_LINK_HEADER_LENGTH = 4 * 1024;

export const getEarlyHintLinks = (
  request: Request,
  {
    routeInfo,
    serverManifest,
    config,
  }: Pick<SSRRenderOptions, 'routeInfo' | 'serverManifest' | 'config'>,
) => {
  const stages = serverManifest.routeManifest?.resourceStages as
    ResourceStagesManifest | undefined;
  const entryName = routeInfo.entryName;
  const hints = stages?.earlyHints;
  if (
    stages?.version !== 1 ||
    !hints ||
    !entryName ||
    !Array.isArray(hints.entries) ||
    !hints.entries.includes(entryName)
  ) {
    return [];
  }

  const routeIds: string[] = [];
  const routes = serverManifest.nestedRoutesJson?.[entryName];
  if (routes) {
    const { matchRoutes } = require('@modern-js/runtime-utils/router');
    const matches = matchRoutes(
      routes,
      new URL(request.url).pathname,
      routeInfo.urlPath,
    );
    for (const { route } of matches ?? []) {
      if (route.id) {
        routeIds.push(route.id);
      }
    }
  }
  const ssr = config.server?.ssrByEntries?.[entryName] ?? config.server?.ssr;
  const mode =
    typeof ssr === 'object' && ssr.mode === 'string' ? 'string' : 'stream';
  const routeAssets = serverManifest.routeManifest?.routeAssets;
  const loaded = new Set<string>([
    ...(routeAssets?.[entryName]?.assets ?? []),
    ...(routeAssets?.[`async-${entryName}`]?.assets ?? []),
  ]);
  const { entry, preloads } = selectMatchedResourcePreloads(
    stages,
    entryName,
    routeIds,
    mode,
    loaded,
  );

  const links: string[] = [];
  const seen = new Set<string>();
  let headerLength = 0;
  for (const { h, a, l, i } of [...entry, ...preloads]) {
    // Keep preloads that require an integrity hash in the HTML.
    // Only use URLs that can safely be put in an HTTP Link header.
    if (i || seen.has(h) || !/^[\x21-\x7e]+$/.test(h) || /[<>]/.test(h)) {
      continue;
    }
    const crossorigin = hints.crossOriginLoading;
    let link = `<${h}>; rel=preload; as=${a}`;
    if (
      crossorigin &&
      (crossorigin === 'use-credentials' || /^(?:https?:)?\/\//i.test(h))
    ) {
      link += `; crossorigin=${crossorigin}`;
    }
    if (l) {
      link += '; fetchpriority=low';
    }
    if (headerLength + link.length + 2 <= MAX_LINK_HEADER_LENGTH) {
      links.push(link);
      seen.add(h);
      headerLength += link.length + 2;
    }
  }
  return links;
};
