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
  if (!isProduction() || url.startsWith('http')) {
    return url.replace(/index$/, '');
  }
  return addLeadingSlash(url);
}

export { addLeadingSlash, removeTrailingSlash, normalizeSlash, isProduction };
