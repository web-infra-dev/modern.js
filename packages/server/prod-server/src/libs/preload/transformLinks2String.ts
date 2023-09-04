import { SSRPreload } from '@modern-js/server-core';
import { Link } from './parseLinks';
import { transformToRegExp } from './flushServerHeader';

export function transformLinks2String(
  links: Link[],
  preload: SSRPreload | boolean,
): string {
  if (typeof preload === 'boolean') {
    return transformLinkToString(dedup(links));
  }
  const { include, exclude, attributes } = preload;

  const resolveLinks = transformLinkToString(
    addAttributes(
      dedup(removeExclude(addInclude(links, include), exclude)),
      attributes,
    ),
  );

  return resolveLinks;
}

function addInclude(links: Link[], include?: SSRPreload['include']) {
  const images = [
    'gif',
    'jpg',
    'jpeg',
    'png',
    'webp',
    'bmp',
    'tiff',
    'anpg',
    'ico',
  ];
  const videos = ['mp4', 'webm', 'ogm', 'ogv', 'ogg'];
  const fonts = ['woff', 'woff2', 'eot', 'ttf', 'otf'];
  const includes =
    include?.map(item => {
      if (typeof item === 'string') {
        // eslint-disable-next-line consistent-return
        const type = (() => {
          if (item.endsWith('.js')) {
            return 'script';
          }

          if (item.endsWith('.css')) {
            return 'style';
          }

          if (images.some(image => item.endsWith(`.${image}`))) {
            return 'image';
          }

          if (videos.some(video => item.endsWith(`.${video}`))) {
            return 'video';
          }

          if (fonts.some(font => item.endsWith(`.${font}`))) {
            return 'font';
          }
        })();
        return { uri: item, as: type };
      }
      return { uri: item.url, as: item.type, rel: item.rel };
    }) || [];

  return links.concat(includes);
}

function removeExclude(links: Link[], exclude?: SSRPreload['exclude']) {
  return exclude
    ? links.filter(({ uri }) => !transformToRegExp(exclude).test(uri))
    : links;
}

function addAttributes(
  links: Link[],
  attributes?: SSRPreload['attributes'],
): Link[] {
  const parseAttributes = (_attributes?: Record<string, boolean | string>) => {
    return Object.entries(_attributes || {})
      .reduce((results, [key, value]) => {
        if (typeof value === 'boolean') {
          value && results.push(`; ${key}`);
          return results;
        }

        results.push(`; ${key}=${value}`);
        return results;
      }, [] as string[])
      .join('');
  };

  return links.map(link => {
    const { as } = link;
    if (as) {
      const attributesStr = (() => {
        const { style, script, image, font } = attributes || {};
        switch (as) {
          case 'script':
            return parseAttributes(script);
          case 'style':
            return parseAttributes(style);
          case 'image':
            return parseAttributes(image);
          case 'font':
            return parseAttributes(font);
          default:
            return '';
        }
      })();
      return {
        ...link,
        rest: attributesStr,
      };
    }
    return link;
  });
}

function dedup(links: Link[]) {
  const set = new Set<string>();
  return links.filter(({ uri }) => {
    if (set.has(uri)) {
      return false;
    }
    set.add(uri);
    return true;
  });
}

function transformLinkToString(links: Link[]): string {
  return links
    .map(({ uri, as, rel: originalRel, rest }) => {
      const rel = originalRel || 'preload';
      return as
        ? `<${uri}>; rel=${rel}; as=${as}${rest || ''}`
        : `<${uri}>; rel=${rel}${rest || ''}`;
    })
    .join(', ');
}
