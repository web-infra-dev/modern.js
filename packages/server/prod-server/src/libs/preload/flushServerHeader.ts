import { OutgoingHttpHeaders } from 'http';
import { ServerOptions } from '@modern-js/server-core';
import { ModernServerContext } from '@modern-js/types';
import { parseLinks } from './parseLinks';
import { transformLinks2String } from './transformLinks2String';

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

  // Some deploy platforms not support flushHeaders firstly.
  // So we pipe a some string for flush headers.
  // For deploy platforms we need enough string to fill it.
  const mockHtml = '<script></script>';
  const s = new Array(mockHtml.length).fill(' ').join('');
  res.write(s);
}
