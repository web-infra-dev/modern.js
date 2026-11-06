/** Every owned resource is released even when a plugin cleanup fails. */
export function disposeResources(
  ...cleanups: Array<(() => unknown) | undefined>
) {
  const errors: unknown[] = [];
  for (const cleanup of cleanups) {
    try {
      cleanup?.();
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length)
    throw new AggregateError(errors, 'Application cleanup failed');
}

/** Cleanup must not hide the failure that stopped preparation or rendering. */
export function disposeAfterError(
  error: unknown,
  dispose: (reason?: unknown) => void,
): never {
  try {
    dispose(error);
  } catch (cleanupError) {
    throw new AggregateError(
      [error, cleanupError],
      'Application failed and cleanup also failed',
    );
  }
  throw error;
}
