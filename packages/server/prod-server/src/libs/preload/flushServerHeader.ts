import { OutgoingHttpHeaders } from 'http';
import { ServerOptions } from '@modern-js/server-core';
import { ModernServerContext } from '@modern-js/types';
import { parseLinks } from './parseLinks';
import { transformLinks2String } from './transformLinks2String';

export function transformToRegExp(input: string | RegExp): RegExp {
  if (typeof input === 'string') {
    return new RegExp(input);
  }
  return input;
}

export function shouldFlushServerHeader(
  serverConf: ServerOptions['server'],
  userAgent?: string,
  disablePreload?: boolean,
) {
  const { ssr: ssrConf } = serverConf || {};

  if (disablePreload) {
    return false;
  }

  if (typeof ssrConf === 'object' && ssrConf.preload) {
    // ssr.preload: 'object'
    if (typeof ssrConf.preload === 'object') {
      const { userAgentFilter } = ssrConf.preload;
      if (userAgentFilter && userAgent) {
        return !transformToRegExp(userAgentFilter).test(userAgent);
      }
      return true;
    }
    // ssr.preload: true;
    return true;
  }

  // ssr: false or ssr: true
  return false;
}

export interface FlushServerHeaderOptions {
  ctx: ModernServerContext;
  distDir: string;
  template: string;
  serverConf: ServerOptions['server'];
  headers?: OutgoingHttpHeaders;
}
export async function flushServerHeader({
  serverConf,
  ctx,
  distDir,
  template,
  headers,
}: FlushServerHeaderOptions) {
  const { ssr: ssrConf } = serverConf || {};
  if (typeof ssrConf !== 'object') {
    return;
  }
  const { res } = ctx;
  const links = await parseLinks({
    template,
    distDir,
    pathname: ctx.path,
  });
  const link = transformLinks2String(links, ssrConf.preload!);

  res.set('link', link);
  for (const key in headers || {}) {
    const value = headers?.[key];
    value && res.set(key, value);
  }

  res.flushHeaders();
}
