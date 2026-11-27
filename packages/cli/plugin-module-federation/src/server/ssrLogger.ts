import { createDebugger, logger as defaultLogger } from '@modern-js/utils';

export type MFSSRLogLevel = 'info' | 'warn' | 'error';

export interface MFSSRLogger {
  info?(...args: unknown[]): void;
  warn?(...args: unknown[]): void;
  error?(...args: unknown[]): void;
}

export interface MFSSRLogOptions {
  mode?: 'dev' | 'prod' | 'global';
  logger?: MFSSRLogger | false;
}

export const mfSSRDebug = createDebugger('mf-ssr');
export const mfSSRVerboseDebug = createDebugger('mf-ssr:verbose');

export function isMFSSRDebugEnabled(): boolean {
  return Boolean(mfSSRDebug.enabled);
}

export function isMFSSRVerboseDebugEnabled(): boolean {
  return Boolean(mfSSRVerboseDebug.enabled);
}

const LOG_LEVEL_RANK: Record<string, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  verbose: 4,
};

function shouldLogInMode(
  level: MFSSRLogLevel,
  mode?: 'dev' | 'prod' | 'global',
): boolean {
  if (mode === 'dev') return true;
  const configured = process.env.MODERN_SERVER_LOG_LEVEL?.toLowerCase();
  if (!configured) return true;
  const rank = LOG_LEVEL_RANK[configured];
  if (rank === undefined) return true;
  return LOG_LEVEL_RANK[level] <= rank;
}

function resolveLogger(custom?: MFSSRLogger | false): MFSSRLogger | undefined {
  if (custom === false) return undefined;
  return custom ?? defaultLogger;
}

const MAX_VALUE_LENGTH = 400;

function sanitizeString(value: string): string | undefined {
  const singleLine = value.replace(/\r?\n+/g, ' ').trim();
  if (!singleLine) return undefined;
  const truncated =
    singleLine.length > MAX_VALUE_LENGTH
      ? `${singleLine.slice(0, MAX_VALUE_LENGTH - 3)}...`
      : singleLine;
  if (/[\s="\\]/.test(truncated)) {
    return `"${truncated.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return truncated;
}

function formatFieldValue(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return undefined;
    return String(value);
  }
  if (typeof value === 'string') {
    return sanitizeString(value);
  }
  if (Array.isArray(value)) {
    const items = value
      .map(item =>
        item === undefined || item === null ? '' : String(item).trim(),
      )
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
  options?: MFSSRLogOptions,
): void {
  if (!shouldLogInMode(level, options?.mode)) return;
  const target = resolveLogger(options?.logger);
  if (!target?.[level]) return;
  const formattedFields = formatLogFields(fields);
  const head = headline ? `[MF SSR] ${event} ${headline}` : `[MF SSR] ${event}`;
  const line = formattedFields ? `${head} ${formattedFields}` : head;
  target[level]!(line);
}

export function logMFSSRError(
  event: string,
  fields: Record<string, unknown> | undefined,
  error: unknown,
  options?: MFSSRLogOptions,
): void {
  if (!shouldLogInMode('error', options?.mode)) return;
  const target = resolveLogger(options?.logger);
  if (!target?.error) return;
  const formattedFields = formatLogFields(fields);
  const line = formattedFields
    ? `[MF SSR] ${event} ${formattedFields}`
    : `[MF SSR] ${event}`;
  target.error(line, error);
}

export function debugMFSSR(
  event: string,
  fields?: Record<string, unknown> | (() => Record<string, unknown>),
): void {
  if (!mfSSRDebug.enabled) return;
  const resolved = typeof fields === 'function' ? fields() : fields;
  const formattedFields = formatLogFields(resolved);
  mfSSRDebug(formattedFields ? `${event} ${formattedFields}` : event);
}

export function debugMFSSRVerbose(
  event: string,
  fields?: Record<string, unknown> | (() => Record<string, unknown>),
): void {
  if (!mfSSRVerboseDebug.enabled) return;
  const resolved = typeof fields === 'function' ? fields() : fields;
  const formattedFields = formatLogFields(resolved);
  mfSSRVerboseDebug(formattedFields ? `${event} ${formattedFields}` : event);
}

export interface WindowedThrottle<T> {
  record(key: string, payload: T): void;
  flush(): void;
  clear(): void;
  size(): number;
}

export function createWindowedThrottle<T>(options: {
  windowMs: number;
  onEmit: (payload: T, suppressed: number) => void;
  autoFlush?: boolean;
}): WindowedThrottle<T> {
  const windows = new Map<
    string,
    { lastLoggedAt: number; suppressed: number; latest: T }
  >();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  const flushInternal = (force: boolean) => {
    clearTimer();
    const now = Date.now();
    let hasActive = false;
    for (const [key, state] of windows) {
      if (state.suppressed > 0) {
        const { latest, suppressed } = state;
        windows.delete(key);
        options.onEmit(latest, suppressed);
      } else if (force || now - state.lastLoggedAt >= options.windowMs) {
        windows.delete(key);
      } else {
        hasActive = true;
      }
    }
    if (!force && options.autoFlush && hasActive) {
      scheduleFlush();
    }
  };

  const scheduleFlush = () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = undefined;
      flushInternal(false);
    }, options.windowMs);
    timer.unref?.();
  };

  return {
    record(key: string, payload: T) {
      const now = Date.now();
      const existing = windows.get(key);
      if (existing && now - existing.lastLoggedAt < options.windowMs) {
        existing.suppressed++;
        existing.latest = payload;
        if (options.autoFlush) scheduleFlush();
        return;
      }
      const suppressed = existing?.suppressed || 0;
      windows.set(key, {
        lastLoggedAt: now,
        suppressed: 0,
        latest: payload,
      });
      if (options.autoFlush) scheduleFlush();
      options.onEmit(payload, suppressed);
    },
    flush() {
      flushInternal(true);
    },
    clear() {
      clearTimer();
      windows.clear();
    },
    size() {
      return windows.size;
    },
  };
}
