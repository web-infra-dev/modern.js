import {
  cleanUrl,
  addLeadingSlash,
  removeTrailingSlash,
  normalizeSlash,
  isProduction,
} from '../shared/utils';

export const getRelativePagePath = (
  routePath: string,
  filePath: string,
  base: string,
) => {
  const extname = filePath.split('.').pop();
  let pagePath = cleanUrl(routePath);
  if (pagePath.startsWith(base)) {
    pagePath = pagePath.slice(base.length);
  }
  if (extname) {
    pagePath += `.${extname}`;
  }
  return pagePath.replace(/^\//, '');
};

export function normalizeHref(url?: string) {
  if (!url) {
    return '/';
  }
  let cleanUrl = url;
  if (!cleanUrl.endsWith('.html')) {
    if (cleanUrl.endsWith('/')) {
      cleanUrl += 'index.html';
    } else {
      cleanUrl += '.html';
    }
  }

  return addLeadingSlash(cleanUrl);
}

export function normalizeRoutePath(routePath: string) {
  return routePath.replace(/\.html$/, '').replace(/\/index$/, '/');
}

export { addLeadingSlash, removeTrailingSlash, normalizeSlash, isProduction };
