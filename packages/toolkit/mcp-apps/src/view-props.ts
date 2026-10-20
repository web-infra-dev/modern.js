import type { RemoteToolHandlerResult } from './config';

type BusinessResult<T extends Record<string, unknown>> = Omit<
  RemoteToolHandlerResult,
  'structuredContent' | 'viewProps'
> & { structuredContent: T };

/** Explicitly reuse structured business data as card props, optionally mapping it. */
export function withViewProps<T extends Record<string, unknown>>(
  result: BusinessResult<T>,
): BusinessResult<T> & { viewProps: T };
export function withViewProps<
  T extends Record<string, unknown>,
  P extends Record<string, unknown>,
>(
  result: BusinessResult<T>,
  select: (data: T) => P,
): BusinessResult<T> & { viewProps: P };
export function withViewProps<
  T extends Record<string, unknown>,
  P extends Record<string, unknown>,
>(result: BusinessResult<T>, select?: (data: T) => P) {
  return {
    ...result,
    viewProps: select
      ? select(result.structuredContent)
      : result.structuredContent,
  };
}
