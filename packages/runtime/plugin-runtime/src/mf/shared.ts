import type { BridgeRenderInfo } from './types';

export function applicationURL(
  info: Pick<BridgeRenderInfo, 'url' | 'memoryRoute'>,
  fallback: string,
): string {
  return new URL(
    info.memoryRoute?.entryPath || info.url || fallback,
    fallback,
  ).toString();
}

const infrastructure = new Set([
  'dom',
  'signal',
  'moduleName',
  'basename',
  'memoryRoute',
  'rootOptions',
  'fallback',
  'snapshot',
  'updates',
]);

export function applicationProps(info: BridgeRenderInfo) {
  return Object.fromEntries(
    Object.entries(info).filter(([key]) => !infrastructure.has(key)),
  );
}
