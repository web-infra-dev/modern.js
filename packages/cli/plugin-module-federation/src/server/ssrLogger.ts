import { createDebugger, logger } from '@modern-js/utils';

export type MFSSRLogLevel = 'info' | 'warn' | 'error';

const mfSSRLoggedKey = Symbol.for('modern-js.mf.ssr.logged');

export function markMFSSRLogged(error: unknown): void {
  if (error && typeof error === 'object') {
    try {
      Object.defineProperty(error, mfSSRLoggedKey, {
        value: true,
        configurable: true,
      });
    } catch {
      // Frozen/non-extensible error objects stay untouched.
    }
  }
}

export function isMFSSRLogged(error: unknown): boolean {
  return Boolean(
    error && typeof error === 'object' && (error as any)[mfSSRLoggedKey],
  );
}

export const mfSSRDebug = createDebugger('mf-ssr');

export function isMFSSRDebugEnabled(): boolean {
  return Boolean(mfSSRDebug.enabled);
}

const MAX_VALUE_LENGTH = 400;

function sanitizeString(value: string): string {
  const singleLine = value.replace(/\r?\n+/g, ' ').trim();
  const truncated =
    singleLine.length > MAX_VALUE_LENGTH
      ? `${singleLine.slice(0, MAX_VALUE_LENGTH - 3)}...`
      : singleLine;
  if (!truncated) return '""';
  if (/[\s="]/.test(truncated)) {
    return `"${truncated.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return truncated;
}

function formatFieldValue(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return undefined;
    return Number.isInteger(value) ? String(value) : String(Math.round(value));
  }
  if (typeof value === 'string') {
    return value ? sanitizeString(value) : undefined;
  }
  if (Array.isArray(value)) {
    const items = value
      .map(item => (item === undefined || item === null ? '' : String(item)))
      .filter(Boolean);
    if (!items.length) return undefined;
    return sanitizeString(items.join(','));
  }
  if (value instanceof Error) {
    return sanitizeString(value.message || value.name || 'Error');
  }
  return sanitizeString(String(value));
}

export function formatLogFields(fields?: Record<string, unknown>): string {
  if (!fields) return '';
  const parts: string[] = [];
  for (const [key, raw] of Object.entries(fields)) {
    const formatted = formatFieldValue(raw);
    if (formatted !== undefined) {
      parts.push(`${key}=${formatted}`);
    }
  }
  return parts.join(' ');
}

export function formatTimings(
  timingsMs?: Record<string, number>,
): string | undefined {
  if (!timingsMs) return undefined;
  const parts: string[] = [];
  for (const [stage, value] of Object.entries(timingsMs)) {
    if (stage === 'total' || !Number.isFinite(value)) continue;
    const ms = Math.round(value);
    if (ms > 0) parts.push(`${stage}:${ms}`);
  }
  return parts.length ? parts.join(',') : undefined;
}

export function extractTargetVersion(target?: {
  manifest?: unknown;
  moduleInfo?: unknown;
}): string | undefined {
  const fromManifest = (target?.manifest as any)?.metaData?.buildInfo
    ?.buildVersion;
  if (typeof fromManifest === 'string' && fromManifest) return fromManifest;
  const fromModuleInfo = (target?.moduleInfo as any)?.buildVersion;
  if (typeof fromModuleInfo === 'string' && fromModuleInfo) {
    return fromModuleInfo;
  }
  return undefined;
}

export function formatRemoteTransitions(
  remotes: Array<{
    name: string;
    fromVersion?: string;
    toVersion?: string;
    note?: string;
  }>,
): string {
  return remotes
    .map(({ name, fromVersion, toVersion, note }) => {
      if (fromVersion && toVersion && fromVersion !== toVersion) {
        return `${name} (${fromVersion}->${toVersion})`;
      }
      if (toVersion) return `${name} (${toVersion})`;
      if (note) return `${name} (${note})`;
      return name;
    })
    .join(', ');
}

export function formatErrorMessage(error: unknown): string {
  if (error instanceof AggregateError && error.errors?.length) {
    const inner = error.errors
      .map(item => (item instanceof Error ? item.message : String(item)))
      .filter(Boolean)
      .join('; ');
    return inner ? `${error.message}: ${inner}` : error.message;
  }
  if (error instanceof Error) return error.message || error.name;
  return String(error);
}

export function logMFSSR(
  level: MFSSRLogLevel,
  event: string,
  fields?: Record<string, unknown>,
  headline?: string,
): void {
  const formattedFields = formatLogFields(fields);
  const head = headline ? `[MF SSR] ${event} ${headline}` : `[MF SSR] ${event}`;
  const line = formattedFields ? `${head} ${formattedFields}` : head;
  logger[level](line);
}

export function debugMFSSR(
  event: string,
  fields?: Record<string, unknown>,
): void {
  if (!mfSSRDebug.enabled) return;
  const formattedFields = formatLogFields(fields);
  mfSSRDebug(formattedFields ? `${event} ${formattedFields}` : event);
}
