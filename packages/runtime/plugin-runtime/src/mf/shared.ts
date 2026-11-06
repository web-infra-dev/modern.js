import type { BridgeRenderInfo } from './types';
import { getScopedRootDefinition } from '../core/react/scopeDefinition';

export function applicationDefinition(
  info: Pick<BridgeRenderInfo, 'rootComponent'>,
) {
  const definition =
    info.rootComponent && getScopedRootDefinition(info.rootComponent);
  if (!definition) {
    throw new Error(
      'Modern Bridge callbacks require a createRoot export with a runtime registry import.',
    );
  }
  return definition;
}

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
  'rootComponent',
  'navigation',
  'url',
]);

export function applicationProps(info: BridgeRenderInfo) {
  return Object.fromEntries(
    Object.entries(info).filter(([key]) => !infrastructure.has(key)),
  );
}
