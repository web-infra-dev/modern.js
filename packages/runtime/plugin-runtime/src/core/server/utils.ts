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

const getLinkAttributes = (linkTag: string) => {
  const attributes = new Map<string, string>();
  const attributeRegExp =
    /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attributeRegExp.exec(linkTag))) {
    const [, name, doubleQuotedValue, singleQuotedValue, unquotedValue] = match;
    if (name.toLowerCase() === 'link') {
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
    const attributes = getLinkAttributes(linkTag);
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
