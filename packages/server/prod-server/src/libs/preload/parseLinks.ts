import path from 'path';
import {
  NESTED_ROUTE_SPEC_FILE,
  ROUTE_MANIFEST_FILE,
  ROUTE_SPEC_FILE,
  fs,
} from '@modern-js/utils';
import { parse as htmlParse } from 'node-html-parser';
import { matchRoutes } from '@modern-js/runtime-utils/remix-router';
import { matchEntry } from '@modern-js/runtime-utils/node';

export interface Link {
  uri: string;

  rel?: string;

  as?: 'script' | 'style' | 'image' | 'video' | 'font' | string;

  /** rest str(like attributes) that need add to link */
  rest?: string;
}

export interface ParseLinksOptions {
  distDir: string;
  pathname: string;
  template: string;
}

export async function parseLinks({
  pathname,
  distDir,
  template,
}: ParseLinksOptions): Promise<Link[]> {
  // try parse links from nestRoutes
  // if we can't parse links from routes, we parse links from html.
  const links = await parseLinksFromRoutes(pathname, distDir);

  // User may add links by html-webpack-plugin, Document, eg.
  // So we need also parse links from html
  return links.concat(parseLinksFromHtml(template));
}

function parseLinksFromHtml(html: string): Link[] {
  const root = htmlParse(html);

  const scripts = root
    .querySelectorAll('script')
    .filter(elem => Boolean(elem.getAttribute('src')));
  const css = root.querySelectorAll('link').filter(elem => {
    const href = elem.getAttribute('href');
    const rel = elem.getAttribute('rel');
    return href && rel === 'stylesheet';
  });
  const images = root
    .querySelectorAll('img')
    .filter(elem => Boolean(elem.getAttribute('src')));

  return scripts
    .map(elem => {
      const src = elem.getAttribute('src')!;
      return {
        uri: src,
        as: 'script',
      };
    })
    .concat(
      css.map(elem => {
        const href = elem.getAttribute('href')!;

        return {
          uri: href,
          as: 'style',
        };
      }),
    )
    .concat(
      images.map(elem => {
        const src = elem.getAttribute('src')!;

        return {
          uri: src,
          as: 'image',
        };
      }),
    );
}

async function parseLinksFromRoutes(
  pathname: string,
  distDir: string,
): Promise<Link[]> {
  const noopLinks: Link[] = [];
  const nestedRoutesSpec = path.join(distDir, NESTED_ROUTE_SPEC_FILE);
  const routesJsonPath = path.join(distDir, ROUTE_SPEC_FILE);
  const routeManifestPath = path.join(distDir, ROUTE_MANIFEST_FILE);
  if (
    !fs.existsSync(nestedRoutesSpec) ||
    !fs.existsSync(routesJsonPath) ||
    !fs.existsSync(routeManifestPath)
  ) {
    return noopLinks;
  }
  const routesJson = await import(routesJsonPath);
  const serverRoutes = routesJson.routes;
  const entry = matchEntry(pathname, serverRoutes);
  if (entry) {
    const routes = await import(nestedRoutesSpec);
    const { entryName } = entry;

    if (!entryName) {
      return noopLinks;
    }

    const entryRoutes = routes[entryName];

    if (!entryRoutes) {
      return noopLinks;
    }

    const routesManifest = await import(routeManifestPath);

    const { routeAssets } = routesManifest;

    const matches = matchRoutes(entryRoutes, pathname, entry.urlPath);

    const entryAssets = routeAssets[entryName]?.assets;
    const assets = matches
      ?.reduce((acc, match) => {
        const routeId = match.route.id;
        if (routeId) {
          const matchedManifest = routeAssets[routeId];
          const assets = matchedManifest?.assets;
          if (Array.isArray(assets)) {
            acc.push(...assets);
          }
        }
        return acc;
      }, [] as string[])
      .concat(entryAssets || []);

    const cssLinks = assets
      ?.filter(asset => asset.endsWith('.css'))
      ?.map(uri => ({
        uri,
        as: 'style',
      }));

    const scriptLinks = assets
      ?.filter(asset => asset.endsWith('.js'))
      ?.map(uri => ({
        uri,
        as: 'script',
      }));

    return (cssLinks || []).concat(scriptLinks || []);
  }
  return noopLinks;
}
