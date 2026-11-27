import type { BridgeRenderInfo } from './types';
import { getScopedRootDefinition } from '../core/react/scopeDefinition';
import {
  INTERNAL_CONSUMER_KEY,
  INTERNAL_MOUNT_ID_KEY,
  type ApplicationRef,
} from './applications/types';

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
  INTERNAL_MOUNT_ID_KEY,
  INTERNAL_CONSUMER_KEY,
]);

export function applicationProps(info: BridgeRenderInfo) {
  return Object.fromEntries(
    Object.entries(info).filter(([key]) => !infrastructure.has(key)),
  );
}

export function extractMountMetadata(
  source: Record<string, unknown> | undefined,
): {
  mountId?: string;
  consumer?: ApplicationRef;
  props: Record<string, unknown>;
} {
  if (!source) return { props: {} };
  const mountId =
    typeof source[INTERNAL_MOUNT_ID_KEY] === 'string'
      ? (source[INTERNAL_MOUNT_ID_KEY] as string)
      : undefined;
  const consumer =
    source[INTERNAL_CONSUMER_KEY] &&
    typeof source[INTERNAL_CONSUMER_KEY] === 'object'
      ? (source[INTERNAL_CONSUMER_KEY] as ApplicationRef)
      : undefined;
  const props = Object.fromEntries(
    Object.entries(source).filter(
      ([key]) => key !== INTERNAL_MOUNT_ID_KEY && key !== INTERNAL_CONSUMER_KEY,
    ),
  );
  return { mountId, consumer, props };
}
