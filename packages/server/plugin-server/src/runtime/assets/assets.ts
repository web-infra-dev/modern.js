import { matchRoutes } from '@modern-js/runtime-utils/remix-router';
import { matchEntry } from '@modern-js/runtime-utils/node';

const createScript = (href: string, nonce?: string) =>
  `<script defer src="${href}"${nonce ? ` nonce="${nonce}"` : ''}></script>`;

const createCss = (href: string) =>
  `<link rel="stylesheet" type="text/css" href="${href}">`;

export const getAssets = (
  html: string,
  nestedRoutes: Record<string, any>,
  routesJson: Record<string, any>,
  routesManifest: Record<string, any>,
  pathname: string,
) => {
  const serverRoutes = routesJson.routes;
  const entry = matchEntry(pathname, serverRoutes);

  if (!entry) {
    return {};
  }

  const { entryName } = entry;
  if (!entryName) {
    return {};
  }

  const entryRoutes = nestedRoutes[entryName];
  if (!entryRoutes) {
    return {};
  }

  const { routeAssets } = routesManifest;
  const matches = matchRoutes(entryRoutes, pathname, entry.urlPath);

  const assets = matches?.reduce((acc, match) => {
    const routeId = match.route.id;
    if (routeId) {
      const matchedManifest = routeAssets[routeId];
      const assets = matchedManifest?.assets;
      if (Array.isArray(assets)) {
        acc.push(...assets);
      }
    }
    return acc;
  }, [] as string[]);

  const asyncEntry = routeAssets?.[`async-${entryName}`];
  if (asyncEntry) {
    const asyncAssets = asyncEntry.assets;
    if (Array.isArray(asyncAssets)) {
      assets?.push(...asyncAssets);
    }
  }

  const cssAssets = assets
    ?.filter(asset => asset.endsWith('.css'))
    .filter(asset => !html.includes(asset));

  const jsAssets = assets
    ?.filter(asset => asset.endsWith('.js'))
    .filter(asset => !asset.includes('hot-update'))
    .filter(asset => !html.includes(asset));

  return {
    cssAssets,
    jsAssets,
  };
};

export const getAssetsTags = (
  html: string,
  nestedRoutes: Record<string, any>,
  routesJson: Record<string, any>,
  routesManifest: Record<string, any>,
  pathname: string,
  nonce?: string,
) => {
  const { cssAssets, jsAssets } = getAssets(
    html,
    nestedRoutes,
    routesJson,
    routesManifest,
    pathname,
  );

  const cssLinks = cssAssets?.map(createCss);
  const scripts = jsAssets?.map(asset => createScript(asset, nonce));

  return {
    cssLinks,
    scripts,
  };
};

export const injectAssetsTags = (
  html: string,
  cssLinks?: string[],
  scripts?: string[],
): string => {
  let injectedHtml = html;

  if (cssLinks && cssLinks.length > 0) {
    injectedHtml = injectedHtml.replace(
      '</head>',
      `${cssLinks.join('\n')}</head>`,
    );
  }

  if (scripts && scripts.length > 0) {
    injectedHtml = injectedHtml.replace(
      `</body>`,
      `${scripts.join('\n')}</body>`,
    );
  }

  return injectedHtml;
};
