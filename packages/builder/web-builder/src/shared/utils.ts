import type { SomeJSONSchema } from '@modern-js/utils/ajv/json-schema';
import { DEFAULT_DATA_URL_SIZE } from './constants';
import { URLSearchParams } from 'url';
import type Buffer from 'buffer';
import assert from 'assert';

export const JS_REGEX = /\.(js|mjs|cjs|jsx)$/;

export const TS_REGEX = /\.(ts|mts|cts|tsx)$/;

export const mergeRegex = (...regexes: (string | RegExp)[]): RegExp => {
  assert(
    regexes.length,
    'mergeRegex: regular expression array should not be empty.',
  );
  const sources = regexes.map(regex =>
    regex instanceof RegExp ? regex.source : regex,
  );

  return new RegExp(sources.join('|'));
};

export function pick<T, U extends keyof T>(obj: T, keys: ReadonlyArray<U>) {
  return keys.reduce((ret, key) => {
    if (obj[key] !== undefined) {
      ret[key] = obj[key];
    }
    return ret;
  }, {} as Pick<T, U>);
}

export async function isFileExists(file: string) {
  const { promises, constants } = await import('fs');
  return promises
    .access(file, constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

/** Preserving the details of schema by generic types. */
export const defineSchema = <T extends SomeJSONSchema>(schema: T): T => schema;

export function getRegExpForExts(extensions: string[]): RegExp {
  return new RegExp(
    `\\.(${extensions
      .map(ext => ext.trim())
      .map(ext => (ext.startsWith('.') ? ext.slice(1) : ext))
      .join('|')})$`,
    'i',
  );
}

export function getDataUrlCondition(dataUriLimit = DEFAULT_DATA_URL_SIZE) {
  return (source: Buffer, { filename }: { filename: string }): boolean => {
    const queryString = filename.split('?')[1];

    if (queryString) {
      const params = new URLSearchParams(queryString);

      // If a request has query like "foo.png?__inline=false" or "foo.png?url",
      // no matter how small the file is, it will still be treated as a resource instead of being inlined
      const url = params.get('url');
      const legacyInline = params.get('__inline');
      if (legacyInline === 'false' || url !== null) {
        return false;
      }

      // If a request has query like "foo?inline" or "foo?__inline", no matter how big the file is,
      // it will be inlined instead of treated as a resource
      const inline = params.get('inline');
      if (inline !== null || legacyInline !== null) {
        return true;
      }
    }

    return source.length <= dataUriLimit;
  };
}

export function removeErrorStackHead(stack: string, count: number) {
  const [heading, ...body] = stack.split('\n');
  return [heading, ...body.slice(count)].join('\n');
}

export function catchErrorStack(message: string, skip: number) {
  const err = new Error(message);
  err.stack = removeErrorStackHead(err.stack || '', skip + 1);
  return err;
}
