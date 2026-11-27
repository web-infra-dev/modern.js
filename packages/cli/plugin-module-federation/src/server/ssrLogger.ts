import type { SSRCoordinatorEvent } from '@modern-js/server-core/node';
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

export interface MFSSRScopedLoggerOptions {
  app?: string;
  mode?: 'dev' | 'prod';
  logger?: MFSSRLogger | false;
}

export interface MFSSRRemoteTransition {
  name: string;
  fromVersion?: string;
  toVersion?: string;
  note?: string;
}

export interface MFSSRManifest503Info {
  path: string;
  reason: 'wait-timeout' | 'ssr-not-ready' | 'not-ready';
  waitedMs?: number;
  buildReady: boolean;
  ssrReady?: boolean;
  waitHeader: boolean;
}

export interface MFSSRScopedLogger {
  updateStart(info: {
    mode?: 'dev' | 'prod' | 'global';
    trigger?: string;
    operationId: string;
    remotes: MFSSRRemoteTransition[];
  }): void;
  updateReady(info: {
    mode?: 'dev' | 'prod' | 'global';
    remotes: string[];
    planMode: 'snapshot' | 'entries' | 'application';
    entries?: string[];
    reasons?: string[];
    generation?: number;
    timingsMs?: Record<string, number>;
    operationId: string;
  }): void;
  updateFallback(info: {
    remotes: string[];
    error: unknown;
    operationId?: string;
  }): void;
  updateFailed(info: {
    mode?: 'dev' | 'prod' | 'global';
    remotes?: string[];
    stage: string;
    mutationStarted?: boolean;
    phase?: string;
    timingsMs?: Record<string, number>;
    operationId?: string;
    error: unknown;
  }): void;
  updateAborted(info: {
    remotes: string[];
    stage: string;
    operationId?: string;
  }): void;
  coordinatorEvent(event: SSRCoordinatorEvent): void;
  manifest503(info: MFSSRManifest503Info): void;
  clearManifest503(): void;
  flush(): void;
  dispose(): void;
}

interface WindowedThrottle<T> {
  record(key: string, payload: T): void;
  flush(): void;
  clear(): void;
}

function createWindowedThrottle<T>(options: {
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
  };
}

