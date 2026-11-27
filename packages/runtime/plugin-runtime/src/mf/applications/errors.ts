import type { ApplicationRef } from './types';

export const SNAPSHOT_EXPIRED_CODE = 'MODERN_APPLICATIONS_SNAPSHOT_EXPIRED';

export interface SnapshotExpiredErrorOptions {
  source?: string;
  expectedSid?: string;
  receivedSid?: string;
  cause?: unknown;
}

export class SnapshotExpiredError extends Error {
  readonly code = SNAPSHOT_EXPIRED_CODE;
  readonly source?: string;
  readonly expectedSid?: string;
  readonly receivedSid?: string;

  constructor(
    message = 'Deployment snapshot has expired.',
    options: SnapshotExpiredErrorOptions = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = 'SnapshotExpiredError';
    this.source = options.source;
    this.expectedSid = options.expectedSid;
    this.receivedSid = options.receivedSid;
  }
}

export function createSnapshotExpiredError(
  message?: string,
  options?: SnapshotExpiredErrorOptions,
): SnapshotExpiredError {
  return new SnapshotExpiredError(message, options);
}

export function isSnapshotExpiredError(
  error: unknown,
): error is SnapshotExpiredError {
  return (
    error instanceof SnapshotExpiredError ||
    Boolean(
      error &&
      typeof error === 'object' &&
      (error as { code?: unknown }).code === SNAPSHOT_EXPIRED_CODE,
    )
  );
}

export type ApplicationsDiscoveryErrorCode =
  | 'HOOK_MISSING'
  | 'INVALID_RESULT'
  | 'INVALID_ROUTE'
  | 'MISSING_DISCOVER_CHILDREN'
  | 'MODULE_CONFLICT'
  | 'UNRESOLVED_VERSION'
  | 'CYCLE_DETECTED'
  | 'MAX_DEPTH_EXCEEDED'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'RELOAD_LOOP';

export interface ApplicationsDiscoveryErrorDetails {
  code: ApplicationsDiscoveryErrorCode;
  target?: string;
  consumer?: ApplicationRef | null;
  mountId?: string;
  depth?: number;
  cause?: unknown;
}

export class ApplicationsDiscoveryError extends Error {
  readonly code: ApplicationsDiscoveryErrorCode;
  readonly target?: string;
  readonly consumer?: ApplicationRef | null;
  readonly mountId?: string;
  readonly depth?: number;

  constructor(message: string, details: ApplicationsDiscoveryErrorDetails) {
    super(
      message,
      details.cause !== undefined ? { cause: details.cause } : undefined,
    );
    this.name = 'ApplicationsDiscoveryError';
    this.code = details.code;
    this.target = details.target;
    this.consumer = details.consumer;
    this.mountId = details.mountId;
    this.depth = details.depth;
  }
}
