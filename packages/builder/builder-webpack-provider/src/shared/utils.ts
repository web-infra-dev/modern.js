import {
  DEFAULT_BROWSERSLIST,
  getBrowserslist,
} from '@modern-js/builder-shared';
import type { Buffer } from 'buffer';
import type { SomeJSONSchema } from '@modern-js/utils/ajv/json-schema';
import { URLSearchParams } from 'url';
import type { BuilderConfig, DataUriLimit, NormalizedConfig } from '../types';

export async function getBrowserslistWithDefault(
  path: string,
  config: BuilderConfig,
) {
  if (config?.output?.overrideBrowserslist) {
    return config.output.overrideBrowserslist;
  }

  const result = await getBrowserslist(path);
  return result || DEFAULT_BROWSERSLIST;
}

/** Preserving the details of schema by generic types. */
export const defineSchema = <T extends SomeJSONSchema>(schema: T): T => schema;

export const getDataUrlLimit = (
  config: NormalizedConfig,
  type: keyof DataUriLimit,
) => {
  const { dataUriLimit } = config.output;
  const ret = dataUriLimit[type];
  if (typeof ret !== 'number') {
    throw new Error(`unknown key ${type} in "output.dataUriLimit"`);
  }
  return ret;
};

export function getDataUrlCondition(
  config: NormalizedConfig,
  type: keyof DataUriLimit,
) {
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

    return source.length <= getDataUrlLimit(config, type);
  };
}

export async function stringifyConfig(config: unknown, verbose?: boolean) {
  const { default: WebpackChain } = await import(
    '../../compiled/webpack-5-chain'
  );

  // webpackChain.toString can be used as a common stringify method
  const stringify = WebpackChain.toString as (
    config: unknown,
    options: { verbose?: boolean },
  ) => string;

  return stringify(config as any, { verbose });
}
