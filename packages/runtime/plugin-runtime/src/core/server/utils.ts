import {
  StaticHandlerContext,
  isRouteErrorResponse,
} from '@modern-js/runtime-utils/remix-router';

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

export function parseQuery(url: URL) {
  const q: Record<string, string> = {};

  url.searchParams.forEach((v, k) => {
    q[k] = v;
  });

  return q;
}

export function getHeadersData(headers: Headers) {
  const headersData: Record<string, string | undefined> = {};
  headers.forEach((value, key) => {
    headersData[key] = value;
  });
  return headersData;
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