export function createMFSSRLogger(
  options: MFSSRScopedLoggerOptions = {},
): MFSSRScopedLogger {
  const { app, mode: defaultMode = 'prod', logger } = options;
  let admissionThrottle:
    | WindowedThrottle<Extract<SSRCoordinatorEvent, { type: 'admission' }>>
    | undefined;
  let manifest503Throttle: WindowedThrottle<MFSSRManifest503Info> | undefined;

  const withApp = (
    fields?: Record<string, unknown>,
  ): Record<string, unknown> | undefined => {
    if (!app) return fields;
    if (!fields) return { app };
    return 'app' in fields ? fields : { app, ...fields };
  };

  return {
    updateStart(info) {
      const mode = info.mode ?? defaultMode;
      logMFSSR(
        'info',
        'Updating',
        withApp({
          mode,
          trigger: info.trigger || 'api',
          op: info.operationId,
        }),
        formatRemoteTransitions(info.remotes) || undefined,
        { mode, logger },
      );
    },
    updateReady(info) {
      const mode = info.mode ?? defaultMode;
      const scope =
        info.planMode === 'entries'
          ? 'partial'
          : info.planMode === 'snapshot'
            ? 'snapshot'
            : 'full';
      const headline = info.remotes.length
        ? info.remotes.join(', ')
        : undefined;
      logMFSSR(
        'info',
        'Ready',
        withApp({
          mode,
          scope,
          entries: scope === 'partial' ? info.entries : undefined,
          reason: scope === 'full' ? info.reasons : undefined,
          gen: info.generation,
          durationMs:
            info.timingsMs?.total !== undefined
              ? Math.round(info.timingsMs.total)
              : undefined,
          timings: formatTimings(info.timingsMs),
          op: info.operationId,
        }),
        headline,
        { mode, logger },
      );
    },
    updateFallback(info) {
      logMFSSR(
        'warn',
        'Fallback',
        withApp({
          scope: 'partial->full',
          remotes: info.remotes,
          reason: formatErrorMessage(info.error),
          op: info.operationId,
        }),
        undefined,
        { mode: defaultMode, logger },
      );
    },
    updateFailed(info) {
      const mode = info.mode ?? defaultMode;
      logMFSSRError(
        'Failed',
        withApp({
          remotes: info.remotes,
          mode,
          stage: info.stage,
          mutationStarted: info.mutationStarted,
          phase: info.phase,
          durationMs:
            info.timingsMs?.total !== undefined
              ? Math.round(info.timingsMs.total)
              : undefined,
          op: info.operationId,
        }),
        info.error,
        { mode, logger },
      );
    },
    updateAborted(info) {
      debugMFSSR('update-aborted', () => ({
        remotes: info.remotes,
        stage: info.stage,
        op: info.operationId,
      }));
    },
    coordinatorEvent(event) {
      if (event.type === 'admission') {
        if (event.decision === 'csr' && event.reason === 'updating') {
          debugMFSSRVerbose('admission', () => ({
            app,
            decision: event.decision,
            reason: event.reason,
            phase: event.phase,
            gen: event.generation,
            entry: event.entryName,
            waitedMs: Math.round(event.waitedMs),
            active: event.activeRequests,
            pending: event.pendingRequests,
          }));
          return;
        }
        admissionThrottle ||= createWindowedThrottle({
          windowMs: 5_000,
          autoFlush: true,
          onEmit: (e, suppressed) => {
            logMFSSR(
              'warn',
              'Admission',
              withApp({
                decision: e.decision,
                reason: e.reason,
                phase: e.phase,
                gen: e.generation,
                entry: e.entryName,
                waitedMs: Math.round(e.waitedMs),
                active: e.activeRequests,
                pending: e.pendingRequests,
                suppressed: suppressed > 0 ? suppressed : undefined,
              }),
              undefined,
              { mode: defaultMode, logger },
            );
          },
        });
        admissionThrottle.record(
          `${event.phase}|${event.decision}|${event.reason}`,
          event,
        );
      } else if (event.type === 'drain-timeout') {
        logMFSSR(
          'warn',
          'Drain timeout',
          withApp({
            drainTimeoutMs: event.drainTimeoutMs,
            active: event.activeRequests,
            scope: event.closedScope ?? 'all',
            gen: event.generation,
          }),
          undefined,
          { mode: defaultMode, logger },
        );
      }
    },
    manifest503(info) {
      if (!info.waitHeader && info.reason === 'not-ready') {
        debugMFSSR('manifest-503', () => ({
          path: info.path,
          reason: info.reason,
          buildReady: info.buildReady,
          ssrReady: info.ssrReady,
          waitHeader: 0,
        }));
        return;
      }
      manifest503Throttle ||= createWindowedThrottle({
        windowMs: 5_000,
        onEmit: (item, suppressed) => {
          logMFSSR(
            'warn',
            'Manifest 503',
            withApp({
              path: item.path,
              reason: item.reason,
              waitedMs:
                item.waitedMs !== undefined
                  ? Math.round(item.waitedMs)
                  : undefined,
              buildReady: item.buildReady,
              ssrReady: item.ssrReady,
              waitHeader: item.waitHeader ? 1 : 0,
              suppressed: suppressed > 0 ? suppressed : undefined,
            }),
            undefined,
            { mode: defaultMode, logger },
          );
        },
      });
      manifest503Throttle.record(`${info.path}|${info.reason}`, info);
    },
    clearManifest503() {
      manifest503Throttle?.clear();
    },
    flush() {
      admissionThrottle?.flush();
    },
    dispose() {
      admissionThrottle?.flush();
      admissionThrottle?.clear();
      manifest503Throttle?.clear();
    },
  };
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
