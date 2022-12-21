import { URLSearchParams } from 'url';

import type { Buffer } from 'buffer';
import type { DataUriLimit } from '@modern-js/builder-shared';
import type { NormalizedConfig } from '../types';

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

    return source.length <= config.output.dataUriLimit[type];
  };
}

export async function stringifyConfig(config: unknown, verbose?: boolean) {
  const { default: WebpackChain } = await import(
    '@modern-js/builder-shared/webpack-5-chain'
  );

  // webpackChain.toString can be used as a common stringify method
  const stringify = WebpackChain.toString as (
    config: unknown,
    options: { verbose?: boolean },
  ) => string;

  return stringify(config as any, { verbose });
}
