import type { ServerUserConfig } from '@modern-js/app-tools';
import {
  type StaticHandlerContext,
  isRouteErrorResponse,
} from '@modern-js/runtime-utils/router';
import type { SSRConfig } from './shared';

export function attributesToString(attributes: Record<string, any>) {
  // Iterate through the properties and convert them into a string, only including properties that are not undefined.
  return Object.entries(attributes).reduce((str, [key, value]) => {
    return value === undefined ? str : `${str} ${key}="${value}"`;
  }, '');
}

/**
 * @param source
 * @param searchValue
 * @param replaceValue
 * @returns
 */
export function safeReplace(
  source: string,
  searchValue: string | RegExp,
  replaceValue: string,
) {
  return source.replace(searchValue, () => replaceValue);
}

export function checkIsNode(): boolean {
  return typeof process !== 'undefined' && process.release?.name === 'node';
}

// Holds each inlined build output once, so its size is bounded by the build.
const assetCache = new Map<string, Promise<string>>();

/**
 * Read a build output file (e.g. an inlined css / js chunk) by its absolute path.
 * Inlining only applies in production, where build outputs don't change at
 * runtime, so the content is cached. Failed reads are not cached.
 */
export function readAssetWithCache(filepath: string): Promise<string> {
  const cached = assetCache.get(filepath);
  if (cached) {
    return cached;
  }

  const content = import('fs/promises').then(fs =>
    fs.readFile(filepath, 'utf-8'),
  );
  assetCache.set(filepath, content);
  // Only drops the failed entry, callers still receive the rejection.
  content.catch(() => {
    if (assetCache.get(filepath) === content) {
      assetCache.delete(filepath);
    }
  });
  return content;
}

/**
 * forked from https://github.com/remix-run/remix/blob/main/packages/remix-server-runtime/errors.ts
 * license at https://github.com/remix-run/remix/blob/main/LICENSE.md
 */
export function serializeErrors(
  errors: StaticHandlerContext['errors'],
): StaticHandlerContext['errors'] {
  if (!errors) {
    return null;
  }
  const entries = Object.entries(errors);
  const serialized: StaticHandlerContext['errors'] = {};
  for (const [key, val] of entries) {
    // Hey you!  If you change this, please change the corresponding logic in
    // deserializeErrors
    if (isRouteErrorResponse(val)) {
      serialized[key] = { ...val, __type: 'RouteErrorResponse' };
    } else if (val instanceof Error) {
      serialized[key] = {
        message: val.message,
        stack: val.stack,
        __type: 'Error',
      };
    } else {
      serialized[key] = val;
    }
  }
  return serialized;
}

export function getSSRConfigByEntry(
  entryName: string,
  ssr?: ServerUserConfig['ssr'],
  ssrByEntries?: ServerUserConfig['ssrByEntries'],
) {
  if (ssrByEntries?.[entryName]) {
    return ssrByEntries[entryName];
  }

  return ssr || true;
}

export function getSSRMode(ssrConfig?: SSRConfig): 'string' | 'stream' | false {
  if (typeof ssrConfig === 'boolean') {
    const result = ssrConfig ? 'stream' : false;
    return result;
  }

  const result = ssrConfig?.mode === 'string' ? 'string' : 'stream';
  return result;
}

const getTagAttributes = (tag: string) => {
  const attributes = new Map<string, string>();
  const attributeRegExp =
    /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  // Skip the tag name itself, e.g. `<link` or `<script`.
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

/**
 * Whether the template already contains a `<link rel="stylesheet">` for `href`.
 * Other link rels (e.g. `<link rel="prefetch">` emitted by `performance.prefetch`,
 * or `<link rel="preload" as="style">`) may reference the same css URL but do not
 * apply styles, so they must not block stylesheet injection during SSR.
 */
export const hasStylesheetLink = (template: string, href: string) => {
  const linkTags = template.match(/<link\b[^>]*>/gi) ?? [];
  return linkTags.some(linkTag => {
    const attributes = getTagAttributes(linkTag);
    const linkHref = attributes.get('href');
    const rel = attributes.get('rel');

    return (
      linkHref === href &&
      rel
        ?.split(/\s+/)
        .some(relToken => relToken.toLowerCase() === 'stylesheet')
    );
  });
};

const hasRelToken = (rel: string | undefined, token: string) =>
  rel?.split(/\s+/).some(relToken => relToken.toLowerCase() === token) ?? false;

/**
 * Collect the script URLs the template already loads or preloads:
 * `<script src>`, `<link rel="preload" as="script">` and `<link rel="modulepreload">`.
 * `<link rel="prefetch">` is a low priority hint for later navigations, so it
 * does not count.
 */
export const getLoadedScriptUrls = (template: string) => {
  const urls = new Set<string>();
  for (const scriptTag of template.match(/<script\b[^>]*>/gi) ?? []) {
    const src = getTagAttributes(scriptTag).get('src');
    if (src) {
      urls.add(src);
    }
  }
  for (const linkTag of template.match(/<link\b[^>]*>/gi) ?? []) {
    const attributes = getTagAttributes(linkTag);
    const href = attributes.get('href');
    const rel = attributes.get('rel');
    if (
      href &&
      (hasRelToken(rel, 'modulepreload') ||
        (hasRelToken(rel, 'preload') &&
          attributes.get('as')?.toLowerCase() === 'script'))
    ) {
      urls.add(href);
    }
  }
  return urls;
};
