import type React from 'react';
import type {
  BridgeNavigation,
  ProviderFnParams,
} from '@module-federation/bridge-react/base';

/** Structural Bridge contracts keep the framework independent of an MF runtime. */
export interface BridgeRenderInfo {
  rootComponent?: React.ComponentType<any>;
  url?: string;
  basename?: string;
  navigation?: BridgeNavigation;
  memoryRoute?: { entryPath: string };
  signal?: AbortSignal;
  rootOptions?: {
    identifierPrefix?: string;
    onRecoverableError?: (error: unknown) => void;
  };
  [key: string]: unknown;
}

export interface BridgeHydrateInfo extends BridgeRenderInfo {
  snapshot: unknown;
  updates?: ReadableStream<unknown>;
}

export interface BridgeStreamInfo {
  rootComponent?: React.ComponentType<any>;
  url: string;
  basename?: string;
  memoryRoute?: { entryPath: string };
  identifierPrefix: string;
  headers?: Record<string, string>;
  props: Record<string, unknown>;
  nonce?: string;
  signal: AbortSignal;
  /** Server request ownership, never serialized into hydration data. */
  work?: { track<T>(promise: Promise<T>): Promise<T> };
}

/** Modern supplies its application lifecycle while Core owns the Bridge provider. */
export type ModernBridgeComponentOptions<Props = Record<string, unknown>> =
  Omit<
    ProviderFnParams<Props>,
    'createRoot' | 'hydrateRoot' | 'render' | 'hydrate' | 'renderStream'
  >;

export interface BridgeStreamResult {
  stream: ReadableStream<Uint8Array>;
  hydration: {
    snapshot: Promise<unknown>;
    updates: ReadableStream<unknown>;
    shellMarker: string;
  };
  abort(reason?: unknown): void;
}

export interface BridgeRoot {
  render(element: React.ReactNode): void;
  unmount(): void;
}
