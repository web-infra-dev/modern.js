import type { BridgeNavigation } from '@module-federation/bridge-react/base';
import type { RouterSSRData } from '../core/types';
import type { APPLICATION_SNAPSHOT_PROTOCOL } from './constants';

/** Serializable state for one independently rendered Modern application. */
export interface ApplicationSnapshot {
  protocol: typeof APPLICATION_SNAPSHOT_PROTOCOL;
  shellMarker: string;
  pending: ApplicationPendingValue[];
  reactVersion: string;
  identifierPrefix: string;
  url: string;
  basename: string;
  memoryRoute?: { entryPath: string };
  props: Record<string, unknown>;
  initialData?: Record<string, unknown>;
  /** Initial language for this application, independent of the outer document. */
  i18nData?: { lng: string };
  routerData?: RouterSSRData;
}

export interface ApplicationPendingValue {
  id: string;
  /** A path in the snapshot, or in a fulfilled update's value. */
  path: Array<string | number>;
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
