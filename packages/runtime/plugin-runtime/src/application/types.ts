import type { BridgeNavigation } from '@module-federation/bridge-react/base';
import type { RouterSSRData } from '../core/types';

/** Serializable state for one independently rendered Modern application. */
export interface ApplicationSnapshot {
  protocol: 'modern-application/1';
  /** Present when the HTML includes the progressive shell marker. */
  shellMarker?: string;
  reactVersion: string;
  identifierPrefix: string;
  url: string;
  basename: string;
  memoryRoute?: { entryPath: string };
  props: Record<string, unknown>;
  initialData?: Record<string, unknown>;
  routerData?: RouterSSRData;
}

export interface ApplicationPendingValue {
  id: string;
  /** A path in the snapshot, or in a fulfilled update's value. */
  path: Array<string | number>;
}

export interface ApplicationSnapshotV2 extends Omit<
  ApplicationSnapshot,
  'protocol' | 'shellMarker'
> {
  protocol: 'modern-application/2';
  shellMarker: string;
  pending: ApplicationPendingValue[];
}

export type ApplicationDataPatch =
  | {
      id: string;
      status: 'fulfilled';
      value: unknown;
      pending: ApplicationPendingValue[];
    }
  | {
      id: string;
      status: 'rejected';
      error: { name: string; message: string; stack?: string };
    };

export interface ApplicationOptions {
  url: string;
  basename?: string;
  identifierPrefix?: string;
  props?: Record<string, unknown>;
  signal?: AbortSignal;
  memoryRoute?: { entryPath: string };
  navigation?: BridgeNavigation;
  onRecoverableError?: (error: unknown) => void;
}
