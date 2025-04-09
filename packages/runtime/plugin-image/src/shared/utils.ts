export function invariant(
  condition: unknown,
  message: string | Error,
): asserts condition {
  if (!condition) {
    throw message instanceof Error ? message : new Error(message);
  }
}

export function isModuleNotFoundError(err: unknown): boolean {
  return (
    err instanceof Error &&
    'code' in err &&
    (err.code === 'ERR_MODULE_NOT_FOUND' || err.code === 'MODULE_NOT_FOUND')
  );
}
