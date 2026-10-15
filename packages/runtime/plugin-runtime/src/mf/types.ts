import type React from 'react';
import type { ApplicationStream } from '../application/server';

/** Structural Bridge contracts keep the framework independent of an MF runtime. */
export interface BridgeRenderInfo {
  url?: string;
  basename?: string;
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
  url: string;
  basename?: string;
  memoryRoute?: { entryPath: string };
  identifierPrefix: string;
  headers?: Record<string, string>;
  props: Record<string, unknown>;
  nonce?: string;
  signal: AbortSignal;
}

export interface BridgeStreamResult {
  revision?: string;
  stream: ApplicationStream['stream'];
  snapshot: Promise<unknown>;
  hydration?: ApplicationStream['hydration'];
  abort(reason?: unknown): void;
}

export interface BridgeRoot {
  render(element: React.ReactNode): void;
  unmount(): void;
}
